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
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '14px',
        marginBottom: '10px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
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
            fontSize: '10px',
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
            color: '#1E293B',
            backgroundColor: '#F8FAFC',
            borderLeft: '3px solid #2563EB',
            padding: '6px 10px',
            borderRadius: '0 6px 6px 0',
            marginBottom: '10px',
          }}
        >
          <strong style={{ color: '#2563EB' }}>Action: </strong>
          {finding.recommended_action}
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
          <span
            className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
            style={{ fontSize: '10px', display: 'inline-block' }}
          >
            {isExpanded ? '▲' : '▼'}
          </span>
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
              <span style={{ fontWeight: 500 }}>Check ID: </span>
              <code style={{ fontFamily: 'monospace', color: '#0F172A' }}>{finding.check_id}</code>
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
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#1E293B', marginBottom: '2px' }}>
                    {item.source}
                  </div>
                  {item.excerpt && (
                    <blockquote
                      style={{
                        margin: '4px 0',
                        padding: '4px 8px',
                        backgroundColor: '#FFFFFF',
                        borderLeft: '2px solid #CBD5E1',
                        color: '#334155',
                        fontStyle: 'italic',
                        fontSize: '11px',
                        wordBreak: 'break-word',
                      }}
                    >
                      "{item.excerpt}"
                    </blockquote>
                  )}
                  {item.reason && (
                    <div style={{ color: '#64748B', fontSize: '11px' }}>
                      <strong>Why: </strong>{item.reason}
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
