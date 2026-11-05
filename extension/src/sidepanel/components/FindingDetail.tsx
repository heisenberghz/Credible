import React, { useState } from 'react';
import { Finding, FindingSource } from '../../types/analysis';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

interface FindingDetailProps {
  finding: Finding;
  initiallyExpanded?: boolean;
}

export const FindingDetail: React.FC<FindingDetailProps> = ({
  finding,
  initiallyExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);

  const getSourceLabel = (src: FindingSource | string) => {
    switch (src) {
      case FindingSource.DETERMINISTIC:
        return 'Rule Check';
      case FindingSource.AI_INTERPRETED:
        return 'AI Analysis';
      case FindingSource.RECONCILED:
        return 'Reconciled';
      default:
        return String(src);
    }
  };

  const severityClass = `severity-${finding.severity?.toLowerCase() || 'informational'}`;

  return (
    <div
      className={`finding-card credible-card ${severityClass}`}
      data-testid="finding-card"
      data-finding-id={finding.id}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #ECEFF5',
        padding: '15px',
        marginBottom: '10px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
      }}
    >
      {/* Badges Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SeverityBadge severity={finding.severity} />
          <ConfidenceBadge confidence={finding.confidence} />
        </div>

        <span
          data-testid="finding-source"
          style={{
            fontSize: '11px',
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #E2E8F0',
            fontWeight: 500,
          }}
        >
          {getSourceLabel(finding.source)}
        </span>
      </div>

      {/* Finding Title */}
      <h3
        data-testid="finding-title"
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#0F172A',
          marginBottom: '6px',
          lineHeight: '1.4',
        }}
      >
        {finding.title}
      </h3>

      {/* Description */}
      <p
        data-testid="finding-description"
        style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.45',
          marginBottom: '10px',
        }}
      >
        {finding.description}
      </p>

      {/* Recommended Action Pill (if present) */}
      {finding.recommended_action && (
        <div
          data-testid="finding-action"
          style={{
            fontSize: '12px',
            color: '#0F172A',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0052FF', fontFamily: 'monospace' }}>
            Action:
          </span>
          <span style={{ flex: 1, lineHeight: 1.45 }}>{finding.recommended_action}</span>
        </div>
      )}

      {/* View Proof Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="proof-toggle-btn"
          aria-expanded={isExpanded}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563EB',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 6px',
            borderRadius: '4px',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>{isExpanded ? 'Hide Evidence' : 'View Proof & Evidence'}</span>
          <svg
            className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expandable Evidence Details */}
      {isExpanded && (
        <div
          data-testid="proof-section"
          className="fade-in"
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #F1F5F9',
            fontSize: '12px',
          }}
        >
          {finding.check_id && (
            <div style={{ marginBottom: '8px', color: '#64748B' }}>
              <span style={{ fontWeight: 600 }}>Check ID: </span>
              <code style={{ fontFamily: 'monospace', color: '#0F172A', backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>{finding.check_id}</code>
            </div>
          )}

          {finding.evidence && finding.evidence.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Observed Evidence:</span>
              {finding.evidence.map((item, idx) => (
                <div
                  key={idx}
                  data-testid="evidence-item"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                    {item.source}
                  </div>
                  {item.excerpt && (
                    <blockquote
                      style={{
                        margin: '4px 0 6px 0',
                        padding: '6px 10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontStyle: 'normal',
                        fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                        fontSize: '11px',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      "{item.excerpt}"
                    </blockquote>
                  )}
                  {item.reason && (
                    <div style={{ color: '#475569', fontSize: '11px', lineHeight: 1.45 }}>
                      <strong style={{ color: '#0F172A' }}>Why it matters: </strong>{item.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
              No raw excerpt evidence available for this check.
            </div>
          )}

          {finding.limitations && finding.limitations.length > 0 && (
            <div style={{ marginTop: '8px', color: '#94A3B8', fontSize: '11px' }}>
              <strong>Limitations: </strong>
              {finding.limitations.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
