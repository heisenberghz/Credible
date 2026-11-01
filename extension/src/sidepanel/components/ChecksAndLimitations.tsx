import React, { useState } from 'react';
import { ExecutedChecksSummary } from '../../types/analysis';

interface ChecksAndLimitationsProps {
  checks: ExecutedChecksSummary;
  limitations: string[];
}

export const ChecksAndLimitations: React.FC<ChecksAndLimitationsProps> = ({
  checks,
  limitations,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const totalExecuted = checks.executed ? checks.executed.length : 0;
  const totalNotExecuted = checks.not_executed ? checks.not_executed.length : 0;

  return (
    <section
      className="checks-limitations-section"
      data-testid="checks-limitations-panel"
      aria-labelledby="checks-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3
          id="checks-heading"
          data-testid="checks-title"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#475569',
          }}
        >
          Check Scope & Limitations
        </h3>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          data-testid="checks-toggle-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#2563EB',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          {isExpanded ? 'Hide Scope' : 'View Scope'}
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
        <span data-testid="checks-executed-count">
          <strong>{totalExecuted}</strong> checks executed
        </span>
        {totalNotExecuted > 0 && (
          <span style={{ marginLeft: '8px' }}>
            • <strong>{totalNotExecuted}</strong> not evaluated
          </span>
        )}
      </div>

      {isExpanded && (
        <div data-testid="checks-expanded-details" style={{ marginTop: '12px', fontSize: '11px' }}>
          {/* Executed Checks */}
          {checks.executed && checks.executed.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Completed Checks:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {checks.executed.map((checkId) => (
                  <span
                    key={checkId}
                    data-testid="executed-check-pill"
                    style={{
                      backgroundColor: '#F1F5F9',
                      color: '#0F172A',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    ✓ {checkId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Not Executed Checks */}
          {checks.not_executed && checks.not_executed.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Not Executed (Context Dependent):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {checks.not_executed.map((checkId) => (
                  <span
                    key={checkId}
                    style={{
                      backgroundColor: '#F8FAFC',
                      color: '#94A3B8',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      border: '1px dashed #CBD5E1',
                    }}
                  >
                    ○ {checkId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {limitations && limitations.length > 0 && (
            <div
              data-testid="limitations-container"
              style={{
                backgroundColor: '#FFFBEB',
                borderLeft: '3px solid #F59E0B',
                padding: '8px 10px',
                borderRadius: '0 6px 6px 0',
                marginTop: '10px',
              }}
            >
              <strong style={{ color: '#92400E', display: 'block', marginBottom: '2px' }}>
                System Analysis Boundaries:
              </strong>
              <ul style={{ paddingLeft: '16px', margin: 0, color: '#78350F' }}>
                {limitations.map((lim, idx) => (
                  <li key={idx} data-testid="limitation-item">
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

