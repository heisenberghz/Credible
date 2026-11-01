"""Finding and check result schemas for Credible API."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class CheckStatus(str, Enum):
    DETECTED = "detected"
    NOT_DETECTED = "not_detected"
    UNKNOWN = "unknown"
    NOT_CHECKED = "not_checked"
    UNAVAILABLE = "unavailable"
    ERROR = "error"


class FindingSource(str, Enum):
    DETERMINISTIC = "deterministic"
    AI_INTERPRETED = "ai_interpreted"
    RECONCILED = "reconciled"


class Evidence(BaseModel):
    source: str = Field(..., description="Source location, e.g. visible_text, url, selection")
    excerpt: str = Field(..., max_length=1000, description="Observed text excerpt")
    reason: str = Field(..., description="Why this excerpt matters")


class CheckResult(BaseModel):
    check_id: str
    status: CheckStatus
    severity: Optional[Severity] = None
    confidence: Confidence
    evidence: list[Evidence] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class Finding(BaseModel):
    id: str
    title: str
    description: str
    severity: Severity
    confidence: Confidence
    status: CheckStatus = CheckStatus.DETECTED
    evidence: list[Evidence] = Field(default_factory=list)
    check_id: Optional[str] = None
    source: FindingSource = FindingSource.DETERMINISTIC
    limitations: list[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None

