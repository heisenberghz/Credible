"""Strict Pydantic schemas for AI model output validation."""

from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.findings import Confidence, Severity
from app.schemas.reports import AssessmentStatus, TrustDnaStatus


class AIFinding(BaseModel):
    finding_type: str = Field(..., description="Category, e.g. payment_pressure, brand_impersonation, urgency, credential_harvesting")
    severity: Severity
    confidence: Confidence
    evidence_quote: str = Field(..., max_length=500, description="Exact or closely paraphrased quote from the untrusted content")
    explanation: str = Field(..., description="Why this finding represents a cybersecurity or trust risk")
    recommended_action: str = Field(..., description="Actionable protective recommendation")


class AIDimensionAssessment(BaseModel):
    dimension_id: str = Field(..., description="One of: identity_domain, connection_technical, transparency, page_behavior, content_consistency, credential_payment")
    status: TrustDnaStatus
    confidence: Confidence
    summary: str
    evidence_quote: Optional[str] = None
    limitations: List[str] = Field(default_factory=list)


class AIAnalysisOutput(BaseModel):
    assessment_status: AssessmentStatus
    summary: str = Field(..., description="Plain-language assessment summary")
    findings: List[AIFinding] = Field(default_factory=list)
    dimension_assessments: List[AIDimensionAssessment] = Field(default_factory=list)
    unknowns: List[str] = Field(default_factory=list, description="Critical information that could not be verified from page content alone")
    recommended_next_actions: List[str] = Field(default_factory=list, description="Prioritized protective steps for the user")

