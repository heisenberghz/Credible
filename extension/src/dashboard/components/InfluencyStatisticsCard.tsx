import React, { useState } from 'react';
import { AnalysisReport } from '../../types/analysis';

interface InfluencyStatisticsCardProps {
  report: AnalysisReport;
}

export const InfluencyStatisticsCard: React.FC<InfluencyStatisticsCardProps> = ({ report }) => {
  const [selectedDimension, setSelectedDimension] = useState<string>('Payment');

  // Map 6 Trust DNA dimensions into the dual-bar visual presentation
  const dimensionsMap: Record<string, { label: string; score: number; baseline: number }> = {
    payment_risk: { label: 'Payment', score: 99, baseline: 100 },
    identity_risk: { label: 'Identity', score: 75, baseline: 100 },
    social_engineering_risk: { label: 'Social', score: 98, baseline: 100 },
    data_exposure_risk: { label: 'Exposure', score: 99, baseline: 100 },
    link_domain_risk: { label: 'Links', score: 100, baseline: 100 },
    evidence_confidence: { label: 'Evidence', score: 92, baseline: 100 },
  };

  // Populate actual dimension scores from the active report
  if (report?.trust_dna) {
    report.trust_dna.forEach((dim) => {
      if (dimensionsMap[dim.id]) {
        dimensionsMap[dim.id].score = dim.dimension_score ?? (dim.status === 'warning_found' ? 15 : 95);
      }
    });
  }

  const chartColumns = Object.entries(dimensionsMap).map(([key, val]) => ({
    id: key,
    label: val.label,
    blueVal: 80, // Target pass threshold reference bar
    limeVal: Math.min(100, Math.max(8, val.score)), // Observed dimension score
    scoreText: `${val.score} / 100`,
  }));

  return (
    <div className="influency-card influency-stats-card">
      {/* Header */}
      <div className="influency-card-header">
        <div className="influency-card-title-group">
          <div className="influency-card-icon-frame" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <h2 className="influency-card-title">Trust DNA Multi-Factor Telemetry</h2>
        </div>

        <div className="influency-card-controls">
          <button type="button" className="influency-pill-toggle">
            <span>6 Dimensions</span>
          </button>
          <button
            type="button"
            className="influency-circle-tool-btn"
            title="Inspect heuristic matrix"
            aria-label="Inspect heuristic matrix"
            onClick={() => {
              const el = document.getElementById('forensic-workbench-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-Metrics: Privacy & Deterministic Precedence */}
      <div className="influency-stats-metrics-row">
        <div className="influency-metric-block">
          <span className="influency-metric-label">Client-Side Privacy Boundary</span>
          <div className="influency-metric-val">100% Isolated</div>
          <div className="influency-metric-trend">
            <span className="trend-green">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              0 PII Leaks
            </span>
            <span className="trend-context">Passwords & cards stripped before egress</span>
          </div>
        </div>

        <div className="influency-metric-divider" />

        <div className="influency-metric-block">
          <span className="influency-metric-label">Deterministic Precedence</span>
          <div className="influency-metric-val">High Fidelity</div>
          <div className="influency-metric-trend">
            <span className="trend-green">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Grounded Rules
            </span>
            <span className="trend-context">AI cannot override security guardrails</span>
          </div>
        </div>
      </div>

      {/* Double Bar Chart with Y-Axis */}
      <div className="influency-chart-wrapper">
        {/* Y Axis Labels */}
        <div className="influency-chart-yaxis" aria-hidden="true">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>

        {/* Chart Canvas */}
        <div className="influency-chart-area">
          {/* Horizontal Grid lines */}
          <div className="influency-chart-grid-lines" aria-hidden="true">
            <div className="grid-line" />
            <div className="grid-line" />
            <div className="grid-line" />
            <div className="grid-line" />
            <div className="grid-line" />
          </div>

          {/* Bar Columns */}
          <div className="influency-chart-columns">
            {chartColumns.map((col) => {
              const isSelected = selectedDimension === col.label;
              return (
                <div
                  key={col.id}
                  className="influency-chart-col"
                  onClick={() => setSelectedDimension(col.label)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${col.label} Dimension`}
                >
                  <div className="influency-bars-container">
                    {/* Tooltip on active bar */}
                    {isSelected && (
                      <div className="influency-bar-tooltip">
                        <span className="tooltip-amount">{col.scoreText}</span>
                        <span className="tooltip-date">{col.label} Trust Score</span>
                        <div className="tooltip-pin-dot" />
                      </div>
                    )}

                    {/* Periwinkle Blue Reference Bar (Pass Standard) */}
                    <div
                      className="bar-item bar-blue"
                      style={{ height: `${col.blueVal}%` }}
                      title={`${col.label} Security Threshold: ${col.blueVal}%`}
                    />
                    {/* Electric Lime Observed Score Bar */}
                    <div
                      className="bar-item bar-lime"
                      style={{ height: `${col.limeVal}%` }}
                      title={`${col.label} Observed Score: ${col.limeVal}%`}
                    />
                  </div>
                  <span className="influency-col-label">{col.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
