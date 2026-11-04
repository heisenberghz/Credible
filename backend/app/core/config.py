"""Application configuration and settings.

Configuration is loaded from ``backend/.env`` regardless of the current working
directory. Environment variables always win over values in the file, which makes
the same codebase work for local development, CI, and a deployed secret manager.
"""

import json
from pathlib import Path
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]

SUPPORTED_AI_PROVIDERS = ("gemini",)
DISABLED_AI_VALUES = {"disabled", "none", "off"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Credible API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS. Chrome extension origins use chrome-extension://<32 chars a-p>.
    # "chrome-extension://*" is not a real wildcard in Starlette, so the regex
    # below does the actual extension matching.
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:8000",
    ]
    CORS_ORIGIN_REGEX: str = r"^chrome-extension://[a-p]{32}$"

    # AI provider selection:
    #   auto     -> use Gemini when GEMINI_API_KEY is present
    #   gemini  -> only Gemini
    #   disabled -> deterministic-only mode
    AI_PROVIDER: str = "auto"
    AI_PROVIDER_ORDER: Union[List[str], str] = ["gemini"]

    # Google Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Free-tier Gemini can take 20-60s to respond under load, so the AI stage
    # gets a much larger budget than the rest of the scan. The extension's
    # client timeout is 80s, which leaves headroom for deterministic work.
    AI_TIMEOUT_SECONDS: float = 60.0
    AI_TOTAL_TIMEOUT_SECONDS: float = 70.0

    # Cap the text sent to the AI. Deterministic checks still run over the full
    # page text; this only bounds token usage and model latency.
    AI_MAX_INPUT_CHARS: int = 20000

    # Short-lived cache for validated AI results. Identical content + model
    # reuse the previous result instead of spending another free-tier call.
    AI_CACHE_ENABLED: bool = True
    AI_CACHE_TTL_SECONDS: int = 900
    AI_CACHE_MAX_ENTRIES: int = 128

    # Content boundaries
    MAX_PAGE_TEXT_CHARS: int = 50000
    MAX_SELECTION_TEXT_CHARS: int = 5000
    MAX_LINKS_COUNT: int = 200

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("AI_PROVIDER_ORDER", mode="before")
    @classmethod
    def parse_provider_order(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    return [str(item).strip().lower() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip().lower() for item in v.split(",") if item.strip()]
        return [str(item).strip().lower() for item in v]

    @field_validator("AI_PROVIDER", mode="before")
    @classmethod
    def normalize_provider_mode(cls, v: str) -> str:
        return str(v).strip().lower() or "auto"


def provider_order_from_settings() -> List[str]:
    """Return the effective, de-duplicated provider order.

    Explicit single-provider mode overrides the configured chain. Unknown names
    are dropped by the factory with a warning rather than crashing startup.
    """
    mode = settings.AI_PROVIDER
    if mode in DISABLED_AI_VALUES:
        return []
    if mode in ("auto", ""):
        candidates = list(settings.AI_PROVIDER_ORDER)
    else:
        candidates = [mode]

    ordered: List[str] = []
    for name in candidates:
        if name not in ordered:
            ordered.append(name)
    return ordered


settings = Settings()
