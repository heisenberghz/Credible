import React, { useState } from 'react';
import { AnalysisReport, AssessmentStatus } from '../../types/analysis';

interface ScanLedgerProps {
  history: AnalysisReport[];
  selectedId: string;
  onSelect: (report: AnalysisReport) => void;
  onClear: () => void;
}

const smallButtonStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
};

export const ScanLedger: React.FC<ScanLedgerProps> = ({
  history,
  selectedId,
  onSelect,
  onClear,
}) => {
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="arch-card" data-testid="scan-ledger">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0F172A', fontFamily: 'monospace' }}>
            INVESTIGATION SCAN LEDGER ({history.length})
          </h3>
          <p style={{ fontSize: '11px', color: '#64748B' }}>Audit history & benchmark comparison</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {history.length > 0 && !confirmingClear && (
            <button
              onClick={() => setConfirmingClear(true)}
              data-testid="ledger-clear-btn"
              style={{
                ...smallButtonStyle,
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                border: '1px solid #CBD5E1',
              }}
              title="Clear stored scan history"
            >
              CLEAR
            </button>
          )}

          {history.length > 0 && confirmingClear && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              role="group"
              aria-label="Confirm clearing scan history"
              data-testid="ledger-clear-confirm"
            >
              <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 800, color: '#9F1239' }}>
                CLEAR ALL?
              </span>
              <button
                onClick={() => {
                  onClear();
                  setConfirmingClear(false);
                }}
                data-testid="ledger-clear-confirm-btn"
                style={{
                  ...smallButtonStyle,
                  backgroundColor: '#FFF1F2',
                  color: '#9F1239',
                  border: '1px solid #FECDD3',
                }}
              >
                YES, CLEAR
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                data-testid="ledger-clear-cancel-btn"
                style={{
                  ...smallButtonStyle,
                  backgroundColor: '#F8FAFC',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                }}
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Scenario Benchmark Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', fontWeight: 700 }}>
          BENCHMARKS:
        </span>
        {history.slice(0, 3).map((item, idx) => {
          const isSelected = item.request_id === selectedId;
          const label = idx === 0 ? '1. Benign' : idx === 1 ? '2. Suspicious' : '3. Ambiguous';
          return (
            <button
              key={item.request_id}
              onClick={() => onSelect(item)}
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '2px 8px',
                backgroundColor: isSelected ? '#0F172A' : '#F1F5F9',
                color: isSelected ? '#FFFFFF' : '#475569',
                border: '1px solid',
                borderColor: isSelected ? '#0F172A' : '#CBD5E1',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label} ({typeof item.score === 'number' ? item.score : '—'})
            </button>
          );
        })}
      </div>

      {history.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
          No historical scans recorded yet. Run a scan to log investigations.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
          {history.map((item) => {
            const isSelected = item.request_id === selectedId;
            const hasScore = typeof item.score === 'number';
            const score = hasScore ? (item.score as number) : null;
            const isThreat =
              item.assessment_status === AssessmentStatus.SUSPICIOUS ||
              (score !== null && score < 50);
            const isCaution =
              item.assessment_status === AssessmentStatus.CAUTION ||
              item.assessment_status === AssessmentStatus.NEEDS_VERIFICATION ||
              (score !== null && score >= 50 && score < 85);
            const isUnknown =
              item.assessment_status === AssessmentStatus.INCONCLUSIVE ||
              item.assessment_status === AssessmentStatus.ERROR ||
              score === null;

            let badgeBg = '#ECFDF5';
            let badgeText = '#065F46';
            let badgeBorder = '#A7F3D0';
            let statusLabel = 'CLEAN';

            if (isUnknown) {
              badgeBg = '#F1F5F9';
              badgeText = '#475569';
              badgeBorder = '#CBD5E1';
              statusLabel = 'UNKNOWN';
            } else if (isThreat) {
              badgeBg = '#FFF1F2';
              badgeText = '#9F1239';
              badgeBorder = '#FECDD3';
              statusLabel = 'THREAT';
            } else if (isCaution) {
              badgeBg = '#FFFBEB';
              badgeText = '#92400E';
              badgeBorder = '#FDE68A';
              statusLabel =
                item.assessment_status === AssessmentStatus.NEEDS_VERIFICATION ? 'REVIEW' : 'CAUTION';
            }

            return (
              <div
                key={item.request_id}
                onClick={() => onSelect(item)}
                data-testid={`ledger-item-${item.request_id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#F1F5F9' : '#FFFFFF',
                  border: '1px solid',
                  borderColor: isSelected ? '#0F172A' : '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0F172A',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.analyzed_url}
                  >
                    {item.analyzed_url.replace(/^https?:\/\//, '')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'} · {item.findings.length} findings
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: badgeBg,
                      color: badgeText,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  >
                    {statusLabel}
                  </span>
                  <span
                    className="tabular-num"
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'monospace',
                      width: '32px',
                      textAlign: 'right',
                    }}
                  >
                    {score === null ? '—' : score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
