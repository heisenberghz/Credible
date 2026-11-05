import React, { useState } from 'react';
import { FindingSource, ProofModeEntry } from '../../types/analysis';
import { ConfidenceBadge } from './ConfidenceBadge';

interface ProofModePanelProps {
  entries: ProofModeEntry[];
  showEmptyCleanState?: boolean;
}

interface ProofAttribution {
  label: string;
  engineLabel: string;
  background: string;
  color: string;
  border: string;
  tooltip: string;
}

function resolveAttribution(entry: ProofModeEntry): ProofAttribution {
  const source =
    entry.source ??
    (entry.is_deterministic ? FindingSource.DETERMINISTIC : FindingSource.AI_INTERPRETED);

  switch (source) {
    case FindingSource.RECONCILED:
      return {
        label: 'Reconciled',
        engineLabel: 'Reconciled (Rules + AI)',
        background: '#ECFDF5',
        color: '#047857',
        border: '#A7F3D0',
        tooltip: 'Deterministic rules and AI analysis agree on this finding',
      };
    case FindingSource.AI_INTERPRETED:
      return {
        label: 'AI Analysis',
        engineLabel: 'AI Semantic Inference',
        background: '#EEF2FF',
        color: '#4338CA',
        border: '#C7D2FE',
        tooltip: 'Found by AI contextual analysis, not by a deterministic rule',
      };
    default:
      return {
        label: 'Deterministic',
        engineLabel: 'Deterministic Heuristic',
        background: '#F1F5F9',
        color: '#334155',
        border: '#CBD5E1',
        tooltip: 'Found by deterministic security rules',
      };
  }
}

export const ProofModePanel: React.FC<ProofModePanelProps> = ({
  entries,
  showEmptyCleanState = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    if (!showEmptyCleanState) {
      return null;
    }

    return (
      <section
        className="proof-mode-section"
        data-testid="proof-mode-panel"
        aria-labelledby="proof-mode-heading"
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
            id="proof-mode-heading"
            data-testid="proof-mode-title"
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#0F172A',
              fontFamily: 'monospace',
            }}
          >
            Proof Mode Trace (0)
          </h3>
          <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', fontWeight: 700 }}>
            NO FINDINGS LOGGED
          </span>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            No proof entries were recorded
          </span>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            This trace lists only findings that produced observable evidence. An empty trace is not
            proof of safety — check the rule results and evidence confidence for what was actually
            evaluated.
          </p>
        </div>
      </section>
    );
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
        borderRadius: '18px',
        border: '1px solid #ECEFF5',
        padding: '16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3
          id="proof-mode-heading"
          data-testid="proof-mode-title"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#111827',
          }}
        >
          Proof Mode Trace ({entries.length})
        </h3>
        <span style={{ fontSize: '11px', color: '#667085', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>AUDIT EVIDENCE</span>
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
          const attribution = resolveAttribution(entry);

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
                    title={attribution.tooltip}
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: attribution.background,
                      color: attribution.color,
                      border: `1px solid ${attribution.border}`,
                      fontWeight: 600,
                    }}
                  >
                    {attribution.label}
                  </span>
                  <ConfidenceBadge confidence={entry.confidence} />
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Expandable Deep Proof Details - 3 Epistemological Layers */}
              {isExpanded && (
                <div
                  id={detailId}
                  data-testid={`proof-detail-${entry.finding_id}`}
                  className="proof-detail-layers"
                  style={{
                    padding: '12px',
                    borderTop: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Layer 1: Raw Observed Signal (Fact) */}
                  <div
                    className="proof-layer proof-layer-observation"
                    data-testid="proof-layer-observation"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#0052FF', fontSize: '9px' }}>●</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                          1. Raw Observed Signal
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                          {entry.location}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
                              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                if (tabs[0]?.id) {
                                  chrome.tabs.sendMessage(tabs[0].id, {
                                    type: 'CREDIBLE_LOCATE_ELEMENT',
                                    quote: entry.observed,
                                  });
                                }
                              });
                            }
                          }}
                          data-testid={`proof-locate-${entry.finding_id}`}
                          title="Locate and highlight element on active webpage"
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            padding: '1px 5px',
                            backgroundColor: '#FFFFFF',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          LOCATE ↗
                        </button>
                      </div>
                    </div>
                    <blockquote
                      data-testid="proof-observed"
                      style={{
                        margin: 0,
                        color: '#0F172A',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        wordBreak: 'break-word',
                        lineHeight: '1.4',
                        backgroundColor: '#FFFFFF',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {entry.observed}
                    </blockquote>
                  </div>

                  {/* Layer 2: Threat Interpretation (Inference) */}
                  <div
                    className="proof-layer proof-layer-interpretation"
                    data-testid="proof-layer-interpretation"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#E11D48', fontSize: '9px' }}>●</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                          2. Threat Interpretation
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, fontFamily: 'monospace' }}>
                        {attribution.engineLabel}
                      </span>
                    </div>
                    <p data-testid="proof-why" style={{ margin: 0, color: '#0F172A', fontSize: '12px', lineHeight: '1.45' }}>
                      {entry.why_it_matters}
                    </p>
                    {entry.check_id && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                        <span>Rule ID: </span>
                        <code style={{ color: '#0F172A', fontWeight: 600 }}>{entry.check_id}</code>
                      </div>
                    )}
                  </div>

                  {/* Layer 3: External Corroboration (Ground Truth Status) */}
                  <div
                    className="proof-layer proof-layer-corroboration"
                    data-testid="proof-layer-corroboration"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#D97706', fontSize: '9px' }}>●</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                          3. External Corroboration
                        </span>
                      </div>
                      <span
                        data-testid="corroboration-status-tag"
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          border: '1px solid #CBD5E1',
                        }}
                      >
                        Privacy-Preserving (Unchecked)
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '11px', lineHeight: '1.4' }}>
                      {entry.location.includes('hostname') || entry.location.includes('url')
                        ? 'External WHOIS registrar records, domain age, and corporate business registries were not queried to preserve browsing privacy.'
                        : 'Local client DOM observation only. Off-platform communications or external registry databases not corroborated.'}
                    </p>
                  </div>

                  {/* Caveats & Limitations */}
                  {entry.limitations && entry.limitations.length > 0 && (
                    <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                      <strong>Limitations: </strong>
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

