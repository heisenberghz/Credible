import { describe, it, expect } from 'vitest';
import { describeEngineStatus } from '../src/services/engine-status';
import { AIStatusResponse } from '../src/types/status';

const baseStatus: AIStatusResponse = {
  ai_enabled: true,
  mode: 'ai_assisted',
  provider_order: ['gemini'],
  active_provider: 'gemini',
  providers: [
    { name: 'gemini', configured: true, model: 'gemini-3.5-flash-lite', role: 'primary' },
  ],
  timeout_seconds: 10,
  total_timeout_seconds: 12,
  checked_at: '2026-11-02T00:00:00Z',
};

describe('Engine status badge', () => {
  it('shows a checking state before the backend answers', () => {
    const engine = describeEngineStatus(null, null);
    expect(engine.state).toBe('checking');
    expect(engine.label).toBe('CHECKING ENGINE');
  });

  it('shows offline when the backend is unreachable', () => {
    const engine = describeEngineStatus(null, false);
    expect(engine.state).toBe('offline');
    expect(engine.label).toBe('ENGINE OFFLINE');
  });

  it('shows the active AI provider when AI is configured', () => {
    const engine = describeEngineStatus(baseStatus, true);
    expect(engine.state).toBe('online');
    expect(engine.label).toBe('AI READY · GEMINI');
    expect(engine.shortLabel).toBe('AI');
    expect(engine.detail).toContain('gemini-3.5-flash-lite');
  });

  it('reports a degraded engine without claiming AI ran', () => {
    const status: AIStatusResponse = {
      ...baseStatus,
      degraded: true,
      last_error: 'gemini: 503 UNAVAILABLE',
    };

    const engine = describeEngineStatus(status, true);

    expect(engine.state).toBe('degraded');
    expect(engine.label).toBe('AI DEGRADED · GEMINI');
    expect(engine.shortLabel).toBe('DEGRADED');
    expect(engine.detail).toContain('503 UNAVAILABLE');
  });

  it('never claims AI is active in deterministic mode', () => {
    const status: AIStatusResponse = {
      ...baseStatus,
      ai_enabled: false,
      mode: 'deterministic_only',
      active_provider: null,
      providers: baseStatus.providers.map((provider) => ({ ...provider, configured: false })),
    };

    const engine = describeEngineStatus(status, true);

    expect(engine.state).toBe('deterministic');
    expect(engine.label).toBe('DETERMINISTIC MODE');
    expect(engine.shortLabel).toBe('RULES');
    expect(engine.detail).toContain('no AI key configured');
  });
});
