"""Report and Trust DNA schemas for Credible API."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.findings import Confidence, Evidence, Finding
from app.schemas.requests import AnalysisMode


class TrustDnaStatus(str, Enum):
    POSITIVE = "positive"
    CONCERN = "concern"
    MIXED = "mixed"
    UNKNOWN = "unknown"
    NOT_CHECKED = "not_checked"


class AssessmentStatus(str, Enum):
    NEEDS_VERIFICATION = "needs_verification"
    SUSPICIOUS = "suspicious"
    CAUTION = "caution"
    BENIGN = "benign"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"


class TrustDnaDimension(BaseModel):
    id: str = Field(..., description="Dimension key: identity_domain, connection_technical, transparency, page_behavior, content_consistency, credential_payment")
    name: str
    status: TrustDnaStatus
    confidence: Confidence
    summary: str
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

