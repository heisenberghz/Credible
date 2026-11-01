import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  apiClient,
  buildPageRequest,
  buildSelectionRequest,
  validateAnalysisReport,
  mapErrorToUserMessage,
  AnalysisClientError,
  generateRequestId,
} from '../src/services/api-client';
import {
  AnalysisMode,
  AnalysisReport,
  AssessmentStatus,
  Severity,
  Confidence,
  CheckStatus,
  FindingSource,
  TrustDnaStatus,
} from '../src/types/analysis';

describe('Credible API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Request Construction', () => {
    it('constructs a valid PageData analysis request matching schema', () => {
      const pageData = {
        url: 'https://example.com',
        title: 'Example Page',
        visible_text: 'This is visible text on the page.',
        links: [{ text: 'Home', href: 'https://example.com/home' }],
      };

      const request = buildPageRequest(pageData);

      expect(request.request_id).toBeDefined();
      expect(typeof request.request_id).toBe('string');
      expect(request.mode).toBe(AnalysisMode.PAGE);
      expect(request.page).toEqual(pageData);
      expect(request.selection).toBeNull();
      expect(request.client_context?.extension_version).toBe('0.1.0');
    });

    it('constructs a valid SelectionData analysis request matching schema', () => {
      const selectionData = {
        url: 'https://example.com/article',
        text: 'Urgent wire transfer required immediately.',
        link: { text: 'Pay now', href: 'https://pay.example.com' },
      };

      const request = buildSelectionRequest(selectionData);

      expect(request.request_id).toBeDefined();
      expect(request.mode).toBe(AnalysisMode.SELECTION);
      expect(request.page).toBeNull();
      expect(request.selection).toEqual(selectionData);
    });

    it('generates unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Response Runtime Validation', () => {
    const validMockReport: AnalysisReport = {
      request_id: 'req-12345',
      status: 'success',
      assessment_status: AssessmentStatus.SUSPICIOUS,
      summary: 'High pressure financial tactic detected',
      analyzed_url: 'https://example.com',
      mode: AnalysisMode.PAGE,
      timestamp: '2026-11-01T12:00:00Z',
      findings: [
        {
          id: 'f-1',
          title: 'Upfront payment demand',
          description: 'Demands upfront payment before service',
          severity: Severity.HIGH,
          confidence: Confidence.HIGH,
          status: CheckStatus.DETECTED,
          evidence: [{ source: 'content', excerpt: 'Pay $500 now', reason: 'Upfront fee' }],
          source: FindingSource.DETERMINISTIC,
          limitations: [],
        },
      ],
      trust_dna: [
        {
          id: 'credential_payment_pressure',
          name: 'Credential & Payment Pressure',
          status: TrustDnaStatus.CONCERN,
          confidence: Confidence.HIGH,
          summary: 'Detected payment pressure',
          evidence: [],
          limitations: [],
        },
      ],
      proof_mode: [
        {
          finding_id: 'f-1',
          title: 'Upfront payment demand',
          observed: 'Pay $500 now',
          location: 'body text',
          why_it_matters: 'Pressure tactics often lead to financial loss',
          is_deterministic: true,
          confidence: Confidence.HIGH,
          limitations: [],
        },
      ],
      next_best_actions: ['Do not send any funds.'],
      checks: {
        executed: ['content.payment_pressure'],
        not_executed: [],
        unavailable: [],
        failed: [],
      },
      limitations: [],
    };

    it('validates a complete and schema-conforming report', () => {
      const result = validateAnalysisReport(validMockReport);
      expect(result.request_id).toBe('req-12345');
      expect(result.assessment_status).toBe(AssessmentStatus.SUSPICIOUS);
    });

    it('rejects non-object responses', () => {
      expect(() => validateAnalysisReport(null)).toThrow(AnalysisClientError);
      expect(() => validateAnalysisReport('not-an-object')).toThrow(AnalysisClientError);
    });

    it('rejects responses missing required fields', () => {
      const incomplete = { ...validMockReport };
      delete (incomplete as any).trust_dna;

      expect(() => validateAnalysisReport(incomplete)).toThrow(
        "missing required field 'trust_dna'"
      );
    });

    it('rejects unknown or invalid assessment status values', () => {
      const invalidStatus = { ...validMockReport, assessment_status: 'UNKNOWN_INVALID_STATUS' };
      expect(() => validateAnalysisReport(invalidStatus)).toThrow(
        'Invalid assessment status received'
      );
    });

    it('rejects responses where array fields are not arrays', () => {
      const badFindings = { ...validMockReport, findings: 'not-an-array' };
      expect(() => validateAnalysisReport(badFindings)).toThrow(
        "'findings' must be an array"
      );
    });
  });

  describe('API Client Network and Timeout Handling', () => {
    it('successfully fetches and validates report from backend', async () => {
      const mockReport: AnalysisReport = {
        request_id: 'test-req',
        status: 'success',
        assessment_status: AssessmentStatus.BENIGN,
        summary: 'No significant threats detected',
        analyzed_url: 'https://example.com',
        mode: AnalysisMode.PAGE,
        timestamp: '2026-11-01T12:00:00Z',
        findings: [],
        trust_dna: [],
        proof_mode: [],
        next_best_actions: ['Safe to browse normally.'],
        checks: { executed: [], not_executed: [], unavailable: [], failed: [] },
        limitations: [],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      });

      const report = await apiClient.analyzePage({
        url: 'https://example.com',
        visible_text: 'Hello world',
        links: [],
      });

      expect(report.request_id).toBe('test-req');
      expect(report.assessment_status).toBe(AssessmentStatus.BENIGN);
    });

    it('aborts and produces a Timeout error when request exceeds timeout limit', async () => {
      // Simulate hanging fetch
      globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      });

      await expect(
        apiClient.analyzePage(
          { url: 'https://example.com', visible_text: 'Text', links: [] },
          { timeoutMs: 50 } // fast timeout for test
        )
      ).rejects.toThrow('Analysis request timed out after 0.05 seconds.');
    });

    it('handles offline backend service with typed BACKEND_OFFLINE error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        apiClient.analyzePage({
          url: 'https://example.com',
          visible_text: 'Text',
          links: [],
        })
      ).rejects.toThrow('Failed to connect to Credible backend service.');
    });

    it('handles HTTP 422 validation error with structured backend error detail', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Selection text must not be empty.',
            field: 'selection.text',
          },
          request_id: 'err-123',
          timestamp: '2026-11-01T12:00:00Z',
        }),
      });

      try {
        await apiClient.analyzeSelection({
          url: 'https://example.com',
          text: '',
        });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(AnalysisClientError);
        expect(err.code).toBe('INVALID_REQUEST');
        expect(err.statusCode).toBe(422);
        expect(err.message).toBe('Selection text must not be empty.');
      }
    });
  });

  describe('Error Mapping to UI Messages', () => {
    it('maps BACKEND_OFFLINE to actionable guidance', () => {
      const err = new AnalysisClientError('Offline', 'BACKEND_OFFLINE');
      const msg = mapErrorToUserMessage(err);
      expect(msg).toContain('Credible backend service is unreachable');
      expect(msg).toContain('http://localhost:8000');
    });

    it('maps TIMEOUT to friendly retry message', () => {
      const err = new AnalysisClientError('Timed out', 'TIMEOUT');
      const msg = mapErrorToUserMessage(err);
      expect(msg).toContain('Analysis timed out after 15 seconds');
    });

    it('maps 413 payload too large to clear constraint message', () => {
      const err = new AnalysisClientError('Too long', 'PAYLOAD_TOO_LARGE', 413);
      const msg = mapErrorToUserMessage(err);
      expect(msg).toContain('Content payload exceeds maximum acceptable length');
    });
  });
});

