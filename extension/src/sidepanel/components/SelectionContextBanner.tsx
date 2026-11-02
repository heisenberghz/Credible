import React from 'react';
import { SelectionData } from '../../types/analysis';

interface SelectionContextBannerProps {
  selection?: SelectionData | null;
}

export const SelectionContextBanner: React.FC<SelectionContextBannerProps> = ({
  selection,
}) => {
  return (
    <div
      className="selection-context-card"
      data-testid="selection-context-banner"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '14px 16px',
        border: '1px solid #ECEFF5',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '6px',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '12px' }}>🎯</span>
        <span
          data-testid="selection-badge-label"
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#2563EB',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Selected Text Verified
        </span>
      </div>

      {selection?.text ? (
        <blockquote
          data-testid="selection-quote-text"
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#111827',
            lineHeight: '1.45',
            backgroundColor: '#F8FAFC',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #ECEFF5',
            wordBreak: 'break-word',
            margin: '6px 0',
          }}
        >
          "{selection.text}"
        </blockquote>
      ) : (
        <p style={{ fontSize: '12px', color: '#1E40AF', fontStyle: 'italic' }}>
          Analysis performed specifically on user-highlighted selection.
        </p>
      )}

      {selection?.link && selection.link.href && (
        <div
          data-testid="selection-link-info"
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflow: 'hidden',
          }}
        >
          <strong style={{ color: '#1E293B' }}>Target Link:</strong>
          <span
            style={{
              fontFamily: 'monospace',
              color: '#2563EB',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            title={selection.link.href}
          >
            {selection.link.text ? `"${selection.link.text}" → ` : ''}
            {selection.link.href}
          </span>
        </div>
      )}
    </div>
  );
};

