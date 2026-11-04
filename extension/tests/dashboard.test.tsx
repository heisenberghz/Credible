import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardApp } from '../src/dashboard/App';
import { generateMarkdownDossier } from '../src/dashboard/utils/dossierExporter';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../src/types/analysis';

describe('Task 20: Full-Tab Command Center Dashboard Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-verdict-pill')).toBeInTheDocument();

    // 2-Column layout checks
    expect(screen.getByTestId('trust-dna-panel')).toBeInTheDocument();
    expect(screen.getByTestId('next-actions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('scan-ledger')).toBeInTheDocument();
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
