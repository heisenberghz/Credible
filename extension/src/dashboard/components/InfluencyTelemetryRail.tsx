import React from 'react';
import { AnalysisReport } from '../../types/analysis';

interface InfluencyTelemetryRailProps {
  report: AnalysisReport;
  historyCount?: number;
}

const scrollToSection = (testId: string) => {
  const el = document.querySelector(`[data-testid="${testId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const titleCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '—';

export const InfluencyTelemetryRail: React.FC<InfluencyTelemetryRailProps> = ({
  report,
  historyCount = 0,
}) => {
  const executed = report.checks?.executed?.length || 0;
  const flagged = report.findings?.length || 0;
  const passed = Math.max(0, executed - flagged);
  const passPercent = executed > 0 ? Math.round((passed / executed) * 100) : 0;
  const evaluated = report.status === 'completed' && executed > 0;
  const dimensions = report.trust_dna?.length || 0;
  const evidence = report.trust_dna?.find((dim) => dim.id === 'evidence_confidence');

  const cells = [
    {
      id: 'rules',
      label: 'RULES PASSED',
      value: evaluated ? `${passPercent}%` : '—',
      meta: evaluated ? `${passed} of ${executed}` : 'not evaluated',
      target: 'heuristic-matrix-panel',
    },
    {
      id: 'threats',
      label: 'THREAT VECTORS',
      value: evaluated ? String(flagged) : '—',
      meta: !evaluated ? 'not evaluated' : flagged > 0 ? `${flagged} flagged` : 'none flagged',
      target: 'findings-section',
    },
    {
      id: 'evidence',
      label: 'EVIDENCE',
      value: titleCase(evidence?.confidence),
      meta: dimensions > 0 ? `${dimensions} dimensions` : 'no dimensions',
      target: 'trust-dna-panel',
    },
    {
      id: 'ledger',
      label: 'SCAN LEDGER',
      value: String(historyCount),
      meta: historyCount === 1 ? 'record' : 'records',
      target: 'scan-ledger',
    },
  ];

  return (
    <div className="case-rail" role="region" aria-label="Forensic Telemetry Metrics">
      {cells.map((cell) => (
        <button
          key={cell.id}
          type="button"
          className="case-rail-cell"
          onClick={() => scrollToSection(cell.target)}
        >
          <span className="case-rail-label">{cell.label}</span>
          <span className="case-rail-value-row">
            <span className="case-rail-value">{cell.value}</span>
            <span className="case-rail-meta">{cell.meta}</span>
          </span>
          <svg
            className="case-rail-arrow"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      ))}
    </div>
  );
};
