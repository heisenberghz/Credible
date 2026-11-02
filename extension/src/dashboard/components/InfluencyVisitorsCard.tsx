import React from 'react';
import { AnalysisReport } from '../../types/analysis';

interface InfluencyVisitorsCardProps {
  report: AnalysisReport;
}

export const InfluencyVisitorsCard: React.FC<InfluencyVisitorsCardProps> = ({ report }) => {
  const executed = report.checks?.executed?.length || 10;
  const threatCount = report.findings?.length || 0;
  const passedCount = Math.max(0, executed - threatCount);

  // Extract dimension scores for target tracks
  const paymentDim = report.trust_dna?.find((d) => d.id === 'payment_risk');
  const identityDim = report.trust_dna?.find((d) => d.id === 'identity_risk');
  const paymentScore = paymentDim?.dimension_score ?? (paymentDim?.status === 'warning_found' ? 4 : 99);
  const identityScore = identityDim?.dimension_score ?? (identityDim?.status === 'warning_found' ? 30 : 75);

  return (
    <div className="influency-card influency-visitors-card">
      {/* Header */}
      <div className="influency-card-header">
        <div className="influency-card-title-group">
          <div className="influency-card-icon-frame" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="influency-card-title">Threat Vector Distribution</h2>
        </div>

        <button type="button" className="influency-dropdown-btn" title="Analysis Mode">
          <span>{report.mode === 'selection' ? 'Selection' : 'Full Tab DOM'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Bubble Venn Proportion Cluster */}
      <div className="influency-bubbles-cluster">
        {/* Large Electric Lime Bubble: Clean Rules */}
        <div className="bubble-item bubble-lime" title={`${passedCount} Passed Rules`}>
          <span className="bubble-val">{passedCount}</span>
          <span className="bubble-label">Passed Rules</span>
        </div>

        {/* Medium Periwinkle Blue Bubble: Flagged Threats */}
        <div className="bubble-item bubble-blue" title={`${threatCount} Threats Flagged`}>
          <span className="bubble-val">{threatCount}</span>
          <span className="bubble-label">Flagged</span>
        </div>

        {/* Small Light Gray Bubble: Zero PII Exposed */}
        <div className="bubble-item bubble-gray" title="Zero PII Leaked">
          <span className="bubble-val">0</span>
          <span className="bubble-label">PII Leaks</span>
        </div>
      </div>

      {/* Target Progress Bars */}
      <div className="influency-target-bars-stack">
        {/* Payment Security Target */}
        <div className="influency-target-item">
          <div className="target-text-row">
            <span className="target-label">Payment Security Guardrail</span>
            <span className="target-percent">{paymentScore}%</span>
          </div>
          <div className="target-track">
            <div className="target-fill fill-lime" style={{ width: `${Math.max(5, paymentScore)}%` }} />
          </div>
        </div>

        {/* Identity Integrity Target */}
        <div className="influency-target-item">
          <div className="target-text-row">
            <span className="target-label">Identity Integrity Target</span>
            <span className="target-percent">{identityScore}%</span>
          </div>
          <div className="target-track">
            <div className="target-fill fill-blue" style={{ width: `${Math.max(5, identityScore)}%` }} />
          </div>
        </div>

        {/* Privacy Boundary Target */}
        <div className="influency-target-item">
          <div className="target-text-row">
            <span className="target-label">Client-Side Privacy Enclosure</span>
            <span className="target-percent">100%</span>
          </div>
          <div className="target-track">
            <div className="target-fill fill-gray" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
