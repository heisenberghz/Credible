/**
 * Credible Extension - Background Service Worker
 * Handles message routing, side panel opening, context menus, and scan state.
 */

import {
  ExtensionMessage,
  MessageType,
  ScanLifecycleState,
} from '../types/extension';
import { AnalysisReport } from '../types/analysis';

// In-memory state cache
let currentTabState: {
  tabId: number | null;
  state: ScanLifecycleState;
  statusText: string;
  report: AnalysisReport | null;
  error: string | null;
} = {
  tabId: null,
  state: 'idle',
  statusText: 'Ready',
  report: null,
  error: null,
};

// Setup context menus on installation
chrome.runtime?.onInstalled?.addListener(() => {
  chrome.contextMenus?.create({
    id: 'credible-verify-selection',
    title: 'Verify with Credible',
    contexts: ['selection'],
  });
});

// Context menu click listener
chrome.contextMenus?.onClicked?.addListener((info, tab) => {
  if (info.menuItemId === 'credible-verify-selection' && tab?.id) {
    // Open side panel for verification
    if (chrome.sidePanel?.open) {
      chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
        console.warn('[Credible SW] Failed to open side panel:', err);
      });
    }
  }
});

// Central message listener
chrome.runtime?.onMessage?.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (message.type) {
      case MessageType.REQUEST_SCAN: {
        handleRequestScan(message.tabId)
          .then((res) => sendResponse(res))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
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
 * Handle scan initiation request.
 */
async function handleRequestScan(explicitTabId?: number) {
  let targetTabId = explicitTabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      targetTabId = tabs[0].id;
    }
  }

  if (!targetTabId) {
    throw new Error('No active tab found to scan');
  }

  // Prevent duplicate concurrent scans
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

  // Update state to extracting
  currentTabState = {
    tabId: targetTabId,
    state: 'extracting',
    statusText: 'Reading visible page signals...',
    report: null,
    error: null,
  };

  // Open side panel so user can monitor progress & see full results
  if (chrome.sidePanel?.open) {
    chrome.sidePanel.open({ tabId: targetTabId }).catch(() => {
      // Non-fatal if sidePanel is already open or unsupported
    });
  }

  return {
    success: true,
    tabId: targetTabId,
    state: currentTabState.state,
  };
}

/**
 * Handle opening side panel.
 */
async function handleOpenSidePanel(explicitTabId?: number) {
  let targetTabId = explicitTabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      targetTabId = tabs[0].id;
    }
  }

  if (targetTabId && chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ tabId: targetTabId });
  }
}

// Export for unit tests
export { currentTabState, handleRequestScan, handleOpenSidePanel };

