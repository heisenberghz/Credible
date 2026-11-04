import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrustDnaPanel } from '../src/sidepanel/components/TrustDnaPanel';
import { ProofModePanel } from '../src/sidepanel/components/ProofModePanel';
import { NextBestActionList } from '../src/sidepanel/components/NextBestActionList';
import { ChecksAndLimitations } from '../src/sidepanel/components/ChecksAndLimitations';
import {
  Confidence,
  FindingSource,
  ProofModeEntry,
  TrustDnaDimension,
  TrustDnaStatus,
} from '../src/types/analysis';

const mockDimensions: TrustDnaDimension[] = [
  {
    id: 'payment_risk',
    name: 'Payment Risk',
    status: TrustDnaStatus.WARNING_FOUND,
    confidence: Confidence.HIGH,
    dimension_score: 20,
    summary: 'Explicit requests for upfront money or deposits detected.',
    evidence: [{ source: 'Content', excerpt: 'Pay $500 fee', reason: 'Fee request' }],
    limitations: [],
  },
  {
    id: 'identity_risk',
    name: 'Identity Risk',
    status: TrustDnaStatus.UNKNOWN,
    confidence: Confidence.LOW,
    dimension_score: 75,
    summary: 'Corporate identity records were not independently verified via registrar records.',
    evidence: [],
    limitations: ['WHOIS query not performed in MVP'],
  },
  {
    id: 'social_engineering_risk',
    name: 'Social Engineering Risk',
    status: TrustDnaStatus.WARNING_FOUND,
    confidence: Confidence.HIGH,
    dimension_score: 35,
    summary: 'High-pressure urgency tactics detected.',
    evidence: [{ source: 'Content Scan', excerpt: 'Expires today', reason: 'Time pressure' }],
    limitations: [],
  },
  {
    id: 'data_exposure_risk',
    name: 'Data Exposure Risk',
    status: TrustDnaStatus.NO_INDICATOR_DETECTED,
    confidence: Confidence.HIGH,
    dimension_score: 100,
    summary: 'No illicit credential harvesting observed.',
    evidence: [],
    limitations: [],
  },
  {
    id: 'link_domain_risk',
    name: 'Link and Domain Risk',
    status: TrustDnaStatus.NO_INDICATOR_DETECTED,
    confidence: Confidence.HIGH,
    dimension_score: 100,
    summary: 'Secure HTTPS protocol and standard domain structure with zero URL obfuscation.',
    evidence: [],
    limitations: [],
  },
  {
    id: 'evidence_confidence',
    name: 'Evidence Confidence',
    status: TrustDnaStatus.NO_INDICATOR_DETECTED,
    confidence: Confidence.MEDIUM,
    dimension_score: 90,
    summary: 'Assessment grounded reliably on client-observable deterministic heuristic rules.',
    evidence: [],
    limitations: [],
  },
];

const mockProofEntries: ProofModeEntry[] = [
  {
    finding_id: 'proof-1',
    title: 'Upfront Payment Required',
    observed: 'Transfer $500 upfront via crypto wallet',
    location: 'body > form > p',
    why_it_matters: 'Upfront irreversible cryptocurrency transfers are a hallmark of scam operations.',
    check_id: 'content.payment_pressure',
    source: FindingSource.DETERMINISTIC,
    is_deterministic: true,
    confidence: Confidence.HIGH,
    limitations: ['Static regex heuristic'],
  },
  {
    finding_id: 'proof-2',
    title: 'Impersonation Discrepancy',
    observed: 'Domain uses zero substitution: paypa1.com',
    location: 'window.location.hostname',
    why_it_matters: 'Visual lookalike domain impersonating established financial institution.',
    check_id: 'url.lookalike',
    source: FindingSource.RECONCILED,
    is_deterministic: true,
    confidence: Confidence.HIGH,
    limitations: [],
  },
];

describe('Trust DNA Panel', () => {
  it('renders all 6 Trust DNA dimensions with correct status indicators', () => {
    render(<TrustDnaPanel dimensions={mockDimensions} />);

    expect(screen.getByTestId('trust-dna-title')).toHaveTextContent(
      'Trust DNA Profile (6 Dimensions)'
    );

    // Verify all 6 canonical 5.1 dimensions are displayed
    expect(screen.getByText('Payment Risk')).toBeInTheDocument();
    expect(screen.getByText('Identity Risk')).toBeInTheDocument();
    expect(screen.getByText('Social Engineering Risk')).toBeInTheDocument();
    expect(screen.getByText('Data Exposure Risk')).toBeInTheDocument();
    expect(screen.getByText('Link and Domain Risk')).toBeInTheDocument();
    expect(screen.getByText('Evidence Confidence')).toBeInTheDocument();

    // Verify permanent defensive philosophy disclaimer is rendered
    expect(screen.getByTestId('trust-dna-safety-notice')).toHaveTextContent(
      'Absence of a warning is not proof of safety'
    );

    // Verify status labels
    expect(screen.getAllByText('Warning Found').length).toBe(2);
    expect(screen.getAllByText('No Warning Detected').length).toBe(3);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('supports keyboard navigation (Enter, Space, Escape) to expand/collapse details', () => {
    render(<TrustDnaPanel dimensions={mockDimensions} />);

    const toggleBtn = screen.getByTestId('dim-toggle-payment_risk');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Press Enter to expand
    fireEvent.keyDown(toggleBtn, { key: 'Enter' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('dim-detail-payment_risk')).toBeInTheDocument();
    expect(screen.getByText(/Pay \$500 fee/)).toBeInTheDocument();

    // Press Escape to collapse
    fireEvent.keyDown(toggleBtn, { key: 'Escape' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('dim-detail-payment_risk')).not.toBeInTheDocument();

    // Press Space to expand
    fireEvent.keyDown(toggleBtn, { key: ' ' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('clearly displays Unknown states without false verification claims', () => {
    render(<TrustDnaPanel dimensions={mockDimensions} />);

    const unknownDim = screen.getByTestId('trust-dna-dim-identity_risk');
    expect(unknownDim).toHaveTextContent('Unknown');
    expect(unknownDim).not.toHaveTextContent('Verified');

    // Click to expand accordion and reveal limitations
    fireEvent.click(screen.getByTestId('dim-toggle-identity_risk'));
    expect(unknownDim).toHaveTextContent('WHOIS query not performed in MVP');
  });
});

describe('Proof Mode Panel', () => {
  it('renders Proof Mode entries and traces findings to raw observations', () => {
    render(<ProofModePanel entries={mockProofEntries} />);

    expect(screen.getByTestId('proof-mode-title')).toHaveTextContent(
      'Proof Mode Trace (2)'
    );
    expect(screen.getByText('Upfront Payment Required')).toBeInTheDocument();
    expect(screen.getByText('Impersonation Discrepancy')).toBeInTheDocument();
  });

  it('distinguishes deterministic, reconciled, and AI analysis attribution', () => {
    const aiEntry: ProofModeEntry = {
      finding_id: 'proof-3',
      title: 'Brand Impersonation',
      observed: 'Page claims to represent Google careers',
      location: 'visible_text',
      why_it_matters: 'Unverified brand claims signal impersonation risk.',
      check_id: null,
      source: FindingSource.AI_INTERPRETED,
      is_deterministic: false,
      confidence: Confidence.MEDIUM,
      limitations: [],
    };

    render(<ProofModePanel entries={[...mockProofEntries, aiEntry]} />);

    const engineTags = screen.getAllByTestId('proof-engine-tag');
    expect(engineTags[0]).toHaveTextContent('Deterministic');
    expect(engineTags[1]).toHaveTextContent('Reconciled');
    expect(engineTags[1]).toHaveAttribute(
      'title',
      'Deterministic rules and AI analysis agree on this finding'
    );
    expect(engineTags[2]).toHaveTextContent('AI Analysis');
  });

  it('falls back to is_deterministic for older reports without a source field', () => {
    const legacyEntry: ProofModeEntry = {
      ...mockProofEntries[0],
      finding_id: 'proof-legacy',
      source: undefined,
      is_deterministic: false,
    };

    render(<ProofModePanel entries={[legacyEntry]} />);

    expect(screen.getByTestId('proof-engine-tag')).toHaveTextContent('AI Analysis');
  });

  it('expands proof details revealing exact observation, why it matters, and check ID', () => {
    render(<ProofModePanel entries={mockProofEntries} />);

    const toggle = screen.getByTestId('proof-toggle-proof-1');
    fireEvent.click(toggle);

    expect(screen.getByTestId('proof-detail-proof-1')).toBeInTheDocument();
    expect(screen.getByTestId('proof-observed')).toHaveTextContent(
      'Transfer $500 upfront via crypto wallet'
    );
    expect(screen.getByTestId('proof-why')).toHaveTextContent(
      'irreversible cryptocurrency transfers are a hallmark of scam operations'
    );
    expect(screen.getByText(/content\.payment_pressure/)).toBeInTheDocument();
  });

  it('renders 3-layer epistemological segmentation in Proof Mode (Observed, Threat, Corroboration)', () => {
    render(<ProofModePanel entries={mockProofEntries} />);

    const toggle = screen.getByTestId('proof-toggle-proof-1');
    fireEvent.click(toggle);

    // Layer 1: Raw Observed Signal
    expect(screen.getByTestId('proof-layer-observation')).toBeInTheDocument();
    expect(screen.getByText('1. Raw Observed Signal')).toBeInTheDocument();
    expect(screen.getByText('body > form > p')).toBeInTheDocument();

    // Layer 2: Threat Interpretation
    expect(screen.getByTestId('proof-layer-interpretation')).toBeInTheDocument();
    expect(screen.getByText('2. Threat Interpretation')).toBeInTheDocument();
    expect(screen.getByText('Deterministic Heuristic')).toBeInTheDocument();

    // Layer 3: External Corroboration
    expect(screen.getByTestId('proof-layer-corroboration')).toBeInTheDocument();
    expect(screen.getByText('3. External Corroboration')).toBeInTheDocument();
    expect(screen.getByTestId('corroboration-status-tag')).toHaveTextContent('Privacy-Preserving (Unchecked)');
  });
});

describe('Next Best Action List', () => {
  it('renders prioritized recommendations with non-alarmist tone', () => {
    const actions = [
      'Do not provide account credentials or passwords.',
      'Check the official address directly through your personal bookmark.',
      'Report suspected phishing to domain registrar.',
    ];

    render(<NextBestActionList actions={actions} />);

    expect(screen.getByTestId('next-actions-title')).toHaveTextContent(
      'Recommended Next Actions'
    );
    expect(screen.getByTestId('action-item-0')).toHaveTextContent(
      'Do not provide account credentials'
    );
    expect(screen.getByTestId('action-item-1')).toHaveTextContent(
      'Check the official address'
    );
    expect(screen.getByTestId('action-item-2')).toHaveTextContent(
      'Report suspected phishing'
    );
  });

  it('renders nothing when action list is empty', () => {
    const { container } = render(<NextBestActionList actions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Checks And Limitations Panel', () => {
  it('renders check summary counts and expands check scope pills', () => {
    const summary = {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure'],
      not_executed: ['network.tls_cert'],
      unavailable: [],
      failed: [],
    };
    const limitations = [
      'Visible DOM text was bounded to 50,000 characters.',
      'Client does not execute dynamic JavaScript re-navigation.',
    ];

    render(<ChecksAndLimitations checks={summary} limitations={limitations} />);

    expect(screen.getByTestId('checks-executed-count')).toHaveTextContent(
      '3 checks executed'
    );

    const toggleBtn = screen.getByTestId('checks-toggle-btn');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('checks-expanded-details')).toBeInTheDocument();
    expect(screen.getByText('✓ url.ip_host')).toBeInTheDocument();
    expect(screen.getByText('✓ content.payment_pressure')).toBeInTheDocument();
    expect(screen.getByText('○ network.tls_cert')).toBeInTheDocument();
    expect(screen.getByText(/Visible DOM text was bounded/)).toBeInTheDocument();
  });
});

describe('Safe Rendering & XSS Prevention', () => {
  it('safely escapes malicious script injection in proof mode and action text', () => {
    const maliciousProof: ProofModeEntry[] = [
      {
        finding_id: 'xss-proof',
        title: '<script>alert("xss-title")</script>',
        observed: '<img src="x" onerror="alert(\'xss-img\')" />',
        location: '<div onclick="alert(1)">dom</div>',
        why_it_matters: '<iframe src="javascript:alert(1)"></iframe>',
        check_id: '<b>check</b>',
        is_deterministic: true,
        confidence: Confidence.HIGH,
        limitations: ['<script>evil()</script>'],
      },
    ];

    const maliciousActions = ['<script>alert("action-xss")</script> Do safe action'];

    const { container } = render(
      <div>
        <ProofModePanel entries={maliciousProof} />
        <NextBestActionList actions={maliciousActions} />
      </div>
    );

    // Expand proof
    fireEvent.click(screen.getByTestId('proof-toggle-xss-proof'));

    // Verify scripts were NOT executed or rendered as DOM nodes
    const scripts = container.querySelectorAll('script');
    expect(scripts.length).toBe(0);

    const iframes = container.querySelectorAll('iframe');
    expect(iframes.length).toBe(0);

    // Verify raw strings are safely displayed as plain text
    expect(screen.getByTestId('proof-observed')).toHaveTextContent(
      '<img src="x" onerror="alert(\'xss-img\')" />'
    );
    expect(screen.getByTestId('action-text')).toHaveTextContent(
      '<script>alert("action-xss")</script> Do safe action'
    );
  });
});
