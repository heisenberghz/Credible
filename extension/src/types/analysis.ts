/**
 * Credible domain types mirroring backend schemas
 */

export enum AnalysisMode {
  PAGE = 'page',
  SELECTION = 'selection',
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational',
}

export enum Confidence {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNKNOWN = 'unknown',
}

export enum CheckStatus {
  DETECTED = 'detected',
  NOT_DETECTED = 'not_detected',
  UNKNOWN = 'unknown',
  NOT_CHECKED = 'not_checked',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

export enum FindingSource {
  DETERMINISTIC = 'deterministic',
  AI_INTERPRETED = 'ai_interpreted',
  RECONCILED = 'reconciled',
}

export enum TrustDnaStatus {
  WARNING_FOUND = 'warning_found',
  NO_INDICATOR_DETECTED = 'no_indicator_detected',
  UNKNOWN = 'unknown',
  // Backward compatibility aliases
  POSITIVE = 'no_indicator_detected',
  CONCERN = 'warning_found',
  MIXED = 'warning_found',
  NOT_CHECKED = 'unknown',
}

export enum AssessmentStatus {
  NEEDS_VERIFICATION = 'needs_verification',
  SUSPICIOUS = 'suspicious',
  CAUTION = 'caution',
  BENIGN = 'benign',
  INCONCLUSIVE = 'inconclusive',
  ERROR = 'error',
}

export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MODE = 'UNSUPPORTED_MODE',
  MALFORMED_URL = 'MALFORMED_URL',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface LinkItem {
  text: string;
  href: string;
}

export interface PageData {
  url: string;
  title?: string | null;
  visible_text: string;
  links: LinkItem[];
}

export interface SelectionData {
  url: string;
  text: string;
  link?: LinkItem | null;
}

export interface ClientContext {
  extension_version?: string;
  user_agent?: string | null;
}

export interface AnalysisRequest {
  request_id: string;
  mode: AnalysisMode;
  page?: PageData | null;
  selection?: SelectionData | null;
  client_context?: ClientContext | null;
}

export interface Evidence {
  source: string;
  excerpt: string;
  reason: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: Confidence;
  status: CheckStatus;
  evidence: Evidence[];
  check_id?: string | null;
  source: FindingSource;
  limitations: string[];
  recommended_action?: string | null;
}

export interface TrustDnaDimension {
  id: string;
  name: string;
  status: TrustDnaStatus;
  confidence: Confidence;
  summary: string;
  dimension_score?: number;
  evidence: Evidence[];
  limitations: string[];
}

export interface ProofModeEntry {
  finding_id: string;
  title: string;
  observed: string;
  location: string;
  why_it_matters: string;
  check_id?: string | null;
  source?: FindingSource;
  is_deterministic: boolean;
  confidence: Confidence;
  limitations: string[];
}

export interface ExecutedChecksSummary {
  executed: string[];
  not_executed: string[];
  unavailable: string[];
  failed: string[];
}

export interface AnalysisReport {
  request_id: string;
  status: string;
  assessment_status: AssessmentStatus;
  score?: number;
  summary: string;
  analyzed_url: string;
  mode: AnalysisMode;
  timestamp: string;
  findings: Finding[];
  trust_dna: TrustDnaDimension[];
  proof_mode: ProofModeEntry[];
  next_best_actions: string[];
  checks: ExecutedChecksSummary;
  limitations: string[];
}

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  field?: string | null;
}

export interface ErrorResponse {
  error: ErrorDetail;
  request_id: string;
  timestamp: string;
}

