"""Report and Trust DNA schemas for Credible API."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.findings import Confidence, Evidence, Finding
from app.schemas.requests import AnalysisMode


class TrustDnaStatus(str, Enum):
    WARNING_FOUND = "warning_found"
    NO_INDICATOR_DETECTED = "no_indicator_detected"
    UNKNOWN = "unknown"
    # Legacy alias compatibility
    CONCERN = "warning_found"
    POSITIVE = "no_indicator_detected"
    MIXED = "warning_found"
    NOT_CHECKED = "unknown"


class AssessmentStatus(str, Enum):
    NEEDS_VERIFICATION = "needs_verification"
    SUSPICIOUS = "suspicious"
    CAUTION = "caution"
    BENIGN = "benign"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"


class TrustDnaDimension(BaseModel):
    id: str = Field(
        ...,
        description="Canonical 5.1 MVP dimension keys: payment_risk, identity_risk, social_engineering_risk, data_exposure_risk, link_domain_risk, evidence_confidence",
    )
    name: str
    status: TrustDnaStatus
    confidence: Confidence
    summary: str
    dimension_score: int = Field(
        default=100,
        ge=1,
        le=100,
        description="Heuristic credibility score for this specific dimension (1-100)",
    )
    evidence: list[Evidence] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class ProofModeEntry(BaseModel):
    finding_id: str
    title: str
    observed: str
    location: str
    why_it_matters: str
    check_id: Optional[str] = None
    is_deterministic: bool = True
    confidence: Confidence
    limitations: list[str] = Field(default_factory=list)


class ExecutedChecksSummary(BaseModel):
    executed: list[str] = Field(default_factory=list)
    not_executed: list[str] = Field(default_factory=list)
    unavailable: list[str] = Field(default_factory=list)
    failed: list[str] = Field(default_factory=list)


class AnalysisReport(BaseModel):
    request_id: str
    status: str = "completed"
    assessment_status: AssessmentStatus
    score: int = Field(
        default=100,
        ge=1,
        le=100,
        description="Transparent multi-factor credibility score between 1 and 100",
    )
    summary: str
    analyzed_url: str
    mode: AnalysisMode
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    findings: list[Finding] = Field(default_factory=list)
    trust_dna: list[TrustDnaDimension] = Field(default_factory=list)
    proof_mode: list[ProofModeEntry] = Field(default_factory=list)
    next_best_actions: list[str] = Field(default_factory=list)
    checks: ExecutedChecksSummary = Field(default_factory=ExecutedChecksSummary)
    limitations: list[str] = Field(default_factory=list)

