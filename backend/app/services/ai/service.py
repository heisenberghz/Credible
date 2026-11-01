"""AI service orchestrator with resilient fallback handling."""

from typing import List, Optional, Tuple
from app.core.logging import logger
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.ai.base import AIProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.schemas import AIAnalysisOutput
from app.services.ai.validator import validate_and_filter_ai_output


class AIService:
    """Orchestrates AI analysis with graceful fallback when provider is unavailable."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or GeminiProvider()

    async def run_ai_analysis(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> Tuple[Optional[AIAnalysisOutput], List[str]]:
        """
        Execute AI analysis. If AI fails, times out, or is unconfigured, returns (None, limitations)
        so deterministic security checks can continue without disruption.
        """
        limitations: List[str] = []

        if not self.provider.is_configured():
            limitations.append(
                "AI contextual analysis was not executed because the AI provider is not configured. Results reflect deterministic security checks only."
            )
            return None, limitations

        try:
            raw_ai_output = await self.provider.analyze(request, deterministic_checks)
        except TimeoutError:
            logger.warning("AI provider timed out. Proceeding with deterministic fallback.")
            limitations.append(
                "AI analysis timed out. The report is based on deterministic security rules."
            )
            return None, limitations
        except Exception as e:
            logger.error(f"AI provider failed: {type(e).__name__} - {e}")
            limitations.append(
                "AI contextual analysis was unavailable due to a service error. Results are based on deterministic security rules."
            )
            return None, limitations

        # Extract text for quote grounding validation
        content_text = ""
        if request.mode == AnalysisMode.PAGE and request.page:
            content_text = request.page.visible_text
        elif request.mode == AnalysisMode.SELECTION and request.selection:
            content_text = request.selection.text

        executed_check_ids = [c.check_id for c in deterministic_checks]

        # Validate and ground AI findings
        validated_output, val_limitations = validate_and_filter_ai_output(
            raw_ai_output,
            original_text=content_text,
            executed_check_ids=executed_check_ids,
        )
        limitations.extend(val_limitations)

        return validated_output, limitations

