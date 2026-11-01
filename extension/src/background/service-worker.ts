/**
 * Credible Extension - Background Service Worker
 * Handles message routing, side panel opening, context menus, and full scan orchestration:
 * popup requestScan -> inject content script -> extract page -> call API -> open side panel.
 */

import {
  ExtensionMessage,
  MessageType,
  ScanLifecycleState,
} from '../types/extension';
import { AnalysisReport, PageData, SelectionData } from '../types/analysis';
import { apiClient, mapErrorToUserMessage } from '../services/api-client';

// In-memory state cache
export let currentTabState: {
  tabId: number | null;
  state: ScanLifecycleState;
  statusText: string;
  report: AnalysisReport | null;
  selectionData: SelectionData | null;
  error: string | null;
} = {
  tabId: null,
  state: 'idle',
  statusText: 'Ready',
  report: null,
  selectionData: null,
  error: null,
};

/**
 * Broadcast message to active extension views (popup, sidepanel).
 */
export function broadcastMessage(message: ExtensionMessage): void {
  try {
    chrome.runtime?.sendMessage?.(message)?.catch?.(() => {
      // Views might not be open; non-fatal in Chrome MV3
    });
  } catch {
    // Suppress broadcast errors if no listeners
  }
}

// Setup context menus on installation
chrome.runtime?.onInstalled?.addListener?.(() => {
  chrome.contextMenus?.create?.({
    id: 'credible-verify-selection',
    title: 'Verify with Credible',
    contexts: ['selection'],
  });
});

// Context menu click listener: Select-to-Verify
chrome.contextMenus?.onClicked?.addListener?.((info, tab) => {
  if (info.menuItemId === 'credible-verify-selection' && tab?.id) {
    handleSelectionScan(tab.id, info.selectionText).catch((err) => {
      console.warn('[Credible SW] Selection scan failed:', err);
    });
  }
});

// Central message listener
chrome.runtime?.onMessage?.addListener?.(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (message.type) {
      case MessageType.REQUEST_SCAN: {
        handleRequestScan(message.tabId)
          .then((res) => sendResponse(res))
          .catch((err) =>
            sendResponse({ success: false, error: mapErrorToUserMessage(err) })
          );
        return true; // Keep message channel open for async response
      }

      case MessageType.OPEN_SIDEPANEL: {
        handleOpenSidePanel(message.tabId)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case MessageType.GET_LATEST_REPORT: {
        sendResponse({
          state: currentTabState.state,
          statusText: currentTabState.statusText,
          report: currentTabState.report,
          selectionData: currentTabState.selectionData,
          error: currentTabState.error,
        });
        return false;
      }

      case MessageType.SCAN_PROGRESS: {
        currentTabState.state = message.state;
        currentTabState.statusText = message.statusText;
        return false;
      }

      case MessageType.SCAN_SUCCESS: {
        currentTabState.state = 'completed';
        currentTabState.statusText = 'Scan Complete';
        currentTabState.report = message.report;
        currentTabState.selectionData = message.selectionData || null;
        currentTabState.error = null;
        return false;
      }

      case MessageType.SCAN_ERROR: {
        currentTabState.state = 'failed';
        currentTabState.statusText = 'Scan Failed';
        currentTabState.error = message.error;
        return false;
      }

      default:
        return false;
    }
  }
);

/**
 * Handle scan initiation request and execute full analysis pipeline.
 */
export async function handleRequestScan(explicitTabId?: number) {
  let targetTabId = explicitTabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      targetTabId = tabs[0].id;
    } else {
      const fallbackTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (fallbackTabs.length > 0 && fallbackTabs[0].id) {
        targetTabId = fallbackTabs[0].id;
      }
    }
  }

  if (!targetTabId) {
    throw new Error('No active tab found to scan');
  }

  // Prevent duplicate concurrent scans on the same tab
  if (
    currentTabState.tabId === targetTabId &&
    (currentTabState.state === 'extracting' || currentTabState.state === 'analyzing')
  ) {
    return {
      success: false,
      alreadyScanning: true,
      state: currentTabState.state,
    };
  }

  // Step 1: Update state to extracting
  currentTabState = {
    tabId: targetTabId,
    state: 'extracting',
    statusText: 'Reading visible page signals...',
    report: null,
    selectionData: null,
    error: null,
  };
  broadcastMessage({
    type: MessageType.SCAN_PROGRESS,
    state: 'extracting',
    statusText: 'Reading visible page signals...',
  });

  // Open side panel immediately so user sees live scan progress
  if (chrome.sidePanel?.open) {
    chrome.sidePanel.open({ tabId: targetTabId }).catch(() => {
      // Non-fatal if side panel is already open or unsupported
    });
  }

  // Step 2: Extract content from the active tab asynchronously
  let pageData: PageData;
  try {
    pageData = await extractPageFromTab(targetTabId);
  } catch (extractErr) {
    console.error('[Credible SW] Extraction failed:', extractErr);
    const errMsg = 'Failed to extract content from tab. Ensure page is not a protected browser URL.';
    currentTabState = {
      tabId: targetTabId,
      state: 'failed',
      statusText: 'Extraction Failed',
      report: null,
      selectionData: null,
      error: errMsg,
    };
    broadcastMessage({
      type: MessageType.SCAN_ERROR,
      error: errMsg,
    });
    return { success: false, error: errMsg };
  }

  // Step 3: Call backend analysis API
  currentTabState.state = 'analyzing';
  currentTabState.statusText = 'Evaluating threats and Trust DNA...';
  broadcastMessage({
    type: MessageType.SCAN_PROGRESS,
    state: 'analyzing',
    statusText: 'Evaluating threats and Trust DNA...',
  });

  try {
    const report = await apiClient.analyzePage(pageData);

    currentTabState = {
      tabId: targetTabId,
      state: 'completed',
      statusText: 'Scan Complete',
      report,
      selectionData: null,
      error: null,
    };

    broadcastMessage({
      type: MessageType.SCAN_SUCCESS,
      report,
    });

    try {
      chrome.storage?.local?.set?.({
        credible_latest_report: report,
      });
    } catch {
      // Non-fatal if storage is unavailable
    }

    return {
      success: true,
      tabId: targetTabId,
      state: 'completed',
      report,
    };
  } catch (apiErr) {
    const friendlyError = mapErrorToUserMessage(apiErr);
    currentTabState = {
      tabId: targetTabId,
      state: 'failed',
      statusText: 'Scan Failed',
      report: null,
      selectionData: null,
      error: friendlyError,
    };

    broadcastMessage({
      type: MessageType.SCAN_ERROR,
      error: friendlyError,
    });

    return {
      success: false,
      tabId: targetTabId,
      state: 'failed',
      error: friendlyError,
    };
  }
}

/**
 * Handle selection scan triggered from context menu.
 */
export async function handleSelectionScan(tabId: number, fallbackText?: string) {
  // Open side panel
  if (chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ tabId }).catch(() => {});
  }

  currentTabState = {
    tabId,
    state: 'extracting',
    statusText: 'Extracting selected text...',
    report: null,
    selectionData: null,
    error: null,
  };
  broadcastMessage({
    type: MessageType.SCAN_PROGRESS,
    state: 'extracting',
    statusText: 'Extracting selected text...',
  });

  let selectionData: SelectionData | null = null;
  try {
    selectionData = await extractSelectionFromTab(tabId);
  } catch {
    // If content script extract fails, fall back to context menu selection text
    if (fallbackText && fallbackText.trim()) {
      selectionData = {
        url: '',
        text: fallbackText.trim(),
        link: null,
      };
    }
  }

  // If extraction succeeded but had empty text and fallback text exists
  if ((!selectionData || !selectionData.text.trim()) && fallbackText && fallbackText.trim()) {
    selectionData = {
      url: selectionData?.url || '',
      text: fallbackText.trim(),
      link: selectionData?.link || null,
    };
  }

  // Validate non-empty selection
  if (!selectionData || !selectionData.text || !selectionData.text.trim()) {
    const errMsg = 'Selection is empty. Please select visible text to verify.';
    currentTabState = {
      tabId,
      state: 'failed',
      statusText: 'Selection Empty',
      report: null,
      selectionData: null,
      error: errMsg,
    };
    broadcastMessage({
      type: MessageType.SCAN_ERROR,
      error: errMsg,
    });
    return;
  }

  // Enforce 5,000 character maximum bound
  if (selectionData.text.length > 5000) {
    selectionData.text = selectionData.text.slice(0, 5000);
  }

  // Resolve target tab URL if missing
  if (!selectionData.url) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab?.url) {
        selectionData.url = tab.url;
      }
    } catch {
      // Non-fatal
    }
  }

  currentTabState.selectionData = selectionData;
  currentTabState.state = 'analyzing';
  currentTabState.statusText = 'Evaluating selection...';
  broadcastMessage({
    type: MessageType.SCAN_PROGRESS,
    state: 'analyzing',
    statusText: 'Evaluating selection...',
  });

  try {
    const report = await apiClient.analyzeSelection(selectionData);
    currentTabState = {
      tabId,
      state: 'completed',
      statusText: 'Scan Complete',
      report,
      selectionData,
      error: null,
    };
    broadcastMessage({
      type: MessageType.SCAN_SUCCESS,
      report,
      selectionData,
    });

    try {
      chrome.storage?.local?.set?.({
        credible_latest_report: report,
      });
    } catch {
      // Non-fatal if storage is unavailable
    }
  } catch (err) {
    const friendlyError = mapErrorToUserMessage(err);
    currentTabState = {
      tabId,
      state: 'failed',
      statusText: 'Scan Failed',
      report: null,
      selectionData: null,
      error: friendlyError,
    };
    broadcastMessage({
      type: MessageType.SCAN_ERROR,
      error: friendlyError,
    });
  }
}

/**
 * Extract page content from a tab via message or scripted injection.
 */
async function extractPageFromTab(tabId: number): Promise<PageData> {
  // Try sending message first
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_PAGE_CONTENT,
    });
    if (response?.success && response?.data) {
      return response.data;
    }
  } catch {
    // If content script was not already loaded, inject content.js on-demand
  }

  if (chrome.scripting?.executeScript) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    const responseAfterInject = await chrome.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_PAGE_CONTENT,
    });
    if (responseAfterInject?.success && responseAfterInject?.data) {
      return responseAfterInject.data;
    }
  }

  throw new Error('Unable to extract page data from tab');
}

/**
 * Extract text selection from a tab.
 */
async function extractSelectionFromTab(tabId: number): Promise<SelectionData> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_SELECTION_CONTENT,
    });
    if (response?.success && response?.data) {
      return response.data;
    }
  } catch {
    // Inject if needed
  }

  if (chrome.scripting?.executeScript) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    const responseAfterInject = await chrome.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_SELECTION_CONTENT,
    });
    if (responseAfterInject?.success && responseAfterInject?.data) {
      return responseAfterInject.data;
    }
  }

  throw new Error('Unable to extract selection data from tab');
}

/**
 * Handle opening side panel.
 */
export async function handleOpenSidePanel(explicitTabId?: number) {
  let targetTabId = explicitTabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      targetTabId = tabs[0].id;
    } else {
      const fallbackTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (fallbackTabs.length > 0 && fallbackTabs[0].id) {
        targetTabId = fallbackTabs[0].id;
      }
    }
  }

  if (targetTabId && chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ tabId: targetTabId });
  }
}
