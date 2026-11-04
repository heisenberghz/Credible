import React from 'react';
import './ScanProgress.css';

export interface ScanProgressProps {
  active: boolean;
  elapsedSeconds: number;
  stage: string;
  hint?: string;
  variant?: 'inline' | 'full';
  testId?: string;
}

export function formatElapsed(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  if (safeSeconds < 60) {
    return `${safeSeconds}s`;
  }
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  active,
  elapsedSeconds,
  stage,
  hint,
  variant = 'inline',
  testId = 'scan-progress',
}) => {
  if (!active) {
    return null;
  }

  return (
    <div
      className={`scan-progress scan-progress--${variant}`}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="scan-progress__row">
        <span className="scan-progress__stage">{stage}</span>
        <span className="scan-progress__timer" data-testid="scan-elapsed" aria-hidden="true">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
      <div className="scan-progress__track" aria-hidden="true">
        <div className="scan-progress__bar" />
      </div>
      {hint && <p className="scan-progress__hint">{hint}</p>}
    </div>
  );
};
