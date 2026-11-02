import React, { useState } from 'react';
import { TrustDnaDimension, TrustDnaStatus } from '../../types/analysis';
import { ConfidenceBadge } from './ConfidenceBadge';

interface TrustDnaPanelProps {
  dimensions: TrustDnaDimension[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  [TrustDnaStatus.WARNING_FOUND]: {
    label: 'Warning Found',
    icon: '⚠️',
    bg: '#FFF1F2',
    text: '#9F1239',
    border: '#FECDD3',
  },
  [TrustDnaStatus.NO_INDICATOR_DETECTED]: {
    label: 'No Warning Detected',
    icon: '✓',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
  },
  [TrustDnaStatus.UNKNOWN]: {
    label: 'Unknown',
    icon: '○',
    bg: '#F8FAFC',
    text: '#475569',
    border: '#CBD5E1',
  },
  // Backward compatibility aliases
  positive: {
    label: 'No Warning Detected',
    icon: '✓',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
  },
  concern: {
    label: 'Warning Found',
    icon: '⚠️',
    bg: '#FFF1F2',
    text: '#9F1239',
    border: '#FECDD3',
  },
  mixed: {
    label: 'Warning Found',
    icon: '⚠️',
    bg: '#FFF1F2',
    text: '#9F1239',
    border: '#FECDD3',
  },
  not_checked: {
    label: 'Unknown',
    icon: '○',
    bg: '#F8FAFC',
    text: '#64748B',
    border: '#E2E8F0',
  },
};

export const TrustDnaPanel: React.FC<TrustDnaPanelProps> = ({ dimensions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(id);
    } else if (e.key === 'Escape' && expandedId === id) {
      e.preventDefault();
      setExpandedId(null);
    }
  };

  return (
    <section
      className="trust-dna-section"
      data-testid="trust-dna-panel"
      aria-labelledby="trust-dna-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #ECEFF5',
        padding: '16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3
          id="trust-dna-heading"
          data-testid="trust-dna-title"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#111827',
          }}
        >
          Trust DNA Profile (6 Dimensions)
        </h3>
        <span style={{ fontSize: '10.5px', color: '#8E95A5', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>EVIDENCE-GROUNDED</span>
      </div>

      {/* Permanent Core Defensive Philosophy Notice Banner */}
      <div
        className="trust-dna-safety-notice"
        data-testid="trust-dna-safety-notice"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #ECEFF5',
          marginBottom: '14px',
          fontSize: '11px',
          lineHeight: '1.45',
          color: '#475569',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }} aria-hidden="true">
          ℹ️
        </span>
        <div>
          <strong style={{ color: '#111827', display: 'block', marginBottom: '2px' }}>
            Absence of a warning is not proof of safety.
          </strong>
          <span>
            Dimensions indicate observable heuristics. Independent verification via official employer channels is strongly advised.
          </span>
        </div>
      </div>

      <div
        className="trust-dna-grid"
        role="list"
        aria-label="Trust DNA Dimensions"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {dimensions.map((dim) => {
          const config = STATUS_CONFIG[dim.status] || STATUS_CONFIG[TrustDnaStatus.UNKNOWN];
          const isExpanded = expandedId === dim.id;
          const detailId = `trust-dna-detail-${dim.id}`;

          return (
            <div
              key={dim.id}
              role="listitem"
              data-testid={`trust-dna-dim-${dim.id}`}
              style={{
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                overflow: 'hidden',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Interactive Header Row */}
              <button
                type="button"
                onClick={() => toggleExpand(dim.id)}
                onKeyDown={(e) => handleKeyDown(e, dim.id)}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                data-testid={`dim-toggle-${dim.id}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span aria-hidden="true" style={{ fontSize: '12px' }}>{config.icon}</span>
                  <span
                    data-testid="dim-name"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                  >
                    {dim.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    data-testid="dim-status-badge"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: config.bg,
                      color: config.text,
                      border: `1px solid ${config.border}`,
                    }}
                  >
                    {config.label}
                  </span>
                  <ConfidenceBadge confidence={dim.confidence} />
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Summary preview (always visible) */}
              <div style={{ padding: '0 12px 10px 32px' }}>
                <p
                  data-testid="dim-summary"
                  style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}
                >
                  {dim.summary}
                </p>
              </div>

              {/* Expandable Evidence & Limitations */}
              {isExpanded && (
                <div
                  id={detailId}
                  data-testid={`dim-detail-${dim.id}`}
                  style={{
                    padding: '10px 12px',
                    borderTop: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '11px',
                  }}
                >
                  {dim.evidence && dim.evidence.length > 0 ? (
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#334155' }}>Attributed Evidence:</strong>
                      <ul style={{ paddingLeft: '16px', marginTop: '4px', color: '#475569' }}>
                        {dim.evidence.map((ev, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: 500 }}>{ev.source}: </span>
                            {ev.excerpt && <em>"{ev.excerpt}" — </em>}
                            <span>{ev.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ color: '#94A3B8', fontStyle: 'italic', marginBottom: '6px' }}>
                      No direct raw excerpt attached to this dimension.
                    </div>
                  )}

                  {dim.limitations && dim.limitations.length > 0 && (
                    <div style={{ color: '#94A3B8' }}>
                      <strong>Limitations: </strong>
                      {dim.limitations.join(' • ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

