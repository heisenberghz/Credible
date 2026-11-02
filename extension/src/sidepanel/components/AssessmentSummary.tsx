import React, { useState } from 'react';
import { AssessmentStatus, AnalysisReport, AnalysisMode } from '../../types/analysis';
import { ScoreGauge } from './ScoreGauge';

interface AssessmentSummaryProps {
  report: AnalysisReport;
}

interface StatusTheme {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const STATUS_CONFIG: Record<string, StatusTheme> = {
  [AssessmentStatus.SUSPICIOUS]: {
    label: 'Suspicious Indicators Detected',
    bg: '#FFF1F2',
    text: '#9F1239',
    border: '#FECDD3',
  },
  [AssessmentStatus.NEEDS_VERIFICATION]: {
    label: 'Verification Recommended',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
  },
  [AssessmentStatus.CAUTION]: {
    label: 'Caution Warranted',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
  },
  [AssessmentStatus.BENIGN]: {
    label: 'Standard Patterns Observed',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
  },
  [AssessmentStatus.INCONCLUSIVE]: {
    label: 'Inconclusive Signals',
    bg: '#F8FAFC',
    text: '#334155',
    border: '#CBD5E1',
  },
};

const renderVerdictIcon = (status: string) => {
  switch (status) {
    case AssessmentStatus.SUSPICIOUS:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case AssessmentStatus.BENIGN:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case AssessmentStatus.CAUTION:
    case AssessmentStatus.NEEDS_VERIFICATION:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const statusKey = report.assessment_status || AssessmentStatus.INCONCLUSIVE;
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG[AssessmentStatus.INCONCLUSIVE];

  const handleCopyUrl = async () => {
    if (!report?.analyzed_url) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(report.analyzed_url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
  };

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
        borderRadius: '18px',
        padding: '16px',
        border: '1px solid #ECEFF5',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
        marginBottom: '14px',
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
            borderRadius: '12px',
            backgroundColor: config.bg,
            color: config.text,
            border: `1px solid ${config.border}`,
            fontWeight: 700,
            fontSize: '12.5px',
            flexGrow: 1,
          }}
        >
          {renderVerdictIcon(statusKey)}
          <span data-testid="assessment-status-label">{config.label}</span>
        </div>

        <button
          onClick={handleCopySummary}
          data-testid="copy-summary-btn"
          className={`btn-copy ${copied ? 'copied' : ''}`}
          title="Copy assessment summary to clipboard"
          aria-label="Copy assessment summary"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Dynamic Animated Heuristic Score Gauge */}
      <ScoreGauge score={report.score ?? 100} />

      {/* Plain Language Summary */}
      <p
        data-testid="summary-text"
        style={{
          fontSize: '13.5px',
          lineHeight: '1.55',
          color: '#111827',
          fontWeight: 500,
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
          gap: '5px',
          fontSize: '11px',
          color: '#8E95A5',
          borderTop: '1px solid #ECEFF5',
          paddingTop: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontWeight: 500, flexShrink: 0 }}>Target:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span
              data-testid="target-url"
              className="target-url-truncated"
              style={{
                fontFamily: 'monospace',
                color: '#0F172A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
                display: 'inline-block',
              }}
              title={report.analyzed_url}
            >
              {report.analyzed_url}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className={`btn-copy-url-mini ${copiedUrl ? 'copied' : ''}`}
              title="Copy Target URL"
              aria-label="Copy Target URL"
            >
              {copiedUrl ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
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
