import React from 'react';
import { Finding, Severity } from '../../types/analysis';
import { FindingDetail } from './FindingDetail';

interface FindingListProps {
  findings: Finding[];
}

const SEVERITY_ORDER: Record<string, number> = {
  [Severity.CRITICAL]: 1,
  [Severity.HIGH]: 2,
  [Severity.MEDIUM]: 3,
  [Severity.LOW]: 4,
  [Severity.INFORMATIONAL]: 5,
};

export const FindingList: React.FC<FindingListProps> = ({ findings }) => {
  // Sort findings by severity priority
  const sortedFindings = [...findings].sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity.toLowerCase()] ?? 99;
    const orderB = SEVERITY_ORDER[b.severity.toLowerCase()] ?? 99;
    return orderA - orderB;
  });

  if (findings.length === 0) {
    return (
      <div
        className="findings-empty-card"
        data-testid="findings-empty-state"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px 16px',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            fontSize: '18px',
          }}
        >
          ✓
        </div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
          No Active Threat Findings
        </h4>
        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4', maxWidth: '260px', margin: '0 auto' }}>
          All executed deterministic rules and content checks evaluated normal signals without deception indicators.
        </p>
      </div>
    );
  }

  // Count high/critical threats
  const highCriticalCount = sortedFindings.filter(
    (f) =>
      f.severity.toLowerCase() === Severity.CRITICAL ||
      f.severity.toLowerCase() === Severity.HIGH
  ).length;

  return (
    <div className="findings-section" data-testid="findings-section" style={{ marginBottom: '16px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <h3
          data-testid="findings-header"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#475569',
          }}
        >
          Key Findings ({sortedFindings.length})
        </h3>

        {highCriticalCount > 0 && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#DC2626',
              backgroundColor: '#FEF2F2',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {highCriticalCount} High Priority
          </span>
        )}
      </div>

      {/* List of findings */}
      <div className="findings-list" data-testid="findings-list">
        {sortedFindings.map((finding) => (
          <FindingDetail key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
};

