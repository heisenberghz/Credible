"""AI status route. Reports configuration only; it never calls a provider."""

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.ai import AIProviderStatus, AIStatusResponse
from app.services.ai.factory import build_ai_providers, first_configured_provider
from app.services.ai.service import get_runtime_status

router = APIRouter(prefix="/api/v1", tags=["AI"])

_ROLE_NAMES = ["primary", "secondary", "tertiary"]


@router.get("/ai/status", response_model=AIStatusResponse)
def get_ai_status() -> AIStatusResponse:
    """Return whether AI is configured and which providers are in the chain.

    This endpoint is deliberately configuration-only: it does not spend tokens
    or hit a third-party API. Use ``python scripts/check_ai.py`` for a live
    credential probe.
    """
    providers = build_ai_providers()
    statuses = [
        AIProviderStatus(
            name=provider.provider_name,
            configured=provider.is_configured(),
            model=provider.model_name or None,
            role=_ROLE_NAMES[index] if index < len(_ROLE_NAMES) else f"fallback_{index + 1}",
        )
        for index, provider in enumerate(providers)
    ]
    active = first_configured_provider(providers)
    runtime = get_runtime_status()

    return AIStatusResponse(
        ai_enabled=active is not None,
        mode="ai_assisted" if active is not None else "deterministic_only",
        provider_order=[provider.provider_name for provider in providers],
        active_provider=active.provider_name if active else None,
        providers=statuses,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
        total_timeout_seconds=settings.AI_TOTAL_TIMEOUT_SECONDS,
        degraded=runtime["degraded"],
        last_error=runtime["last_error"],
        last_error_at=runtime["last_error_at"],
    )
