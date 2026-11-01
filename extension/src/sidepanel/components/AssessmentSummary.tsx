import React, { useState } from 'react';
import { AssessmentStatus, AnalysisReport, AnalysisMode } from '../../types/analysis';
import { ScoreGauge } from './ScoreGauge';

interface AssessmentSummaryProps {
  report: AnalysisReport;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string; gradient: string }
> = {
  [AssessmentStatus.SUSPICIOUS]: {
    label: 'Suspicious Indicators Detected',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#FECACA',
    icon: '⚠️',
    gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
  },
  [AssessmentStatus.NEEDS_VERIFICATION]: {
    label: 'Verification Recommended',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
    icon: '🔍',
    gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  },
  [AssessmentStatus.CAUTION]: {
    label: 'Caution Warranted',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  },
  [AssessmentStatus.BENIGN]: {
    label: 'Standard Patterns Observed',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
    icon: '✓',
    gradient: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
  },
  [AssessmentStatus.INCONCLUSIVE]: {
    label: 'Inconclusive Signals',
    bg: '#F8FAFC',
    text: '#334155',
    border: '#CBD5E1',
    icon: 'ℹ️',
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
  },
};

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const statusKey = report.assessment_status || AssessmentStatus.INCONCLUSIVE;
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG[AssessmentStatus.INCONCLUSIVE];

  const handleCopySummary = async () => {
    try {
      const summaryText = `[Credible Assessment]\nVerdict: ${config.label}\nTarget: ${report.analyzed_url}\nSummary: ${report.summary}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Graceful fallback if clipboard API is restricted
    }
  };

  return (
    <div
      className="assessment-summary-card credible-card fade-in"
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
      {/* Verdict Header Badge with Copy Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          data-testid="verdict-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: config.gradient,
            backgroundColor: config.bg,
            color: config.text,
            border: `1px solid ${config.border}`,
            fontWeight: 600,
            fontSize: '13px',
            flexGrow: 1,
          }}
        >
          <span aria-hidden="true">{config.icon}</span>
          <span data-testid="assessment-status-label">{config.label}</span>
        </div>

        <button
          onClick={handleCopySummary}
          data-testid="copy-summary-btn"
          className={`btn-copy ${copied ? 'copied' : ''}`}
          title="Copy assessment summary to clipboard"
          aria-label="Copy assessment summary"
        >
          <span>{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Dynamic Animated Heuristic Score Gauge */}
      <ScoreGauge score={report.score ?? 100} />

      {/* Plain Language Summary */}
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
