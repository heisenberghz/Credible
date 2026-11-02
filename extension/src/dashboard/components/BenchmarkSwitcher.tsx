import React from 'react';

interface BenchmarkSwitcherProps {
  selectedId: string;
  onSelect: (scenarioId: string) => void;
}

interface BenchmarkItem {
  id: string;
  badge: string;
  label: string;
  scoreText: string;
  pipClass: string;
  tagColor: { bg: string; text: string; border: string };
}

const BENCHMARKS: BenchmarkItem[] = [
  {
    id: 'demo-scen-1-benign',
    badge: '01 BENIGN',
    label: 'Corporate Career Portal',
    scoreText: '[Score: 97]',
    pipClass: 'pip-clean',
    tagColor: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  },
  {
    id: 'demo-scen-2-suspicious',
    badge: '02 SUSPICIOUS',
    label: 'Urgent Crypto Deposit',
    scoreText: '[Score: 01]',
    pipClass: 'pip-threat',
    tagColor: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
  },
  {
    id: 'demo-scen-3-ambiguous',
    badge: '03 AMBIGUOUS',
    label: 'Unverified Research Post',
    scoreText: '[Score: 62]',
    pipClass: 'pip-caution',
    tagColor: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  },
];

export const BenchmarkSwitcher: React.FC<BenchmarkSwitcherProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="benchmark-deck-container" role="region" aria-label="Calibration Scenarios">
      <div className="benchmark-deck-header">
        <div className="benchmark-deck-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
            <path d="M5.52 16h12.96" />
          </svg>
          <span>CALIBRATION BENCHMARKS</span>
        </div>
        <span className="benchmark-deck-caption">
          Ground-truth verification scenarios
        </span>
      </div>

      <div className="benchmark-pills-row" role="tablist">
        {BENCHMARKS.map((b) => {
          const isSelected = selectedId === b.id;

          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              data-testid={`benchmark-btn-${b.id}`}
              className={`benchmark-pill ${isSelected ? 'active' : ''}`}
            >
              <span className={`benchmark-pip ${b.pipClass}`} />
              <span className="benchmark-badge">{b.badge}</span>
              <span className="benchmark-separator">·</span>
              <span className="benchmark-label">{b.label}</span>
              <span className="benchmark-score-chip">
                {b.scoreText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
