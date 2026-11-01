import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrustDnaPanel } from '../src/sidepanel/components/TrustDnaPanel';
import { ProofModePanel } from '../src/sidepanel/components/ProofModePanel';
import { NextBestActionList } from '../src/sidepanel/components/NextBestActionList';
import { ChecksAndLimitations } from '../src/sidepanel/components/ChecksAndLimitations';
import {
  Confidence,
  ProofModeEntry,
  TrustDnaDimension,
  TrustDnaStatus,
} from '../src/types/analysis';

const mockDimensions: TrustDnaDimension[] = [
  {
    id: 'identity_domain',
    name: 'Identity & Domain Signals',
    status: TrustDnaStatus.POSITIVE,
    confidence: Confidence.HIGH,
    summary: 'Standard domain structure, registered reputable registrar.',
    evidence: [{ source: 'URL Analysis', excerpt: 'example.com', reason: 'No lookalike match' }],
    limitations: [],
  },
  {
    id: 'connection_technical',
    name: 'Connection & Technical Signals',
    status: TrustDnaStatus.NOT_CHECKED,
    confidence: Confidence.UNKNOWN,
    summary: 'Off-page TLS handshake not directly checked in client sandbox.',
    evidence: [],
    limitations: ['Off-page network checks not active in client mode'],
  },
  {
    id: 'transparency',
    name: 'Transparency Signals',
    status: TrustDnaStatus.UNKNOWN,
    confidence: Confidence.UNKNOWN,
    summary: 'Organizational disclosure signals inconclusive on this page.',
    evidence: [],
    limitations: [],
  },
  {
    id: 'page_behavior',
    name: 'Page Behavior Signals',
    status: TrustDnaStatus.POSITIVE,
    confidence: Confidence.MEDIUM,
    summary: 'No aggressive popups or redirect obfuscation.',
    evidence: [],
    limitations: [],
  },
  {
    id: 'content_consistency',
    name: 'Content & Offer Consistency',
    status: TrustDnaStatus.MIXED,
    confidence: Confidence.MEDIUM,
    summary: 'Promotional language exhibits minor urgency claims.',
    evidence: [{ source: 'Content Scan', excerpt: 'Expires today', reason: 'Time pressure' }],
    limitations: [],
  },
  {
    id: 'credential_payment_pressure',
    name: 'Credential & Payment Pressure',
    status: TrustDnaStatus.CONCERN,
    confidence: Confidence.HIGH,
    summary: 'Detected demands for sensitive authentication password entry.',
    evidence: [{ source: 'DOM Inspection', excerpt: 'Enter account password', reason: 'Login demand' }],
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

    // Verify all 6 dimensions are displayed
    expect(screen.getByText('Identity & Domain Signals')).toBeInTheDocument();
    expect(screen.getByText('Connection & Technical Signals')).toBeInTheDocument();
    expect(screen.getByText('Transparency Signals')).toBeInTheDocument();
    expect(screen.getByText('Page Behavior Signals')).toBeInTheDocument();
    expect(screen.getByText('Content & Offer Consistency')).toBeInTheDocument();
    expect(screen.getByText('Credential & Payment Pressure')).toBeInTheDocument();

    // Verify status labels
    expect(screen.getAllByText('Positive').length).toBe(2);
    expect(screen.getByText('Not Checked')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Mixed')).toBeInTheDocument();
    expect(screen.getByText('Concern')).toBeInTheDocument();
  });

  it('supports keyboard navigation (Enter, Space, Escape) to expand/collapse details', () => {
    render(<TrustDnaPanel dimensions={mockDimensions} />);

    const toggleBtn = screen.getByTestId('dim-toggle-identity_domain');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Press Enter to expand
    fireEvent.keyDown(toggleBtn, { key: 'Enter' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('dim-detail-identity_domain')).toBeInTheDocument();
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();

    // Press Escape to collapse
    fireEvent.keyDown(toggleBtn, { key: 'Escape' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('dim-detail-identity_domain')).not.toBeInTheDocument();

    // Press Space to expand
    fireEvent.keyDown(toggleBtn, { key: ' ' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('clearly displays Unknown and Not Checked states without false verification claims', () => {
    render(<TrustDnaPanel dimensions={mockDimensions} />);

    const notCheckedDim = screen.getByTestId('trust-dna-dim-connection_technical');
    expect(notCheckedDim).toHaveTextContent('Not Checked');
    expect(notCheckedDim).not.toHaveTextContent('Verified');

    const unknownDim = screen.getByTestId('trust-dna-dim-transparency');
    expect(unknownDim).toHaveTextContent('Unknown');
    expect(unknownDim).not.toHaveTextContent('Verified');
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

  it('distinguishes deterministic vs AI analysis engine attribution', () => {
    render(<ProofModePanel entries={mockProofEntries} />);

    const engineTags = screen.getAllByTestId('proof-engine-tag');
    expect(engineTags[0]).toHaveTextContent('Deterministic');
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
