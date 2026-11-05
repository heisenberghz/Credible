import React from 'react';

interface BenchmarkSwitcherProps {
  selectedId: string;
  onSelect: (scenarioId: string) => void;
}

interface BenchmarkItem {
  id: string;
  verdict: string;
  label: string;
  score: string;
  tone: 'clean' | 'threat' | 'caution';
}

const BENCHMARKS: BenchmarkItem[] = [
  {
    id: 'demo-scen-1-benign',
    verdict: 'Benign',
    label: 'Corporate Career Portal',
    score: '97',
    tone: 'clean',
  },
  {
    id: 'demo-scen-2-suspicious',
    verdict: 'Suspicious',
    label: 'Urgent Crypto Deposit',
    score: '1',
    tone: 'threat',
  },
  {
    id: 'demo-scen-3-ambiguous',
    verdict: 'Ambiguous',
    label: 'Unverified Research Post',
    score: '62',
    tone: 'caution',
  },
];

export const BenchmarkSwitcher: React.FC<BenchmarkSwitcherProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="case-scenarios-track" role="group" aria-label="Reference cases">
      {BENCHMARKS.map((b) => {
        const isSelected = selectedId === b.id;

        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            type="button"
            aria-pressed={isSelected}
            data-testid={`benchmark-btn-${b.id}`}
            className={`case-scenario ${isSelected ? 'is-active' : ''}`}
          >
            <span className={`case-scenario-pip case-scenario-${b.tone}`} aria-hidden="true" />
            <span className="case-scenario-text">
              <span className="case-scenario-verdict">{b.verdict}</span>
              <span className="case-scenario-label">{b.label}</span>
            </span>
            <span className="case-scenario-score">{b.score}</span>
          </button>
        );
      })}
    </div>
  );
};
