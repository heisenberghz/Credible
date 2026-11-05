import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SeverityBadge } from '../src/sidepanel/components/SeverityBadge';
import { ConfidenceBadge } from '../src/sidepanel/components/ConfidenceBadge';
import { AssessmentSummary } from '../src/sidepanel/components/AssessmentSummary';
import { FindingDetail } from '../src/sidepanel/components/FindingDetail';
import { FindingList } from '../src/sidepanel/components/FindingList';
import { ErrorState } from '../src/sidepanel/components/ErrorState';
import { App } from '../src/sidepanel/App';
import {
  AnalysisMode,
  AnalysisReport,
  AssessmentStatus,
  CheckStatus,
  Confidence,
  Finding,
  FindingSource,
  Severity,
  TrustDnaStatus,
} from '../src/types/analysis';
import { MessageType } from '../src/types/extension';

const mockFinding: Finding = {
  id: 'finding-upfront-fee',
  title: 'Upfront Security Deposit Demanded',
  description: 'Site requires wire transfer deposit before accessing account.',
  severity: Severity.HIGH,
  confidence: Confidence.HIGH,
  status: CheckStatus.DETECTED,
  evidence: [
    {
      source: 'Visible Text Check',
      excerpt: 'Deposit $200 via wire transfer immediately',
      reason: 'Upfront fee pattern matched',
    },
  ],
  check_id: 'content.payment_pressure',
  source: FindingSource.DETERMINISTIC,
  limitations: ['Static heuristic rule'],
  recommended_action: 'Do not transfer any funds to unverified accounts.',
};

const mockReport: AnalysisReport = {
  request_id: 'rep-sidepanel-test',
  status: 'success',
  assessment_status: AssessmentStatus.SUSPICIOUS,
  summary: 'Multiple deception and payment pressure indicators were observed.',
  analyzed_url: 'https://security-login-verify.top/account',
  mode: AnalysisMode.PAGE,
  timestamp: '2026-11-01T12:00:00Z',
  findings: [mockFinding],
  trust_dna: [
    {
      id: 'credential_pressure',
      name: 'Credential Pressure',
      status: TrustDnaStatus.CONCERN,
      confidence: Confidence.HIGH,
      summary: 'High pressure detected',
      evidence: [],
      limitations: [],
    },
  ],
  proof_mode: [],
  next_best_actions: ['Do not enter credentials.'],
  checks: {
    executed: ['content.payment_pressure'],
    not_executed: [],
    unavailable: [],
    failed: [],
  },
  limitations: [],
};

describe('Side Panel Components', () => {
  describe('SeverityBadge & ConfidenceBadge Visual Distinction', () => {
    it('renders SeverityBadge with color-coded severity labels', () => {
      const { rerender } = render(<SeverityBadge severity={Severity.CRITICAL} />);
      expect(screen.getByTestId('severity-badge')).toHaveTextContent(/critical/i);

      rerender(<SeverityBadge severity={Severity.HIGH} />);
      expect(screen.getByTestId('severity-badge')).toHaveTextContent(/high risk/i);

      rerender(<SeverityBadge severity={Severity.LOW} />);
      expect(screen.getByTestId('severity-badge')).toHaveTextContent(/low concern/i);
    });

    it('renders ConfidenceBadge with certainty gauge and neutral styling', () => {
      render(<ConfidenceBadge confidence={Confidence.HIGH} />);
      const badge = screen.getByTestId('confidence-badge');

      expect(badge).toHaveTextContent(/certainty/i);
      expect(badge).toHaveTextContent(/high/i);
      expect(badge).toHaveAttribute('title', 'Evaluation Certainty: High');
    });

    it('ensures severity and confidence badges are visually distinct in structure and attributes', () => {
      render(
        <div>
          <SeverityBadge severity={Severity.HIGH} />
          <ConfidenceBadge confidence={Confidence.HIGH} />
        </div>
      );

      const severityEl = screen.getByTestId('severity-badge');
      const confidenceEl = screen.getByTestId('confidence-badge');

      expect(severityEl).toHaveAttribute('data-severity', 'high');
      expect(confidenceEl).toHaveAttribute('data-confidence', 'high');
      expect(severityEl.textContent).toMatch(/high risk/i);
      expect(confidenceEl.textContent).toMatch(/certainty/i);
    });
  });

  describe('AssessmentSummary Component', () => {
    it('renders plain-language verdict, summary text, and target URL', () => {
      render(<AssessmentSummary report={mockReport} />);

      expect(screen.getByTestId('assessment-status-label')).toHaveTextContent(
        'Suspicious Indicators Detected'
      );
      expect(screen.getByTestId('summary-text')).toHaveTextContent(
        'Multiple deception and payment pressure indicators were observed.'
      );
      expect(screen.getByTestId('target-url')).toHaveTextContent(
        'https://security-login-verify.top/account'
      );
      expect(screen.getByTestId('scan-mode')).toHaveTextContent('Full Page Scan');
    });

    it('does not fabricate a score when the report has none', () => {
      render(<AssessmentSummary report={{ ...mockReport, score: undefined }} />);

      expect(screen.getByText('Not scored')).toBeInTheDocument();
      expect(screen.queryByText('Clean Signals')).not.toBeInTheDocument();
      expect(screen.getByText('no score')).toBeInTheDocument();
    });
  });

  describe('FindingDetail & FindingList Components', () => {
    it('renders finding title, description, and action pill', () => {
      render(<FindingDetail finding={mockFinding} />);

      expect(screen.getByTestId('finding-title')).toHaveTextContent(
        'Upfront Security Deposit Demanded'
      );
      expect(screen.getByTestId('finding-description')).toHaveTextContent(
        'Site requires wire transfer deposit before accessing account.'
      );
      expect(screen.getByTestId('finding-action')).toHaveTextContent(
        'Do not transfer any funds'
      );
      expect(screen.getByTestId('finding-source')).toHaveTextContent('Rule Check');
    });

    it('expands and collapses evidence proof section on toggle click', () => {
      render(<FindingDetail finding={mockFinding} />);

      // Initially evidence is collapsed
      expect(screen.queryByTestId('proof-section')).not.toBeInTheDocument();

      const toggleBtn = screen.getByTestId('proof-toggle-btn');
      fireEvent.click(toggleBtn);

      // Now expanded
      expect(screen.getByTestId('proof-section')).toBeInTheDocument();
      expect(screen.getByText(/content\.payment_pressure/)).toBeInTheDocument();
      expect(screen.getByText(/Deposit \$200 via wire transfer/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('proof-section')).not.toBeInTheDocument();
    });

    it('renders empty findings card when no findings are detected', () => {
      render(<FindingList findings={[]} />);

      expect(screen.getByTestId('findings-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Active Threat Findings')).toBeInTheDocument();
    });

    it('groups and sorts findings with critical/high priority first', () => {
      const lowFinding: Finding = {
        ...mockFinding,
        id: 'f-low',
        title: 'Long URL observed',
        severity: Severity.LOW,
      };
      const criticalFinding: Finding = {
        ...mockFinding,
        id: 'f-crit',
        title: 'Impersonation of brand detected',
        severity: Severity.CRITICAL,
      };

      render(<FindingList findings={[lowFinding, criticalFinding, mockFinding]} />);

      const titles = screen.getAllByTestId('finding-title');
      expect(titles[0]).toHaveTextContent('Impersonation of brand detected'); // Critical first
      expect(titles[1]).toHaveTextContent('Upfront Security Deposit Demanded'); // High second
      expect(titles[2]).toHaveTextContent('Long URL observed'); // Low last
    });
  });

  describe('ErrorState Component', () => {
    it('renders loading state with status message', () => {
      render(<ErrorState type="loading" message="Extracting DOM signals..." />);
      expect(screen.getByTestId('state-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-status-text')).toHaveTextContent(
        'Extracting DOM signals...'
      );
    });

    it('renders idle state with action button', () => {
      const handleScan = vi.fn();
      render(<ErrorState type="idle" onRetry={handleScan} />);
      expect(screen.getByTestId('state-idle')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('scan-action-btn'));
      expect(handleScan).toHaveBeenCalledTimes(1);
    });

    it('renders offline backend error guidance with retry button', () => {
      const handleRetry = vi.fn();
      render(<ErrorState type="offline" onRetry={handleRetry} />);

      expect(screen.getByTestId('error-title')).toHaveTextContent('Backend Unavailable');
      expect(screen.getByTestId('error-message')).toHaveTextContent('http://localhost:8000');

      fireEvent.click(screen.getByTestId('retry-btn'));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders timeout error guidance', () => {
      render(<ErrorState type="timeout" />);
      expect(screen.getByTestId('error-title')).toHaveTextContent('Analysis Timed Out');
      expect(screen.getByTestId('error-message')).toHaveTextContent('15 seconds');
    });
  });

  describe('Side Panel App Integration', () => {
    let messageListeners: Array<(msg: any) => void> = [];

    beforeEach(() => {
      messageListeners = [];
      (globalThis as any).chrome = {
        runtime: {
          lastError: null,
          sendMessage: vi.fn((msg: any, callback?: (res: any) => void) => {
            if (callback && msg.type === MessageType.GET_LATEST_REPORT) {
              callback({
                state: 'idle',
                statusText: 'Ready',
                report: null,
                error: null,
              });
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
      };
    });

    it('transitions to loading when receiving SCAN_PROGRESS message', async () => {
      render(<App />);

      await act(async () => {
        messageListeners.forEach((listener) =>
          listener({
            type: MessageType.SCAN_PROGRESS,
            state: 'analyzing',
            statusText: 'Evaluating Trust DNA...',
          })
        );
      });

      expect(screen.getByTestId('state-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-status-text')).toHaveTextContent(
        'Evaluating Trust DNA...'
      );
      expect(screen.getByTestId('sidepanel-scan-progress')).toHaveTextContent(
        'Running deterministic checks + AI analysis'
      );
    });

    it('renders full report when receiving SCAN_SUCCESS message', async () => {
      render(<App />);

      await act(async () => {
        messageListeners.forEach((listener) =>
          listener({
            type: MessageType.SCAN_SUCCESS,
            report: mockReport,
          })
        );
      });

      expect(screen.getByTestId('assessment-summary')).toBeInTheDocument();
      expect(screen.getByTestId('findings-section')).toBeInTheDocument();
      expect(screen.getByText('Upfront Security Deposit Demanded')).toBeInTheDocument();
    });

    it('renders error state when receiving SCAN_ERROR message', async () => {
      render(<App />);

      await act(async () => {
        messageListeners.forEach((listener) =>
          listener({
            type: MessageType.SCAN_ERROR,
            error: 'Backend analysis timed out after 15 seconds.',
          })
        );
      });

      expect(screen.getByTestId('state-error')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Backend analysis timed out after 15 seconds.'
      );
    });
  });
});
