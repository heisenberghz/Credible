import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';

import { App as PopupApp } from '../src/popup/App';
import { App as SidePanelApp } from '../src/sidepanel/App';
import {
  handleRequestScan,
  handleSelectionScan,
  currentTabState,
} from '../src/background/service-worker';
import {
  apiClient,
  validateAnalysisReport,
  AnalysisClientError,
} from '../src/services/api-client';
import { MessageType } from '../src/types/extension';
import { AssessmentStatus } from '../src/types/analysis';

// Load real golden backend reports
const goldenPath = path.resolve(__dirname, 'fixtures/golden_reports.json');
const goldenBundle = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'));

describe('Task 16: End-to-End Integration Suite', () => {
  const originalFetch = globalThis.fetch;
  let broadcastListeners: Array<(msg: any) => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    broadcastListeners = [];

    currentTabState.tabId = null;
    currentTabState.state = 'idle';
    currentTabState.statusText = 'Ready';
    currentTabState.report = null;
    currentTabState.selectionData = null;
    currentTabState.error = null;

    (globalThis as any).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn((msg: any, callback?: (res: any) => void) => {
          if (callback && msg.type === MessageType.GET_LATEST_REPORT) {
            callback({
              state: currentTabState.state,
              statusText: currentTabState.statusText,
              report: currentTabState.report,
              selectionData: currentTabState.selectionData,
              error: currentTabState.error,
            });
          } else if (msg.type) {
            // Forward broadcast to registered listeners
            broadcastListeners.forEach((listener) => listener(msg));
          }
          return Promise.resolve({ success: true });
        }),
        onMessage: {
          addListener: vi.fn((listener: (msg: any) => void) => {
            broadcastListeners.push(listener);
          }),
          removeListener: vi.fn((listener: (msg: any) => void) => {
            broadcastListeners = broadcastListeners.filter((l) => l !== listener);
          }),
        },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 101, url: 'https://g00gle-careers-portal.xyz' }]),
        get: vi.fn().mockResolvedValue({ id: 101, url: 'https://g00gle-careers-portal.xyz' }),
        sendMessage: vi.fn().mockImplementation((_tabId, msg) => {
          if (msg.type === MessageType.EXTRACT_PAGE_CONTENT) {
            return Promise.resolve({
              success: true,
              data: {
                url: 'https://g00gle-careers-portal.xyz/internship-offer',
                title: 'Guaranteed Summer Internship',
                visible_text: 'Deposit registration fee of $200 immediately. Only 3 seats left!',
                links: [{ text: 'Pay Now', href: 'https://g00gle-careers-portal.xyz/pay' }],
              },
            });
          }
          if (msg.type === MessageType.EXTRACT_SELECTION_CONTENT) {
            return Promise.resolve({
              success: true,
              data: {
                url: 'https://g00gle.xyz/verify',
                text: 'Deposit refundable fee of $500 immediately to confirm your appointment.',
                link: { text: 'Deposit now', href: 'https://g00gle.xyz/pay' },
              },
            });
          }
          return Promise.resolve({ success: true });
        }),
      },
      scripting: { executeScript: vi.fn().mockResolvedValue([]) },
      sidePanel: { open: vi.fn().mockResolvedValue(undefined) },
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Contract Parity on Real Backend Golden Reports', () => {
    it('validates benign golden report matches contract and has zero threat findings', () => {
      const benignReport = validateAnalysisReport(goldenBundle.benign);
      expect(benignReport.assessment_status).toBe(AssessmentStatus.BENIGN);
      expect(benignReport.findings.length).toBe(0);
      expect(benignReport.trust_dna.length).toBe(6);
      expect(benignReport.next_best_actions.length).toBeGreaterThan(0);
      expect(benignReport.checks.executed.length).toBeGreaterThanOrEqual(5);
    });

    it('validates suspicious golden report matches contract with multiple detections', () => {
      const suspiciousReport = validateAnalysisReport(goldenBundle.suspicious);
      expect(suspiciousReport.assessment_status).toBe(AssessmentStatus.SUSPICIOUS);
      expect(suspiciousReport.findings.length).toBeGreaterThanOrEqual(3);
      expect(suspiciousReport.proof_mode.length).toBe(suspiciousReport.findings.length);
      expect(suspiciousReport.trust_dna.length).toBe(6);
    });

    it('validates selection mode golden report matches contract', () => {
      const selectionReport = validateAnalysisReport(goldenBundle.selection);
      expect(selectionReport.mode).toBe('selection');
      expect(selectionReport.findings.length).toBeGreaterThan(0);
    });
  });

  describe('Full Page Scan End-to-End Flow', () => {
    it('orchestrates complete page scan from Popup trigger to Side Panel report rendering', async () => {
      // Mock fetch returning suspicious golden report
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => goldenBundle.suspicious,
      });

      // 1. Render both Popup and Side Panel views
      const popup = render(<PopupApp />);
      const sidePanel = render(<SidePanelApp />);

      // Initial state assertions
      expect(popup.getByTestId('scan-btn')).toHaveTextContent('Scan This Page');
      expect(sidePanel.getByTestId('state-idle')).toBeInTheDocument();

      // 2. User clicks Scan in popup
      await act(async () => {
        fireEvent.click(popup.getByTestId('scan-btn'));
      });

      // 3. Service worker executes handleRequestScan
      const scanResult = await handleRequestScan(101);
      expect(scanResult.success).toBe(true);
      expect(scanResult.state).toBe('completed');

      // 4. Verify Popup updated to Completed state
      await act(async () => {
        broadcastListeners.forEach((l) =>
          l({ type: MessageType.SCAN_SUCCESS, report: goldenBundle.suspicious })
        );
      });
      expect(popup.getByTestId('status-text')).toHaveTextContent('Analysis Complete');
      expect(popup.getByTestId('view-sidepanel-btn')).toBeInTheDocument();

      // 5. Verify Side Panel renders all core report sections
      expect(sidePanel.getByTestId('assessment-summary')).toBeInTheDocument();
      expect(sidePanel.getByTestId('assessment-status-label')).toHaveTextContent(
        'Suspicious Indicators Detected'
      );
      expect(sidePanel.getByTestId('findings-section')).toBeInTheDocument();
      expect(sidePanel.getByTestId('trust-dna-panel')).toBeInTheDocument();
      expect(sidePanel.getByTestId('proof-mode-panel')).toBeInTheDocument();
      expect(sidePanel.getByTestId('next-actions-panel')).toBeInTheDocument();
      expect(sidePanel.getByTestId('checks-limitations-panel')).toBeInTheDocument();
    });
  });

  describe('Selection Scan End-to-End Flow', () => {
    it('orchestrates complete Select-to-Verify flow with highlighted selection banner', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => goldenBundle.selection,
      });

      const sidePanel = render(<SidePanelApp />);

      // User triggers context menu
      await handleSelectionScan(101, 'Deposit refundable fee of $500 immediately');

      expect(currentTabState.state).toBe('completed');
      expect(currentTabState.selectionData?.text).toContain('Deposit refundable fee');

      // Side panel reflects selection success
      expect(sidePanel.getByTestId('selection-context-banner')).toBeInTheDocument();
      expect(sidePanel.getByTestId('selection-quote-text')).toHaveTextContent(
        'Deposit refundable fee of $500 immediately'
      );
      expect(sidePanel.getByTestId('assessment-summary')).toBeInTheDocument();
      expect(sidePanel.getByTestId('findings-section')).toBeInTheDocument();
    });
  });

  describe('Failure Scenarios & Error Recovery', () => {
    it('handles backend service offline gracefully with clear guidance', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const sidePanel = render(<SidePanelApp />);

      const scanResult = await handleRequestScan(101);
      expect(scanResult.success).toBe(false);

      expect(sidePanel.getByTestId('state-error')).toBeInTheDocument();
      expect(sidePanel.getByTestId('error-title')).toHaveTextContent('Backend Unavailable');
      expect(sidePanel.getByTestId('error-message')).toHaveTextContent('http://localhost:8000');
      expect(sidePanel.getByTestId('retry-btn')).toBeInTheDocument();
    });

    it('handles backend timeout after 15 seconds without hanging', async () => {
      // Simulate hung request that triggers client timeout
      globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      });

      // Use fast timeout option for integration test
      await expect(
        apiClient.analyzePage(
          { url: 'https://example.com', visible_text: 'Text', links: [] },
          { timeoutMs: 50 }
        )
      ).rejects.toThrow('Analysis request timed out after 0.05 seconds.');
    });

    it('handles malformed JSON / unexpected response schema without crash', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected_key: 'malformed_data' }),
      });

      const sidePanel = render(<SidePanelApp />);

      await expect(
        apiClient.analyzePage({ url: 'https://example.com', visible_text: 'Text', links: [] })
      ).rejects.toThrow(AnalysisClientError);

      await handleRequestScan(101);
      expect(sidePanel.getByTestId('state-error')).toBeInTheDocument();
    });

    it('handles HTTP 422 validation failure with structured message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Selection text must not be empty.',
            field: 'selection.text',
          },
          request_id: 'err-422',
          timestamp: '2026-11-01T12:00:00Z',
        }),
      });

      try {
        await apiClient.analyzeSelection({ url: 'https://example.com', text: '' });
      } catch (err: any) {
        expect(err.statusCode).toBe(422);
        expect(err.message).toBe('Selection text must not be empty.');
      }
    });

    it('handles HTTP 413 payload too large with explicit constraint message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Visible text exceeds 500,000 characters limit.',
          },
          request_id: 'err-413',
          timestamp: '2026-11-01T12:00:00Z',
        }),
      });

      try {
        await apiClient.analyzePage({
          url: 'https://example.com',
          visible_text: 'A'.repeat(500001),
          links: [],
        });
      } catch (err: any) {
        expect(err.statusCode).toBe(413);
        expect(err.code).toBe('PAYLOAD_TOO_LARGE');
      }
    });

    it('handles AI outage fallback where backend returns deterministic-only results', async () => {
      const fallbackReport = {
        ...goldenBundle.suspicious,
        findings: goldenBundle.suspicious.findings.filter(
          (f: any) => f.source === 'deterministic'
        ),
        limitations: [
          ...goldenBundle.suspicious.limitations,
          'AI interpretation service was temporarily unavailable; deterministic checks executed normally.',
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fallbackReport,
      });

      const sidePanel = render(<SidePanelApp />);

      await handleRequestScan(101);
      expect(currentTabState.state).toBe('completed');

      expect(sidePanel.getByTestId('assessment-summary')).toBeInTheDocument();

      // Expand limitations section
      fireEvent.click(sidePanel.getByTestId('checks-toggle-btn'));
      expect(
        screen.getByText(/AI interpretation service was temporarily unavailable/)
      ).toBeInTheDocument();
    });
  });
});
