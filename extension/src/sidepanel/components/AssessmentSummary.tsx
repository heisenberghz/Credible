import React from 'react';
import { AssessmentStatus, AnalysisReport, AnalysisMode } from '../../types/analysis';

interface AssessmentSummaryProps {
  report: AnalysisReport;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  [AssessmentStatus.SUSPICIOUS]: {
    label: 'Suspicious Indicators Detected',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#FECACA',
    icon: '⚠️',
  },
  [AssessmentStatus.NEEDS_VERIFICATION]: {
    label: 'Verification Recommended',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
    icon: '🔍',
  },
  [AssessmentStatus.CAUTION]: {
    label: 'Caution Warranted',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
    icon: '⚡',
  },
  [AssessmentStatus.BENIGN]: {
    label: 'Standard Patterns Observed',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
    icon: '✓',
  },
  [AssessmentStatus.INCONCLUSIVE]: {
    label: 'Inconclusive Signals',
    bg: '#F8FAFC',
    text: '#334155',
    border: '#CBD5E1',
    icon: 'ℹ️',
  },
};

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ report }) => {
  const statusKey = report.assessment_status || AssessmentStatus.INCONCLUSIVE;
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG[AssessmentStatus.INCONCLUSIVE];

  return (
    <div
      className="assessment-summary-card"
      data-testid="assessment-summary"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        padding: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        marginBottom: '16px',
      }}
    >
      {/* Verdict Header Badge */}
      <div
        data-testid="verdict-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: config.bg,
          color: config.text,
          border: `1px solid ${config.border}`,
          fontWeight: 600,
          fontSize: '13px',
          marginBottom: '12px',
        }}
      >
        <span aria-hidden="true">{config.icon}</span>
        <span data-testid="assessment-status-label">{config.label}</span>
      </div>

      {/* Plain Language Summary (No opaque numerical score) */}
      <p
        data-testid="summary-text"
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#1E293B',
          fontWeight: 400,
          marginBottom: '12px',
        }}
      >
        {report.summary}
      </p>

      {/* Context metadata: Target URL & Mode */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '11px',
          color: '#64748B',
          borderTop: '1px solid #F1F5F9',
          paddingTop: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontWeight: 500 }}>Target:</span>
          <span
            data-testid="target-url"
            style={{
              fontFamily: 'monospace',
              color: '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '220px',
            }}
            title={report.analyzed_url}
          >
            {report.analyzed_url}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 500 }}>Scan Mode:</span>
          <span data-testid="scan-mode" style={{ textTransform: 'capitalize' }}>
            {report.mode === AnalysisMode.SELECTION ? 'Selection Verification' : 'Full Page Scan'}
          </span>
        </div>

        {report.timestamp && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Evaluated:</span>
            <span>{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

