/**
 * Translate backend AI status into a small, honest engine badge.
 *
 * The badge never claims AI is active unless the backend reports a configured
 * provider. A reachable backend with no key is explicitly "deterministic".
 */

import { AIStatusResponse, EngineStatus } from '../types/status';

export function describeEngineStatus(
  status: AIStatusResponse | null,
  reachable: boolean | null
): EngineStatus {
  if (reachable === null) {
    return {
      state: 'checking',
      label: 'CHECKING ENGINE',
      shortLabel: '...',
      detail: 'Contacting the Credible backend',
      provider: null,
    };
  }

  if (!reachable || !status) {
    return {
      state: 'offline',
      label: 'ENGINE OFFLINE',
      shortLabel: 'OFFLINE',
      detail: 'Backend unreachable. Start the FastAPI server on port 8000.',
      provider: null,
    };
  }

  if (status.ai_enabled && status.active_provider) {
    const provider = status.active_provider.toUpperCase();
    const model = status.providers.find((p) => p.name === status.active_provider)?.model;
    if (status.degraded) {
      return {
        state: 'degraded',
        label: `AI DEGRADED · ${provider}`,
        shortLabel: 'DEGRADED',
        detail: status.last_error
          ? `Last AI call failed: ${status.last_error}. Scans fall back to deterministic rules.`
          : 'AI provider configured but the last call failed. Scans fall back to deterministic rules.',
        provider: status.active_provider,
      };
    }
    return {
      state: 'online',
      label: `AI READY · ${provider}`,
      shortLabel: 'AI',
      detail: `AI-assisted analysis via ${provider}${model ? ` (${model})` : ''}`,
      provider: status.active_provider,
    };
  }

  return {
    state: 'deterministic',
    label: 'DETERMINISTIC MODE',
    shortLabel: 'RULES',
    detail: 'Backend online; no AI key configured. Deterministic checks only.',
    provider: null,
  };
}
