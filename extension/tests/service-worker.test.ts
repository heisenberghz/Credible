import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleRequestScan,
  handleOpenSidePanel,
  currentTabState,
} from '../src/background/service-worker';

describe('Background Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTabState.tabId = null;
    currentTabState.state = 'idle';
    currentTabState.statusText = 'Ready';
    currentTabState.report = null;
    currentTabState.error = null;

    (globalThis as any).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onInstalled: {
          addListener: vi.fn(),
        },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 101, url: 'https://example.com' }]),
      },
      sidePanel: {
        open: vi.fn().mockResolvedValue(undefined),
      },
      contextMenus: {
        create: vi.fn(),
        onClicked: {
          addListener: vi.fn(),
        },
      },
    };
  });

  it('initiates scan on active tab when tabId not passed', async () => {
    const result = await handleRequestScan();

    expect(result.success).toBe(true);
    expect(result.tabId).toBe(101);
    expect(result.state).toBe('extracting');
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 101 });
  });

  it('initiates scan with explicit tabId', async () => {
    const result = await handleRequestScan(202);

    expect(result.success).toBe(true);
    expect(result.tabId).toBe(202);
    expect(result.state).toBe('extracting');
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 202 });
  });

  it('rejects duplicate concurrent scan requests on the same active tab', async () => {
    // Start first scan
    await handleRequestScan(303);
    expect(currentTabState.state).toBe('extracting');

    // Attempt second scan while first is in extracting
    const secondScan = await handleRequestScan(303);
    expect(secondScan.success).toBe(false);
    expect(secondScan.alreadyScanning).toBe(true);
  });

  it('opens side panel for target tab', async () => {
    await handleOpenSidePanel(404);
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 404 });
  });
});

