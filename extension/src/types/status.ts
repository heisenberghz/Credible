/**
 * Public backend/AI status types. These mirror GET /api/v1/ai/status and
 * intentionally never include credentials.
 */

export type AICapabilityMode = 'ai_assisted' | 'deterministic_only';

export interface AIProviderStatus {
  name: string;
  configured: boolean;
  model: string | null;
  role: string;
}

export interface AIStatusResponse {
  ai_enabled: boolean;
  mode: AICapabilityMode;
  provider_order: string[];
  active_provider: string | null;
  providers: AIProviderStatus[];
  timeout_seconds: number;
  total_timeout_seconds: number;
  degraded?: boolean;
  last_error?: string | null;
  last_error_at?: string | null;
  checked_at: string;
}

export type EngineState = 'checking' | 'online' | 'degraded' | 'deterministic' | 'offline';

export interface EngineStatus {
  state: EngineState;
  label: string;
  shortLabel: string;
  detail: string;
  provider: string | null;
}
