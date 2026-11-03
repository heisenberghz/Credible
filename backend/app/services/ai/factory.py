"""Provider factory: turns configuration into an ordered AI fallback chain."""

from typing import Dict, List, Optional, Type

from app.core.config import provider_order_from_settings
from app.core.logging import logger
from app.services.ai.base import AIProvider
from app.services.ai.gemini import GeminiProvider

PROVIDER_CLASSES: Dict[str, Type[AIProvider]] = {
    "gemini": GeminiProvider,
}


def build_ai_providers() -> List[AIProvider]:
    """Instantiate providers in configured order.

    Unknown provider names are ignored with a warning so a typo degrades to
    deterministic-only mode instead of taking the backend down at startup.
    """
    providers: List[AIProvider] = []
    for name in provider_order_from_settings():
        provider_cls = PROVIDER_CLASSES.get(name)
        if provider_cls is None:
            logger.warning(f"Unknown AI provider configured: {name!r}. Ignoring.")
            continue
        try:
            providers.append(provider_cls())
        except Exception as e:
            logger.error(f"Could not initialize AI provider {name!r}: {type(e).__name__}")
    return providers


def first_configured_provider(providers: List[AIProvider]) -> Optional[AIProvider]:
    for provider in providers:
        if provider.is_configured():
            return provider
    return None
