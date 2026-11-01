import React, { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState<number>(0);

  // Clamped score between 1 and 100
  const normalizedScore = Math.max(1, Math.min(100, Math.round(score)));

  // Smooth number count-up animation
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 900; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * normalizedScore));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [normalizedScore]);

  // Determine theme color based on score
  let strokeColor = '#10b981'; // Green
  let labelText = 'Clean Signals';
  let badgeClass = 'score-safe';

  if (normalizedScore < 50) {
    strokeColor = '#ef4444'; // Red
    labelText = 'High Threat';
    badgeClass = 'score-danger';
  } else if (normalizedScore < 85) {
    strokeColor = '#f59e0b'; // Amber
    labelText = 'Caution Warranted';
    badgeClass = 'score-caution';
  }

  // Circular gauge geometry
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="score-gauge-container" data-testid="score-gauge">
      <div className="gauge-graphic-wrapper">
        <svg
          className="score-svg"
          width="96"
          height="96"
          viewBox="0 0 96 96"
          aria-hidden="true"
        >
          {/* Background Track Ring */}
          <circle
            className="gauge-track"
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="7"
          />
          {/* Animated Progress Ring */}
          <circle
            className="gauge-progress"
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 48 48)"
          />
        </svg>

        {/* Center Score Counter */}
        <div className="gauge-center-content">
          <span className="gauge-number" data-testid="score-value">
            {animatedScore}
          </span>
          <span className="gauge-scale">/100</span>
        </div>
      </div>

      <div className="gauge-details">
        <div className="gauge-header-row">
          <span className="gauge-title">Safety Index</span>
          <span className={`gauge-badge ${badgeClass}`}>{labelText}</span>
        </div>
        <p className="gauge-caption">
          Transparent multi-factor heuristic assessment of observable indicators.
        </p>
      </div>
    </div>
  );
};

