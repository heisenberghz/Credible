import { useEffect, useState } from 'react';

/**
 * Counts whole seconds since `active` last became true.
 *
 * Resets to 0 when the scan stops, so a new scan always starts from zero.
 * The backend has no progress channel, so this is deliberately a timer rather
 * than a fake percentage.
 */
export function useElapsedSeconds(active: boolean): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [active]);

  return elapsedSeconds;
}
