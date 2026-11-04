"""AI service orchestrator with graceful degradation.

Credible uses Gemini only. Configuration problems, provider outages, timeouts,
and malformed output all degrade to deterministic-only results with an explicit
limitation instead of failing the scan. Runtime failures are also recorded so the
status endpoint can report an honest ``degraded`` state.
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Sequence, Tuple

from app.core.config import settings
from app.core.logging import logger
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.ai.base import AIProvider
from app.services.ai.cache import AIResultCache
from app.services.ai.factory import build_ai_providers
from app.services.ai.schemas import AIAnalysisOutput
from app.services.ai.validator import validate_and_filter_ai_output

UNCONFIGURED_MESSAGE = (
    "AI contextual analysis was not executed because the AI provider is not "
    "configured. Results reflect deterministic security checks only."
)
TIMEOUT_MESSAGE = (
    "AI analysis timed out. The report is based on deterministic security rules."
)
UNAVAILABLE_MESSAGE = (
    "AI contextual analysis was unavailable due to a service error. Results are "
    "based on deterministic security rules."
)

# Process-local runtime state. The status endpoint is read-mostly, so a plain
# dict is sufficient; the event loop serializes these assignments.
_runtime = {
    "degraded": False,
    "last_error": None,
    "last_error_at": None,
    "last_success_at": None,
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def reset_runtime_status() -> None:
    """Clear recorded AI runtime state (used by tests and after config changes)."""
    _runtime.update(
        degraded=False,
        last_error=None,
        last_error_at=None,
        last_success_at=None,
    )


def get_runtime_status() -> dict:
    """Return a copy of the last AI execution outcome."""
    return dict(_runtime)


def _record_failure(message: str) -> None:
    _runtime.update(
        degraded=True,
        last_error=message[:300],
        last_error_at=_utc_now(),
    )


def _record_success() -> None:
    _runtime.update(
        degraded=False,
        last_error=None,
        last_error_at=None,
        last_success_at=_utc_now(),
    )


class AIService:
    """Run Gemini (or an injected provider) and degrade safely on failure."""

    def __init__(
        self,
        provider: Optional[AIProvider] = None,
        providers: Optional[Sequence[AIProvider]] = None,
        cache: Optional[AIResultCache] = None,
    ):
        if providers is not None:
            self.providers: List[AIProvider] = list(providers)
        elif provider is not None:
            self.providers = [provider]
        else:
            self.providers = build_ai_providers()

        # The process normally builds one AIService, so this cache survives
        # across requests. Tests can inject an isolated cache.
        self.cache = cache or AIResultCache(
            ttl_seconds=settings.AI_CACHE_TTL_SECONDS,
            max_entries=settings.AI_CACHE_MAX_ENTRIES,
            enabled=settings.AI_CACHE_ENABLED,
        )

        # Kept for callers that previously read a single provider.
        self.provider = self.providers[0] if self.providers else None

    @staticmethod
    def _content_text(request: AnalysisRequest) -> str:
        if request.mode == AnalysisMode.PAGE and request.page:
            return request.page.visible_text
        if request.mode == AnalysisMode.SELECTION and request.selection:
            return request.selection.text
        return ""

    async def run_ai_analysis(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> Tuple[Optional[AIAnalysisOutput], List[str]]:
        """Execute the provider chain and return (output, limitations).

        The chain is still ordered and mock providers are supported by tests,
        but production configuration builds Gemini only. The total budget stays
        below the extension's 80s HTTP timeout.
        """
        configured = [p for p in self.providers if p.is_configured()]
        if not configured:
            return None, [UNCONFIGURED_MESSAGE]

        content_text = self._content_text(request)
        executed_check_ids = [c.check_id for c in deterministic_checks]
        loop = asyncio.get_running_loop()
        deadline = loop.time() + max(1.0, settings.AI_TOTAL_TIMEOUT_SECONDS)
        failures: List[str] = []

        for index, provider in enumerate(configured):
            cache_key = provider.cache_fingerprint(request, deterministic_checks)
            if cache_key:
                cached = self.cache.get(cache_key)
                if cached is not None:
                    logger.info(
                        f"AI cache hit for {provider.provider_name}; "
                        "reusing validated result."
                    )
                    return cached

            remaining = deadline - loop.time()
            if remaining <= 0:
                failures.append("timeout")
                _record_failure(f"{provider.provider_name}: total AI budget exhausted")
                break

            try:
                raw_output = await asyncio.wait_for(
                    provider.analyze(request, deterministic_checks),
                    timeout=remaining,
                )
            except (asyncio.TimeoutError, TimeoutError):
                logger.warning(
                    f"AI provider {provider.provider_name} timed out; trying next provider."
                )
                failures.append("timeout")
                _record_failure(f"{provider.provider_name}: timed out")
                continue
            except Exception as e:
                logger.error(
                    f"AI provider {provider.provider_name} failed: {type(e).__name__}"
                )
                failures.append("error")
                _record_failure(
                    f"{provider.provider_name}: {type(e).__name__}: {str(e)[:200]}"
                )
                continue

            try:
                validated_output, validation_limitations = validate_and_filter_ai_output(
                    raw_output,
                    original_text=content_text,
                    executed_check_ids=executed_check_ids,
                )
            except Exception as e:
                logger.error(
                    f"AI output validation failed for {provider.provider_name}: "
                    f"{type(e).__name__}"
                )
                failures.append("error")
                _record_failure(
                    f"{provider.provider_name}: invalid output ({type(e).__name__})"
                )
                continue

            limitations = list(validation_limitations)
            if index > 0:
                reason = (
                    "timed out"
                    if failures and failures[-1] == "timeout"
                    else "was unavailable"
                )
                limitations.insert(
                    0,
                    f"Primary AI provider {reason}; analysis continued with the "
                    f"fallback provider ({provider.provider_name}).",
                )
            if cache_key:
                self.cache.set(cache_key, validated_output, limitations)
            _record_success()
            return validated_output, limitations

        if failures and all(reason == "timeout" for reason in failures):
            return None, [TIMEOUT_MESSAGE]
        return None, [UNAVAILABLE_MESSAGE]
