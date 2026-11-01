import React from 'react';

interface NextBestActionListProps {
  actions: string[];
}

export const NextBestActionList: React.FC<NextBestActionListProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <section
      className="next-actions-section"
      data-testid="next-actions-panel"
      aria-labelledby="next-actions-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span aria-hidden="true" style={{ fontSize: '14px' }}>🛡️</span>
        <h3
          id="next-actions-heading"
          data-testid="next-actions-title"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#475569',
          }}
        >
          Recommended Next Actions
        </h3>
      </div>

      <ol
        className="next-actions-list"
        role="list"
        aria-label="Recommended Next Actions"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingLeft: '0',
          listStyle: 'none',
          margin: 0,
        }}
      >
        {actions.map((action, idx) => (
          <li
            key={idx}
            role="listitem"
            data-testid={`action-item-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '1px',
              }}
              aria-hidden="true"
            >
              {idx + 1}
            </span>
            <span
              data-testid="action-text"
              style={{
                fontSize: '13px',
                color: '#1E293B',
                lineHeight: '1.45',
                fontWeight: 500,
              }}
            >
              {action}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

