"""Public AI configuration/status schemas (never expose credentials)."""

from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class AIProviderStatus(BaseModel):
    name: str
    configured: bool
    model: Optional[str] = None
    role: str = Field(description="primary, secondary, or fallback position")


class AIStatusResponse(BaseModel):
    ai_enabled: bool
    mode: Literal["ai_assisted", "deterministic_only"]
    provider_order: List[str]
    active_provider: Optional[str] = None
    providers: List[AIProviderStatus]
    timeout_seconds: float
    total_timeout_seconds: float
    degraded: bool = False
    last_error: Optional[str] = None
    last_error_at: Optional[datetime] = None
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
