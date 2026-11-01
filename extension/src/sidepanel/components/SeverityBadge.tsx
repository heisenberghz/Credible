import React from 'react';
import { Severity } from '../../types/analysis';

interface SeverityBadgeProps {
  severity: Severity | string;
}

const SEVERITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  [Severity.CRITICAL]: {
    label: 'Critical',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#F87171',
  },
  [Severity.HIGH]: {
    label: 'High Risk',
    bg: '#FFF7ED',
    text: '#9A3412',
    border: '#FB923C',
  },
  [Severity.MEDIUM]: {
    label: 'Medium Risk',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FBBF24',
  },
  [Severity.LOW]: {
    label: 'Low Concern',
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#60A5FA',
  },
  [Severity.INFORMATIONAL]: {
    label: 'Info',
    bg: '#F8FAFC',
    text: '#475569',
    border: '#CBD5E1',
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const normKey = (severity || '').toLowerCase();
  const config = SEVERITY_CONFIG[normKey] || {
    label: severity.toUpperCase(),
    bg: '#F8FAFC',
    text: '#475569',
    border: '#CBD5E1',
  };

  return (
    <span
      className="severity-badge"
      data-testid="severity-badge"
      data-severity={normKey}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.text,
        }}
      />
      {config.label}
    </span>
  );
};

