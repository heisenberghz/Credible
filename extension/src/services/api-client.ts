/**
 * Credible Extension - Typed API Client
 * Communicates with the FastAPI backend (/api/v1/analyze) with strict schema
 * validation, 15-second timeout, cancellation, and user-friendly error mapping.
 */

import { CONFIG } from '../config';
import {
  AnalysisMode,
  AnalysisReport,
  AnalysisRequest,
  AssessmentStatus,
  ErrorResponse,
  PageData,
  SelectionData,
} from '../types/analysis';

export class AnalysisClientError extends Error {
  public code: string;
  public statusCode?: number;
  public detail?: ErrorResponse | null;

  constructor(message: string, code: string, statusCode?: number, detail?: ErrorResponse | null) {
    super(message);
    this.name = 'AnalysisClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/**
 * Generate a cryptographically random UUID or fallback.
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'req-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
}

/**
 * Build valid AnalysisRequest for full page mode.
 */
export function buildPageRequest(page: PageData): AnalysisRequest {
  return {
    request_id: generateRequestId(),
    mode: AnalysisMode.PAGE,
    page: {
      url: page.url,
      title: page.title || null,
      visible_text: page.visible_text,
      links: page.links || [],
    },
    selection: null,
    client_context: {
      extension_version: CONFIG.EXTENSION_VERSION,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
  };
}

/**
 * Build valid AnalysisRequest for text selection mode.
 */
export function buildSelectionRequest(selection: SelectionData): AnalysisRequest {
  return {
    request_id: generateRequestId(),
    mode: AnalysisMode.SELECTION,
    page: null,
    selection: {
      url: selection.url,
      text: selection.text,
      link: selection.link || null,
    },
    client_context: {
      extension_version: CONFIG.EXTENSION_VERSION,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
  };
}

/**
 * Validate that raw JSON conforms to the AnalysisReport schema at runtime.
 */
export function validateAnalysisReport(data: unknown): AnalysisReport {
  if (!data || typeof data !== 'object') {
    throw new AnalysisClientError(
      'Malformed response from backend: expected an object.',
      'INVALID_RESPONSE'
    );
  }

  const obj = data as Record<string, any>;

  const requiredFields = [
    'request_id',
    'status',
    'assessment_status',
    'summary',
    'analyzed_url',
    'mode',
    'timestamp',
    'findings',
    'trust_dna',
    'proof_mode',
    'next_best_actions',
    'checks',
    'limitations',
  ];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new AnalysisClientError(
        `Invalid response schema: missing required field '${field}'.`,
        'INVALID_RESPONSE'
      );
    }
  }

  // Verify assessment_status is a valid known status
  const validStatuses = Object.values(AssessmentStatus);
  if (!validStatuses.includes(obj.assessment_status)) {
    throw new AnalysisClientError(
      `Invalid assessment status received: '${obj.assessment_status}'.`,
      'INVALID_RESPONSE'
    );
  }

  if (!Array.isArray(obj.findings)) {
    throw new AnalysisClientError(
      "Invalid response schema: 'findings' must be an array.",
      'INVALID_RESPONSE'
    );
  }

  if (!Array.isArray(obj.trust_dna)) {
    throw new AnalysisClientError(
      "Invalid response schema: 'trust_dna' must be an array.",
      'INVALID_RESPONSE'
    );
  }

  if (!Array.isArray(obj.proof_mode)) {
    throw new AnalysisClientError(
      "Invalid response schema: 'proof_mode' must be an array.",
      'INVALID_RESPONSE'
    );
  }

  if (!Array.isArray(obj.next_best_actions)) {
    throw new AnalysisClientError(
      "Invalid response schema: 'next_best_actions' must be an array.",
      'INVALID_RESPONSE'
    );
  }

  return obj as AnalysisReport;
}

/**
 * Map error objects or codes to concise, calm, user-friendly messages.
 */
export function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof AnalysisClientError) {
    if (error.code === 'TIMEOUT') {
      return 'Analysis timed out after 15 seconds. Please try again.';
    }
    if (error.code === 'BACKEND_OFFLINE') {
      return 'Credible backend service is unreachable. Please ensure the server is running on http://localhost:8000.';
    }
    if (error.code === 'INVALID_RESPONSE') {
      return 'Received an unexpected response structure from the analysis engine.';
    }
    if (error.statusCode === 400) {
      return error.detail?.error?.message || 'Invalid request format or unsupported URL scheme.';
    }
    if (error.statusCode === 422) {
      return error.detail?.error?.message || 'Input validation failed. Content could not be analyzed.';
    }
    if (error.statusCode === 413) {
      return 'Content payload exceeds maximum acceptable length.';
    }
    if (error.detail?.error?.message) {
      return error.detail.error.message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Analysis request was cancelled.';
    }
    return error.message;
  }

  return 'An unexpected error occurred during security analysis.';
}

export interface RequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * API client instance for making typed requests to backend.
 */
export class CredibleApiClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(baseUrl: string = CONFIG.BACKEND_BASE_URL, timeoutMs: number = CONFIG.API_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultTimeoutMs = timeoutMs;
  }

  /**
   * Submit an analysis request to POST /api/v1/analyze.
   */
  async analyze(
    request: AnalysisRequest,
    options?: RequestOptions
  ): Promise<AnalysisReport> {
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    let timedOut = false;

    // Timeout trigger
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    // Combine with external signal if provided
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const endpoint = `${options?.baseUrl || this.baseUrl}/api/v1/analyze`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      if (timedOut) {
        throw new AnalysisClientError(
          `Analysis request timed out after ${timeoutMs / 1000} seconds.`,
          'TIMEOUT',
          504
        );
      }
      if (fetchErr.name === 'AbortError') {
        throw new AnalysisClientError('Request aborted by user.', 'ABORTED');
      }
      throw new AnalysisClientError(
        'Failed to connect to Credible backend service.',
        'BACKEND_OFFLINE'
      );
    } finally {
      clearTimeout(timer);
    }

    // Handle non-OK HTTP statuses
    if (!response.ok) {
      let errorDetail: ErrorResponse | null = null;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorDetail = errorJson as ErrorResponse;
        }
      } catch {
        // Not a JSON error payload
      }

      const msg = errorDetail?.error?.message || `Backend returned HTTP status ${response.status}`;
      const code = errorDetail?.error?.code || `HTTP_${response.status}`;
      throw new AnalysisClientError(msg, code, response.status, errorDetail);
    }

    // Parse and strictly validate response payload
    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      throw new AnalysisClientError('Backend returned non-JSON response.', 'INVALID_RESPONSE');
    }

    return validateAnalysisReport(rawJson);
  }

  /**
   * Analyze page content.
   */
  async analyzePage(page: PageData, options?: RequestOptions): Promise<AnalysisReport> {
    const request = buildPageRequest(page);
    return this.analyze(request, options);
  }

  /**
   * Analyze selection text.
   */
  async analyzeSelection(
    selection: SelectionData,
    options?: RequestOptions
  ): Promise<AnalysisReport> {
    const request = buildSelectionRequest(selection);
    return this.analyze(request, options);
  }
}

// Default singleton client
export const apiClient = new CredibleApiClient();

