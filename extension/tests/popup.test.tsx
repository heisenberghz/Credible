import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../src/popup/App';
import { MessageType } from '../src/types/extension';

describe('Popup Component', () => {
  let messageListeners: Array<(msg: any) => void> = [];

  beforeEach(() => {
    messageListeners = [];
    vi.clearAllMocks();

    (globalThis as any).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn((msg: any, callback?: (res: any) => void) => {
          if (callback) {
            if (msg.type === MessageType.GET_LATEST_REPORT) {
              callback({ state: 'idle', statusText: 'Ready', report: null, error: null });
            } else if (msg.type === MessageType.REQUEST_SCAN) {
              callback({ success: true, tabId: 1, state: 'extracting' });
            } else {
              callback({ success: true });
            }
          }
        }),
        onMessage: {
          addListener: vi.fn((listener: (msg: any) => void) => {
            messageListeners.push(listener);
          }),
          removeListener: vi.fn((listener: (msg: any) => void) => {
            messageListeners = messageListeners.filter((l) => l !== listener);
          }),
        },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
      },
      sidePanel: {
        open: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it('renders initial idle state with Credible branding and Scan button', () => {
    render(<App />);

    expect(screen.getByText('Credible')).toBeInTheDocument();
    expect(screen.getByText('Defensive Security')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Ready');

    const scanBtn = screen.getByTestId('scan-btn');
    expect(scanBtn).toBeInTheDocument();
    expect(scanBtn).toHaveTextContent('Scan This Page');
    expect(scanBtn).not.toBeDisabled();
  });

  it('transitions to extracting state on click and prevents duplicate clicks', async () => {
    render(<App />);

    const scanBtn = screen.getByTestId('scan-btn');
    await act(async () => {
      fireEvent.click(scanBtn);
    });

    // Should now be disabled to prevent duplicate submissions
    expect(scanBtn).toBeDisabled();
    expect(scanBtn).toHaveTextContent('Analyzing Page...');

    // Should display scanning pulse rings
    const pulseWrapper = screen.getByTestId('pulse-wrapper');
    const rings = pulseWrapper.querySelectorAll('.pulse-ring');
    expect(rings.length).toBe(2);

    // Should show an honest stage label and elapsed timer
    const progress = screen.getByTestId('popup-scan-progress');
    expect(progress).toHaveTextContent('Extracting page content');
    expect(screen.getByTestId('scan-elapsed')).toHaveTextContent(/\d+s/);

    // Chrome runtime sendMessage should have been called
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: MessageType.REQUEST_SCAN }),
      expect.any(Function)
    );
  });

  it('updates state dynamically on receiving SCAN_PROGRESS message', async () => {
    render(<App />);

    await act(async () => {
      messageListeners.forEach((listener) =>
        listener({
          type: MessageType.SCAN_PROGRESS,
          state: 'analyzing',
          statusText: 'Evaluating threats & Trust DNA...',
        })
      );
    });

    expect(screen.getByTestId('status-text')).toHaveTextContent('Evaluating threats & Trust DNA...');
    expect(screen.getByTestId('status-badge')).toHaveClass('scanning');
    expect(screen.getByTestId('scan-btn')).toBeDisabled();
    expect(screen.getByTestId('popup-scan-progress')).toHaveTextContent(
      'Running deterministic checks + AI analysis'
    );
  });

  it('updates state to completed on receiving SCAN_SUCCESS message', async () => {
    render(<App />);

    const mockReport: any = {
      request_id: 'test-req-123',
      status: 'success',
      assessment_status: 'suspicious',
      summary: 'High pressure financial tactic detected',
      analyzed_url: 'https://example.com',
      mode: 'page',
      timestamp: '2026-11-01T12:00:00Z',
      findings: [],
      trust_dna: [],
      proof_mode: [],
      next_best_actions: [],
      checks: { executed: [], not_executed: [], unavailable: [], failed: [] },
      limitations: [],
    };

    await act(async () => {
      messageListeners.forEach((listener) =>
        listener({
          type: MessageType.SCAN_SUCCESS,
          report: mockReport,
        })
      );
    });

    expect(screen.getByTestId('status-text')).toHaveTextContent('Analysis Complete');
    expect(screen.getByTestId('pulse-core')).toHaveClass('completed');
    expect(screen.getByTestId('status-description')).toHaveTextContent('SUSPICIOUS');

    // Should show "View Full Analysis in Side Panel" button
    const sidePanelBtn = screen.getByTestId('view-sidepanel-btn');
    expect(sidePanelBtn).toBeInTheDocument();
  });

  it('updates state to failed on receiving SCAN_ERROR message', async () => {
    render(<App />);

    await act(async () => {
      messageListeners.forEach((listener) =>
        listener({
          type: MessageType.SCAN_ERROR,
          error: 'Connection timeout to backend service',
        })
      );
    });

    expect(screen.getByTestId('status-text')).toHaveTextContent('Scan Error');
    expect(screen.getByTestId('pulse-core')).toHaveClass('failed');
    expect(screen.getByTestId('status-description')).toHaveTextContent(
      'Connection timeout to backend service'
    );

    // Should show Retry Scan button
    const retryBtn = screen.getByTestId('scan-btn');
    expect(retryBtn).toHaveTextContent('Retry Scan');
    expect(retryBtn).not.toBeDisabled();
  });

  it('triggers side panel open when Open Side Panel button is clicked', async () => {
    render(<App />);

    const openLink = screen.getByTestId('open-sidepanel-link');
    await act(async () => {
      fireEvent.click(openLink);
    });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.OPEN_SIDEPANEL,
    });
  });
});
