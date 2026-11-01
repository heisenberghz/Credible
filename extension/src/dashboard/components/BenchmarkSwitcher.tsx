import React from 'react';

interface BenchmarkSwitcherProps {
  selectedId: string;
  onSelect: (scenarioId: string) => void;
}

interface BenchmarkItem {
  id: string;
  badge: string;
  label: string;
  subtitle: string;
  score: number;
  tagColor: { bg: string; text: string; border: string };
}

const BENCHMARKS: BenchmarkItem[] = [
  {
    id: 'demo-scen-1-benign',
    badge: '1. BENIGN',
    label: 'Corporate Career Portal',
    subtitle: 'Standard patterns • 0 findings',
    score: 97,
    tagColor: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  },
  {
    id: 'demo-scen-2-suspicious',
    badge: '2. SUSPICIOUS',
    label: 'Urgent Crypto Deposit Scam',
    subtitle: 'Fee demands • 24h timer • 2 threats',
    score: 28,
    tagColor: { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  },
  {
    id: 'demo-scen-3-ambiguous',
    badge: '3. AMBIGUOUS',
    label: 'Nova Labs Community Research',
    subtitle: 'Informal entity • Caution warranted',
    score: 62,
    tagColor: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  },
];

export const BenchmarkSwitcher: React.FC<BenchmarkSwitcherProps> = ({ selectedId, onSelect }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          BENCHMARK SUITE:
        </span>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          Evaluate deterministic heuristics across benchmark scenarios:
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {BENCHMARKS.map((b) => {
          const isSelected = selectedId === b.id;

          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              type="button"
              data-testid={`benchmark-btn-${b.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isSelected ? '#0F172A' : '#F8FAFC',
                color: isSelected ? '#FFFFFF' : '#334155',
                border: isSelected ? '1px solid #0F172A' : '1px solid #CBD5E1',
                boxShadow: isSelected ? '0 2px 4px rgba(15, 23, 42, 0.15)' : 'none',
              }}
            >
              <span>{b.badge}</span>
              <span style={{ opacity: isSelected ? 0.9 : 0.7 }}>•</span>
              <span>{b.label}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : b.tagColor.bg,
                  color: isSelected ? '#FFFFFF' : b.tagColor.text,
                  border: isSelected ? 'none' : `1px solid ${b.tagColor.border}`,
                }}
              >
                {b.score}/100
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

