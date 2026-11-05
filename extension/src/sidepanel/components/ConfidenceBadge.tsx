import React from 'react';
import { Confidence } from '../../types/analysis';

interface ConfidenceBadgeProps {
  confidence: Confidence | string;
}

const CONFIDENCE_LEVELS: Record<string, { label: string; filledBars: number }> = {
  [Confidence.HIGH]: { label: 'High', filledBars: 3 },
  [Confidence.MEDIUM]: { label: 'Med', filledBars: 2 },
  [Confidence.LOW]: { label: 'Low', filledBars: 1 },
  [Confidence.UNKNOWN]: { label: 'Unk', filledBars: 0 },
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const normKey = (confidence || '').toLowerCase();
  const info = CONFIDENCE_LEVELS[normKey] || { label: String(confidence), filledBars: 1 };

  return (
    <span
      className="confidence-badge"
      data-testid="confidence-badge"
      data-confidence={normKey}
      title={`Evaluation Certainty: ${info.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: '#F1F5F9', // Neutral slate background
        color: '#334155', // Slate-700
        border: '1px solid #CBD5E1', // Crisp thin outline
      }}
    >
      <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Certainty
      </span>

      {/* 3-bar gauge indicator */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'flex-end',
          gap: '2px',
          height: '10px',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            width: '2.5px',
            height: '4px',
            borderRadius: '1px',
            backgroundColor: info.filledBars >= 1 ? '#475569' : '#CBD5E1',
          }}
        />
        <span
          style={{
            width: '2.5px',
            height: '7px',
            borderRadius: '1px',
            backgroundColor: info.filledBars >= 2 ? '#475569' : '#CBD5E1',
          }}
        />
        <span
          style={{
            width: '2.5px',
            height: '10px',
            borderRadius: '1px',
            backgroundColor: info.filledBars >= 3 ? '#475569' : '#CBD5E1',
          }}
        />
      </span>

      <span>{info.label}</span>
    </span>
  );
};

