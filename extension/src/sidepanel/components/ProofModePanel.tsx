import React, { useState } from 'react';
import { ProofModeEntry } from '../../types/analysis';
import { ConfidenceBadge } from './ConfidenceBadge';

interface ProofModePanelProps {
  entries: ProofModeEntry[];
}

export const ProofModePanel: React.FC<ProofModePanelProps> = ({ entries }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return null;
  }

  const toggleExpand = (findingId: string) => {
    setExpandedId((prev) => (prev === findingId ? null : findingId));
  };

  const handleKeyDown = (e: React.KeyboardEvent, findingId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(findingId);
    } else if (e.key === 'Escape' && expandedId === findingId) {
      e.preventDefault();
      setExpandedId(null);
    }
  };

  return (
    <section
      className="proof-mode-section"
      data-testid="proof-mode-panel"
      aria-labelledby="proof-mode-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3
          id="proof-mode-heading"
          data-testid="proof-mode-title"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#475569',
          }}
        >
          Proof Mode Trace ({entries.length})
        </h3>
        <span style={{ fontSize: '11px', color: '#64748B' }}>Audit Evidence</span>
      </div>

      <div
        className="proof-entries-list"
        role="list"
        aria-label="Proof Mode Entries"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.finding_id;
          const detailId = `proof-detail-${entry.finding_id}`;

          return (
            <div
              key={entry.finding_id}
              role="listitem"
              data-testid={`proof-entry-${entry.finding_id}`}
              style={{
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleExpand(entry.finding_id)}
                onKeyDown={(e) => handleKeyDown(e, entry.finding_id)}
                aria-expanded={isExpanded}
                aria-controls={detailId}
                data-testid={`proof-toggle-${entry.finding_id}`}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span
                    data-testid="proof-entry-title"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                  >
                    {entry.title}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Observed in: {entry.location}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    data-testid="proof-engine-tag"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: entry.is_deterministic ? '#F1F5F9' : '#EEF2FF',
                      color: entry.is_deterministic ? '#334155' : '#4338CA',
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                    }}
                  >
                    {entry.is_deterministic ? 'Deterministic' : 'AI Analysis'}
                  </span>
                  <ConfidenceBadge confidence={entry.confidence} />
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

              {/* Expandable Deep Proof Details */}
              {isExpanded && (
                <div
                  id={detailId}
                  data-testid={`proof-detail-${entry.finding_id}`}
                  style={{
                    padding: '12px',
                    borderTop: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '12px',
                    lineHeight: '1.45',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                      Exact Observation:
                    </strong>
                    <blockquote
                      data-testid="proof-observed"
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#F8FAFC',
                        borderLeft: '3px solid #3B82F6',
                        borderRadius: '0 6px 6px 0',
                        color: '#1E293B',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {entry.observed}
                    </blockquote>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#0F172A' }}>Why This Matters: </strong>
                    <span data-testid="proof-why" style={{ color: '#475569' }}>
                      {entry.why_it_matters}
                    </span>
                  </div>

                  {entry.check_id && (
                    <div style={{ marginBottom: '8px', color: '#64748B', fontSize: '11px' }}>
                      <strong>Attributed Rule ID: </strong>
                      <code>{entry.check_id}</code>
                    </div>
                  )}

                  {entry.limitations && entry.limitations.length > 0 && (
                    <div style={{ color: '#94A3B8', fontSize: '11px' }}>
                      <strong>Caveats & Limitations: </strong>
                      {entry.limitations.join(' • ')}
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

