import React from 'react';
import { AnalysisReport, AssessmentStatus } from '../../types/analysis';

interface InfluencyKpiRowProps {
  report: AnalysisReport;
  historyCount?: number;
}

const scrollToSection = (testId: string) => {
  const el = document.querySelector(`[data-testid="${testId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const InfluencyKpiRow: React.FC<InfluencyKpiRowProps> = ({ report, historyCount = 3 }) => {
  const score = report.score ?? 100;
  const executedCount = report.checks?.executed?.length || 10;
  const threatCount = report.findings?.length || 0;
  const passedCount = Math.max(0, executedCount - threatCount);
  const passPercent = Math.round((passedCount / executedCount) * 100);
  const isThreat = report.assessment_status === AssessmentStatus.SUSPICIOUS || score < 50;

  return (
    <div className="influency-kpi-grid" role="region" aria-label="Forensic Telemetry Metrics">
      {/* Card 1: Electric Lime Primary Accent Card */}
      <div className="influency-kpi-card influency-kpi-lime">
        <div className="influency-kpi-top">
          <div className="influency-icon-circle white-glass" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <button
            type="button"
            className="influency-arrow-btn dark-pill"
            aria-label="Inspect trust score calculation"
            title="Inspect trust score calculation"
            onClick={() => scrollToSection('trust-dna-panel')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        <div className="influency-kpi-bottom">
          <div className="influency-kpi-value dark-text">
            {score < 10 ? `0${score}` : score}
            <span style={{ fontSize: '16px', fontWeight: 700, marginLeft: '4px', opacity: 0.7 }}>/ 100</span>
          </div>
          <div className="influency-kpi-sub dark-sub">
            {isThreat ? 'Critical Threat Risk Index' : 'Overall Trust Index'}
          </div>
        </div>
      </div>

      {/* Card 2: Heuristic Rules Passed */}
      <div className="influency-kpi-card influency-kpi-white">
        <div className="influency-kpi-top">
          <div className="influency-icon-circle outline-circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <button
            type="button"
            className="influency-arrow-btn outline-pill"
            aria-label="Inspect heuristic rules"
            title="Inspect heuristic rules"
            onClick={() => scrollToSection('heuristic-matrix-panel')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        <div className="influency-kpi-bottom">
          <div className="influency-kpi-value-inline">
            <span className="influency-kpi-value">{passPercent}%</span>
            <span className="influency-kpi-meta">{passedCount} of {executedCount} rules</span>
          </div>
          <div className="influency-kpi-sub">Deterministic Heuristics Passed</div>
        </div>
      </div>

      {/* Card 3: Threat Vectors Flagged */}
      <div className="influency-kpi-card influency-kpi-white">
        <div className="influency-kpi-top">
          <div className="influency-icon-circle outline-circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <button
            type="button"
            className="influency-arrow-btn outline-pill"
            aria-label="Inspect threat findings"
            title="Inspect threat findings"
            onClick={() => scrollToSection('findings-section')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        <div className="influency-kpi-bottom">
          <div className="influency-kpi-value-inline">
            <span className="influency-kpi-value">{threatCount}</span>
            <span
              className="influency-kpi-chip-blue"
              style={{
                backgroundColor: threatCount > 0 ? '#FFE4E6' : '#E0EAFF',
                color: threatCount > 0 ? '#E11D48' : '#2563EB',
              }}
            >
              {threatCount > 0 ? `+${threatCount} FLAGGED` : 'CLEAN'}
            </span>
          </div>
          <div className="influency-kpi-sub">Threat Vectors Triggered</div>
        </div>
      </div>

      {/* Card 4: Historical Scans / Audits */}
      <div className="influency-kpi-card influency-kpi-white">
        <div className="influency-kpi-top">
          <div className="influency-icon-circle outline-circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <button
            type="button"
            className="influency-arrow-btn outline-pill"
            aria-label="View audit ledger"
            title="View audit ledger"
            onClick={() => scrollToSection('scan-ledger')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        <div className="influency-kpi-bottom">
          <div className="influency-kpi-value">{historyCount} Records</div>
          <div className="influency-kpi-sub">Investigation Ledger History</div>
        </div>
      </div>
    </div>
  );
};
