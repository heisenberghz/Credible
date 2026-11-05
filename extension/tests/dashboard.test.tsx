import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardApp, deriveVerdict } from '../src/dashboard/App';
import { generateMarkdownDossier } from '../src/dashboard/utils/dossierExporter';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../src/types/analysis';

const makeReport = (overrides: Partial<AnalysisReport> = {}): AnalysisReport => ({
  request_id: 'test-report',
  status: 'completed',
  assessment_status: AssessmentStatus.BENIGN,
  score: 97,
  summary: 'Test summary',
  analyzed_url: 'https://example.com/job',
  mode: AnalysisMode.PAGE,
  timestamp: '2026-11-02T00:00:00Z',
  findings: [],
  trust_dna: [],
  proof_mode: [],
  next_best_actions: ['Act'],
  checks: { executed: [], not_executed: [], unavailable: [], failed: [] },
  limitations: [],
  ...overrides,
});

describe('Task 20: Full-Tab Command Center Dashboard Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as any).chrome.storage;
  });

  it('renders the Dashboard header, executive hero, and 2-column forensic workbench', async () => {
    render(<DashboardApp />);

    // Header checks
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByText(/CREDIBLE COMMAND CENTER/i)).toBeInTheDocument();
    expect(screen.getByTestId('export-markdown-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-json-btn')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-scan-btn')).toBeInTheDocument();

    // Hero Executive checks
    expect(screen.getByTestId('dashboard-hero')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-score-value')).toHaveTextContent('97');
    expect(screen.getByTestId('dashboard-verdict-pill')).toBeInTheDocument();

    // 2-Column layout checks
    expect(screen.getByTestId('trust-dna-panel')).toBeInTheDocument();
    expect(screen.getByTestId('next-actions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('scan-ledger')).toBeInTheDocument();
  });

  it('puts the verdict and primary action above telemetry and deep-dive panels', async () => {
    render(<DashboardApp />);

    const hero = screen.getByTestId('dashboard-hero');
    const priority = screen.getByTestId('dashboard-priority-action');
    const telemetry = screen.getByLabelText('Forensic Telemetry Metrics');
    const workbench = screen.getByTestId('trust-dna-panel');

    expect(hero).toContainElement(priority);
    expect(priority).toHaveTextContent('DO THIS FIRST');
    expect(priority).toHaveTextContent(
      "Navigate to the organization's official website directly by typing its address into your browser."
    );

    // Hero must come first, then telemetry, then the deep-dive workbench.
    expect(hero.compareDocumentPosition(telemetry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(telemetry.compareDocumentPosition(workbench) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Template-only chart and venn cards are retired from the dashboard.
    expect(screen.queryByText(/Trust DNA Multi-Factor Telemetry/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Threat Vector Distribution/i)).not.toBeInTheDocument();
  });

  it('allows clicking an item in the scan ledger to switch active report view', async () => {
    render(<DashboardApp />);

    // Initially loads Scenario 1 (Benign)
    expect(screen.getByText(/Standard corporate recruitment patterns observed/i)).toBeInTheDocument();

    // Click the second item in the ledger (Scenario 2: Suspicious)
    const suspiciousItem = screen.getByTestId('ledger-item-demo-scen-2-suspicious');
    expect(suspiciousItem).toBeInTheDocument();

    fireEvent.click(suspiciousItem);

    // Hero verdict and findings should update to suspicious
    expect(screen.getByText(/CRITICAL THREAT DETECTED/i)).toBeInTheDocument();
    expect(screen.getByTestId('proof-mode-panel')).toBeInTheDocument();
    expect(screen.getByTestId('heuristic-matrix-panel')).toBeInTheDocument();
    expect(screen.getAllByText(/Upfront Payment or Deposit Requested/i).length).toBeGreaterThanOrEqual(1);
  });

  it('derives an honest verdict when a score is missing or the scan is incomplete', () => {
    expect(deriveVerdict(makeReport({ score: 97 }))).toEqual({
      tone: 'clean',
      label: 'CLEAN SIGNALS',
    });

    expect(deriveVerdict(makeReport({ score: 20 })).tone).toBe('threat');
    expect(deriveVerdict(makeReport({ score: 62 }))).toEqual({
      tone: 'caution',
      label: 'CAUTION / UNVERIFIED',
    });

    expect(deriveVerdict(makeReport({ score: undefined }))).toEqual({
      tone: 'unknown',
      label: 'UNVERIFIED — NO SCORE',
    });

    expect(
      deriveVerdict(makeReport({ score: undefined, assessment_status: AssessmentStatus.SUSPICIOUS }))
        .tone
    ).toBe('threat');

    expect(
      deriveVerdict(makeReport({ assessment_status: AssessmentStatus.INCONCLUSIVE }))
    ).toEqual({ tone: 'unknown', label: 'INCONCLUSIVE' });

    expect(
      deriveVerdict(makeReport({ assessment_status: AssessmentStatus.NEEDS_VERIFICATION }))
    ).toEqual({ tone: 'caution', label: 'VERIFICATION REQUIRED' });
  });

  it('never fabricates a perfect score when the report has none', async () => {
    const noScoreReport = makeReport({
      request_id: 'no-score-case',
      score: undefined,
      summary: 'The page returned too little content to assess.',
    });

    (globalThis as any).chrome.storage = {
      local: {
        get: (_keys: string[], callback: (value: unknown) => void) =>
          callback({
            credible_latest_report: noScoreReport,
            credible_scan_history: [noScoreReport],
          }),
        set: vi.fn(),
        remove: vi.fn(),
      },
    };

    render(<DashboardApp />);

    const scoreValue = await screen.findByTestId('dashboard-score-value');
    expect(scoreValue).toHaveTextContent(/not scored/i);
    expect(screen.getByTestId('dashboard-verdict-pill')).toHaveTextContent(/UNVERIFIED/i);
    expect(screen.queryByText(/CLEAN SIGNALS/i)).not.toBeInTheDocument();
    expect(screen.getByText(/verdict not established/i)).toBeInTheDocument();
  });

  it('shows an inline error instead of alert() when no scannable tab is open', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (chrome.tabs.query as any).mockImplementationOnce(
      (_query: unknown, callback: (tabs: unknown[]) => void) =>
        callback([{ id: 9, url: 'chrome://extensions' }])
    );

    render(<DashboardApp />);
    fireEvent.click(screen.getByTestId('dashboard-scan-btn'));

    const error = await screen.findByTestId('dashboard-scan-error');
    expect(error).toHaveTextContent(/open a regular website tab/i);
    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('asks for confirmation before clearing the scan ledger', async () => {
    render(<DashboardApp />);

    fireEvent.click(screen.getByTestId('ledger-clear-btn'));
    expect(screen.getByTestId('ledger-clear-confirm')).toBeInTheDocument();
    expect(screen.getByText(/INVESTIGATION SCAN LEDGER \(3\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ledger-clear-cancel-btn'));
    expect(screen.queryByTestId('ledger-clear-confirm')).not.toBeInTheDocument();
    expect(screen.getByTestId('ledger-clear-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ledger-clear-btn'));
    fireEvent.click(screen.getByTestId('ledger-clear-confirm-btn'));

    expect(await screen.findByText(/No historical scans recorded yet/i)).toBeInTheDocument();
  });

  it('generates a valid, structured Markdown security dossier with all sections', () => {
    const mockReport: AnalysisReport = {
      request_id: 'test-req-1234',
      status: 'completed',
      assessment_status: AssessmentStatus.SUSPICIOUS,
      score: 30,
      summary: 'Threat patterns detected.',
      analyzed_url: 'http://malicious.example.com/job',
      mode: AnalysisMode.PAGE,
      timestamp: '2026-11-02T00:00:00Z',
      findings: [
        {
          id: 'test-f1',
          title: 'Mandatory Deposit',
          description: 'Payment requested',
          severity: 'high' as any,
          confidence: Confidence.HIGH,
          status: 'detected' as any,
          evidence: [],
          source: 'deterministic' as any,
          limitations: [],
        },
      ],
      trust_dna: [
        {
          id: 'payment_risk',
          name: 'Payment Risk',
          status: 'warning_found' as any,
          confidence: Confidence.HIGH,
          summary: 'Fee requested',
          dimension_score: 20,
          evidence: [],
          limitations: [],
        },
      ],
      proof_mode: [
        {
          finding_id: 'test-f1',
          title: 'Mandatory Deposit',
          observed: 'Pay $250 fee',
          location: 'form > input',
          why_it_matters: 'Employment fee scams',
          source: 'reconciled' as any,
          is_deterministic: true,
          confidence: Confidence.HIGH,
          limitations: [],
        },
      ],
      next_best_actions: ['Do not pay money.'],
      checks: { executed: ['url.lookalike'], not_executed: [], unavailable: [], failed: [] },
      limitations: [],
    };

    const markdown = generateMarkdownDossier(mockReport);

    expect(markdown).toContain('# CREDIBLE SECURITY AUDIT DOSSIER');
    expect(markdown).toContain('test-req-1234');
    expect(markdown).toContain('30 / 100');
    expect(markdown).toContain('TRUST DNA MULTIDIMENSIONAL PROFILE');
    expect(markdown).toContain('Payment Risk');
    expect(markdown).toContain('PROOF MODE FORENSIC TRACE');
    expect(markdown).toContain('Pay $250 fee');
    expect(markdown).toContain('Engine Attribution:** Reconciled (Rules + AI)');
    expect(markdown).toContain('PROPORTIONATE NEXT BEST ACTIONS');
    expect(markdown).toContain('Do not pay money.');
  });
});
