import React, { useEffect, useState } from 'react';

export interface ScoreGaugeProps {
  score: number;
  size?: number;
  variant?: 'full' | 'dial-only';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 96, variant = 'full' }) => {
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
  let strokeColor = '#059669'; // Solid Signal Emerald
  let labelText = 'Clean Signals';
  let badgeClass = 'score-safe';

  if (normalizedScore < 50) {
    strokeColor = '#E11D48'; // Solid Signal Crimson
    labelText = 'High Threat';
    badgeClass = 'score-danger';
  } else if (normalizedScore < 85) {
    strokeColor = '#D97706'; // Solid Signal Amber
    labelText = 'Caution Warranted';
    badgeClass = 'score-caution';
  }

  // Circular gauge geometry
  const center = size / 2;
  const strokeWidth = Math.max(5, Math.round(size * 0.075));
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const dialGraphic = (
    <div
      className="gauge-graphic-wrapper"
      data-testid={variant === 'dial-only' ? 'score-gauge' : undefined}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        className="score-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* Background Track Ring */}
        <circle
          className="gauge-track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <circle
          className="gauge-progress"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      {/* Center Score Counter - Guaranteed Absolute Center */}
      <div
        className="gauge-center-content"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          className="gauge-number"
          data-testid="score-value"
          style={{
            fontSize: `${Math.round(size * 0.26)}px`,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
          }}
        >
          {animatedScore}
        </span>
        <span
          className="gauge-scale"
          style={{
            fontSize: `${Math.max(9, Math.round(size * 0.1))}px`,
            fontWeight: 600,
            color: '#94A3B8',
            marginTop: '1px',
          }}
        >
          /100
        </span>
      </div>
    </div>
  );

  if (variant === 'dial-only') {
    return dialGraphic;
  }

  return (
    <div
      className="score-gauge-container"
      data-testid="score-gauge"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 14px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        marginBottom: '14px',
      }}
    >
      {dialGraphic}

      <div className="gauge-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div
          className="gauge-header-row"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
        >
          <span
            className="gauge-title"
            style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Safety Index
          </span>
          <span
            className={`gauge-badge ${badgeClass}`}
            style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {labelText}
          </span>
        </div>
        <p className="gauge-caption" style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
          Transparent multi-factor heuristic assessment of observable indicators.
        </p>
      </div>
    </div>
  );
};
