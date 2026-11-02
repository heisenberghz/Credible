import React, { useState } from 'react';

interface NextBestActionListProps {
  actions: string[];
}

export const NextBestActionList: React.FC<NextBestActionListProps> = ({ actions }) => {
  const [checkedSet, setCheckedSet] = useState<Set<number>>(new Set());

  if (!actions || actions.length === 0) {
    return null;
  }

  const toggleCheck = (idx: number) => {
    setCheckedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const isAllChecked = actions.length > 0 && checkedSet.size === actions.length;

  return (
    <section
      className="next-actions-section"
      data-testid="next-actions-panel"
      aria-labelledby="next-actions-heading"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '14px 16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3
          id="next-actions-heading"
          data-testid="next-actions-title"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#0F172A',
            fontFamily: 'monospace',
          }}
        >
          Recommended Next Actions
        </h3>
        <span
          data-testid="actions-progress-counter"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'monospace',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isAllChecked ? '#ECFDF5' : '#F1F5F9',
            color: isAllChecked ? '#059669' : '#0052FF',
            border: isAllChecked ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
            transition: 'all 0.2s ease',
          }}
        >
          {checkedSet.size} / {actions.length} VERIFIED
        </span>
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
        {actions.map((action, idx) => {
          const isChecked = checkedSet.has(idx);

          return (
            <li
              key={idx}
              role="listitem"
              data-testid={`action-item-${idx}`}
              onClick={() => toggleCheck(idx)}
              className="action-checklist-item"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isChecked ? '#F8FAFC' : '#FFFFFF',
                border: isChecked ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                cursor: 'pointer',
                opacity: isChecked ? 0.65 : 1,
                transition: 'all 0.15s ease-in-out',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheck(idx)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: '3px',
                  cursor: 'pointer',
                  accentColor: isChecked ? '#059669' : '#0F172A',
                }}
                aria-label={`Mark action ${idx + 1} as verified`}
              />
              <span
                data-testid="action-text"
                style={{
                  fontSize: '13px',
                  color: isChecked ? '#64748B' : '#1E293B',
                  lineHeight: '1.45',
                  fontWeight: 500,
                  textDecoration: isChecked ? 'line-through' : 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                {action}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

