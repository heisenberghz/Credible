import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';

import { AssessmentSummary } from '../src/sidepanel/components/AssessmentSummary';
import { FindingDetail } from '../src/sidepanel/components/FindingDetail';
import { ErrorState } from '../src/sidepanel/components/ErrorState';
import { App as PopupApp } from '../src/popup/App';
import {
  AnalysisMode,
  AnalysisReport,
  AssessmentStatus,
  CheckStatus,
  Confidence,
  Finding,
  FindingSource,
  Severity,
} from '../src/types/analysis';

const mockReport: AnalysisReport = {
  request_id: 'req-ui-test-1',
  status: 'completed',
  assessment_status: AssessmentStatus.SUSPICIOUS,
  summary: 'Suspicious indicators detected including upfront fees and password requests.',
  analyzed_url: 'https://suspicious-portal.xyz/apply',
  mode: AnalysisMode.PAGE,
  timestamp: '2026-11-01T12:00:00Z',
  findings: [
    {
      id: 'f-1',
      title: 'Upfront Registration Fee Demand',
      description: 'Candidate is required to deposit $250 via cryptocurrency.',
      severity: Severity.HIGH,
      confidence: Confidence.HIGH,
      source: FindingSource.DETERMINISTIC,
      status: CheckStatus.DETECTED,
      check_id: 'content.payment_pressure',
      evidence: [
        {
          source: 'visible_text',
          excerpt: 'pay $250 registration fee',
          reason: 'Upfront fee requested',
        },
      ],
      recommended_action: 'Do not transfer funds',
      limitations: [],
    },
  ],
  trust_dna: [],
  proof_mode: [],
  next_best_actions: ['Do not pay fees'],
  checks: {
    executed: ['content.payment_pressure'],
    not_executed: [],
    unavailable: [],
    failed: [],
  },
  limitations: [],
};

describe('Task 19: UI Polish, Animations & Micro-Interactions Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe('AssessmentSummary Polish & Copy Micro-interaction', () => {
    it('renders verdict banner with accessible status and interactive Copy button', async () => {
      render(<AssessmentSummary report={mockReport} />);

      expect(screen.getByTestId('assessment-summary')).toBeInTheDocument();
      expect(screen.getByTestId('assessment-status-label')).toHaveTextContent(/suspicious/i);

      const copyBtn = screen.getByTestId('copy-summary-btn');
      expect(copyBtn).toBeInTheDocument();
      expect(copyBtn).toHaveTextContent(/copy/i);

      // Trigger copy action
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('[Credible Assessment]')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://suspicious-portal.xyz/apply')
      );

      // Verify copied feedback state
      await waitFor(() => {
        expect(copyBtn).toHaveTextContent(/copied/i);
      });
    });
  });

  describe('FindingDetail Severity Accents & Accordion Transitions', () => {
    it('applies color-coded severity class and toggles proof accordion with animated chevron', () => {
      const finding: Finding = mockReport.findings[0];
      render(<FindingDetail finding={finding} />);

      const card = screen.getByTestId('finding-card');
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('severity-high');

      const toggleBtn = screen.getByTestId('proof-toggle-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/view proof/i);

      // Expand evidence accordion
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('proof-section')).toBeInTheDocument();
      expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
      expect(screen.getByText(/pay \$250 registration fee/)).toBeInTheDocument();

      // Collapse evidence accordion
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('proof-section')).not.toBeInTheDocument();
    });
  });

  describe('ErrorState Polish & Skeleton Loading Placeholders', () => {
    it('renders animated spinner and skeleton placeholder boxes during loading state', () => {
      const { container } = render(
        <ErrorState type="loading" message="Analyzing Page Signals..." />
      );

      expect(screen.getByTestId('state-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-status-text')).toHaveTextContent(
        'Analyzing Page Signals...'
      );

      // Skeletons to prevent layout shift
      const skeletons = container.querySelectorAll('.skeleton-box');
      expect(skeletons.length).toBe(3);
    });

    it('renders friendly actionable retry button for network error states', () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          type="offline"
          message="Credible backend is unreachable."
          onRetry={onRetry}
        />
      );

      expect(screen.getByTestId('state-error')).toBeInTheDocument();
      expect(screen.getByTestId('error-title')).toHaveTextContent('Backend Unavailable');

      const retryBtn = screen.getByTestId('retry-btn');
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Popup Apple-like Design & Radar Animation Elements', () => {
    it('renders radar pulse core, accessible status dot, and keyboard-navigable scan CTA', () => {
      render(<PopupApp />);

      expect(screen.getByTestId('popup-container')).toBeInTheDocument();
      expect(screen.getByTestId('pulse-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('pulse-core')).toBeInTheDocument();

      const scanBtn = screen.getByTestId('scan-btn');
      expect(scanBtn).toBeInTheDocument();
      expect(scanBtn).toHaveTextContent(/scan this page/i);

      // Verify side panel shortcut button is accessible
      const sidePanelLink = screen.getByTestId('open-sidepanel-link');
      expect(sidePanelLink).toBeInTheDocument();
    });
  });

  describe('CSS Standards & Design Tokens Audit', () => {
    it('verifies sidepanel.css defines accessible focus rings, custom scrollbars, and severity tokens', () => {
      const cssPath = path.resolve(__dirname, '../src/sidepanel/sidepanel.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('::-webkit-scrollbar');
      expect(cssContent).toContain('--severity-critical');
      expect(cssContent).toContain('--severity-high');
      expect(cssContent).toContain('.skeleton-box');
      expect(cssContent).toContain('@keyframes shimmer');
    });

    it('verifies popup.css defines pulsing radar keyframes and accessible focus outlines', () => {
      const cssPath = path.resolve(__dirname, '../src/popup/popup.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('@keyframes pulse-ring');
      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('--accent-blue');
    });
  });
});

