import { useEffect, useState } from 'react';

import { apiClient } from '../services/api-client';
import { describeEngineStatus } from '../services/engine-status';
import { AIStatusResponse, EngineStatus } from '../types/status';

/**
 * Best-effort backend/AI status for header badges. A failure is treated as an
 * offline engine rather than surfacing an error to the user.
 *
 * `refreshKey` re-checks the backend when it changes. Callers pass the report
 * timestamp so a scan that degraded the AI immediately flips the badge instead
 * of leaving a stale "AI READY" until the next mount.
 */
export function useEngineStatus(refreshKey?: string | number | null): EngineStatus {
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getAiStatus({ timeoutMs: 4000 })
      .then((result) => {
        if (!cancelled) {
          setStatus(result);
          setReachable(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReachable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return describeEngineStatus(status, reachable);
}
