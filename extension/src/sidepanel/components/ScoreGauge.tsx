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
  let glowColor = 'rgba(5, 150, 105, 0.35)';

  if (normalizedScore < 50) {
    strokeColor = '#E11D48'; // Solid Signal Crimson
    labelText = 'High Threat';
    badgeClass = 'score-danger';
    glowColor = 'rgba(225, 29, 72, 0.35)';
  } else if (normalizedScore < 85) {
    strokeColor = '#D97706'; // Solid Signal Amber
    labelText = 'Caution Warranted';
    badgeClass = 'score-caution';
    glowColor = 'rgba(217, 119, 6, 0.35)';
  } else {
    // Top tier safety - Electric lime accent
    strokeColor = '#10B981';
    labelText = 'Clean Signals';
    badgeClass = 'score-safe';
    glowColor = 'rgba(16, 185, 129, 0.35)';
  }

  // Circular gauge geometry
  const center = size / 2;
  const strokeWidth = Math.max(5, Math.round(size * 0.08));
  const radius = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const scoreFontSize = Math.round(size * 0.28);
  const scaleFontSize = Math.max(9, Math.round(size * 0.11));

  // Chronograph ticks every 30 degrees
  const tickAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  const dialGraphic = (
    <div
      className="gauge-graphic-wrapper"
      data-testid={variant === 'dial-only' ? 'score-gauge' : undefined}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        className="score-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Security score: ${animatedScore} out of 100`}
        style={{ display: 'block' }}
      >
        {/* Aerospace Chronograph Ticks */}
        {tickAngles.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const innerR = radius - strokeWidth * 0.85;
          const outerR = radius - strokeWidth * 0.55;
          const x1 = center + innerR * Math.cos(rad);
          const y1 = center + innerR * Math.sin(rad);
          const x2 = center + outerR * Math.cos(rad);
          const y2 = center + outerR * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#CBD5E1"
              strokeWidth={deg % 90 === 0 ? 1.4 : 0.8}
            />
          );
        })}

        {/* Background Track Ring */}
        <circle
          className="gauge-track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeOpacity={1}
        />

        {/* Animated Progress Ring with Illuminated Glow */}
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
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />

        {/* NATIVE SVG CENTERED SCORE TEXT (JetBrains Mono / Tabular Figures) */}
        <text
          x={center}
          y={center - strokeWidth * 0.25}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0F172A"
          fontSize={scoreFontSize}
          fontWeight="800"
          letterSpacing="-0.04em"
          fontFamily="'JetBrains Mono', 'Cascadia Code', 'SF Mono', monospace"
          data-testid="score-value"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {animatedScore < 10 ? `0${animatedScore}` : animatedScore}
        </text>
        <text
          x={center}
          y={center + scoreFontSize * 0.65}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#64748B"
          fontSize={scaleFontSize}
          fontWeight="800"
          fontFamily="'JetBrains Mono', 'Cascadia Code', monospace"
        >
          /100
        </text>
      </svg>
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
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECEFF5',
        borderRadius: '18px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.02)',
        marginBottom: '14px',
      }}
    >
      {dialGraphic}

      <div className="gauge-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
        <div
          className="gauge-header-row"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
        >
          <span
            className="gauge-title"
            style={{ fontSize: '12px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Safety Index
          </span>
          <span
            className={`gauge-badge ${badgeClass}`}
            style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: '2.5px 8px',
              borderRadius: '9999px',
            }}
          >
            {labelText}
          </span>
        </div>
        <p className="gauge-caption" style={{ fontSize: '11px', color: '#8E95A5', lineHeight: 1.45, margin: 0 }}>
          Deterministic multi-vector risk evaluation of observable indicators.
        </p>
      </div>
    </div>
  );
};
