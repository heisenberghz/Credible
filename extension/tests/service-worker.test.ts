import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleRequestScan,
  handleSelectionScan,
  handleOpenSidePanel,
  currentTabState,
} from '../src/background/service-worker';
import { apiClient } from '../src/services/api-client';
import { AnalysisMode, AnalysisReport, AssessmentStatus } from '../src/types/analysis';
import { MessageType } from '../src/types/extension';

vi.mock('../src/services/api-client', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    apiClient: {
      analyzePage: vi.fn(),
      analyzeSelection: vi.fn(),
    },
  };
});

const mockReport: AnalysisReport = {
  request_id: 'sw-test-req',
  status: 'success',
  assessment_status: AssessmentStatus.BENIGN,
  summary: 'Safe site',
  analyzed_url: 'https://example.com',
  mode: AnalysisMode.PAGE,
  timestamp: '2026-11-01T12:00:00Z',
  findings: [],
  trust_dna: [],
  proof_mode: [],
  next_best_actions: [],
  checks: { executed: [], not_executed: [], unavailable: [], failed: [] },
  limitations: [],
};

describe('Background Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTabState.tabId = null;
    currentTabState.state = 'idle';
    currentTabState.statusText = 'Ready';
    currentTabState.report = null;
    currentTabState.error = null;

    (apiClient.analyzePage as any).mockResolvedValue(mockReport);
    (apiClient.analyzeSelection as any).mockResolvedValue(mockReport);

    (globalThis as any).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn().mockReturnValue(Promise.resolve()),
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
        sendMessage: vi.fn().mockImplementation((_tabId: number, msg: any) => {
          if (msg.type === MessageType.EXTRACT_PAGE_CONTENT) {
            return Promise.resolve({
              success: true,
              data: {
                url: 'https://example.com',
                title: 'Example',
                visible_text: 'Example content',
                links: [],
              },
            });
          }
          if (msg.type === MessageType.EXTRACT_SELECTION_CONTENT) {
            return Promise.resolve({
              success: true,
              data: {
                url: 'https://example.com',
                text: 'Selected suspect sentence',
                link: null,
              },
            });
          }
          return Promise.resolve({ success: true });
        }),
      },
      scripting: {
        executeScript: vi.fn().mockResolvedValue([]),
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

  it('orchestrates complete scan on active tab when tabId not passed', async () => {
    const result = await handleRequestScan();

    expect(result.success).toBe(true);
    expect(result.tabId).toBe(101);
    expect(result.state).toBe('completed');
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 101 });
    expect(apiClient.analyzePage).toHaveBeenCalled();
    expect(currentTabState.state).toBe('completed');
    expect(currentTabState.report).toEqual(mockReport);
  });

  it('orchestrates scan with explicit tabId', async () => {
    const result = await handleRequestScan(202);

    expect(result.success).toBe(true);
    expect(result.tabId).toBe(202);
    expect(result.state).toBe('completed');
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 202 });
  });

  it('handles content extraction failure gracefully', async () => {
    (chrome.tabs.sendMessage as any).mockRejectedValue(new Error('Tab closed'));

    const result = await handleRequestScan(101);

    expect(result.success).toBe(false);
    expect(currentTabState.state).toBe('failed');
    expect(currentTabState.statusText).toBe('Extraction Failed');
  });

  it('handles backend API failure gracefully with user-friendly error', async () => {
    (apiClient.analyzePage as any).mockRejectedValue(
      new Error('Failed to connect to Credible backend service.')
    );

    const result = await handleRequestScan(101);

    expect(result.success).toBe(false);
    expect(currentTabState.state).toBe('failed');
    expect(currentTabState.error).toContain('Failed to connect to Credible backend service');
  });

  it('rejects duplicate concurrent scan requests on the same active tab', async () => {
    // Delay API response to keep scan in flight
    (apiClient.analyzePage as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockReport), 100))
    );

    // Fire first scan (don't await immediately)
    const scanPromise = handleRequestScan(303);

    // Attempt second scan while first is in flight
    const duplicateResult = await handleRequestScan(303);

    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.alreadyScanning).toBe(true);

    // Clean up first scan
    await scanPromise;
  });

  it('orchestrates selection scan triggered via context menu', async () => {
    await handleSelectionScan(505);

    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 505 });
    expect(apiClient.analyzeSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        text: 'Selected suspect sentence',
      })
    );
    expect(currentTabState.state).toBe('completed');
    expect(currentTabState.report).toEqual(mockReport);
  });

  it('opens side panel for target tab', async () => {
    await handleOpenSidePanel(404);
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 404 });
  });
});
