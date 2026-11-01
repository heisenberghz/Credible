"""Provider-neutral AI adapter interface."""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisRequest
from app.services.ai.schemas import AIAnalysisOutput


class AIProvider(ABC):
    """Abstract interface for AI analysis providers."""

    provider_name: str

    @abstractmethod
    async def analyze(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> AIAnalysisOutput:
        """Run AI contextual interpretation over normalized content and deterministic check results."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider credentials/configuration are present."""
        pass

