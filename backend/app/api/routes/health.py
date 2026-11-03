"""Health check route."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.services.ai.factory import build_ai_providers, first_configured_provider
from app.services.ai.service import get_runtime_status

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    providers = build_ai_providers()
    active = first_configured_provider(providers)
    runtime = get_runtime_status()

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai": {
            "enabled": active is not None,
            "mode": "ai_assisted" if active is not None else "deterministic_only",
            "active_provider": active.provider_name if active else None,
            "providers": [p.provider_name for p in providers if p.is_configured()],
            "degraded": runtime["degraded"],
            "last_error": runtime["last_error"],
        },
    }
