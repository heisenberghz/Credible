"""Google Gemini AI provider implementation using the google-genai SDK."""

import asyncio
import json
import re
from typing import List, Optional, Tuple

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import logger
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisRequest
from app.services.ai.base import AIProvider
from app.services.ai.json_utils import clean_json_markdown
from app.services.ai.prompts import SYSTEM_PROMPT, build_analysis_prompt
from app.services.ai.schemas import AIAnalysisOutput

__all__ = ["GeminiProvider", "clean_json_markdown"]

_RETRYABLE_CODES = (429, 500, 502, 503, 504)
_RETRYABLE_MARKERS = (
    "RESOURCE_EXHAUSTED",
    "UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "INTERNAL",
)


def _is_retryable(exc: Exception) -> bool:
    """Return True for transient quota/capacity errors worth one retry."""
    code = getattr(exc, "code", None)
    if isinstance(code, int) and code in _RETRYABLE_CODES:
        return True
    text = str(exc)
    if any(marker in text for marker in _RETRYABLE_MARKERS):
        return True
    return bool(re.search(r"\b(429|500|502|503|504)\b", text))


class GeminiProvider(AIProvider):
    provider_name = "gemini"

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None

        if self.api_key and self.api_key.strip():
            try:
                self._client = genai.Client(
                    api_key=self.api_key,
                    http_options=types.HttpOptions(
                        timeout=int(max(1.0, settings.AI_TIMEOUT_SECONDS) * 1000)
                    ),
                )
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {type(e).__name__}")
                self._client = None

    def is_configured(self) -> bool:
        return bool(self._client is not None and self.api_key and self.api_key.strip())

    def _generate(self, contents: str, *, json_mode: bool = True) -> str:
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT if json_mode else None,
            temperature=0.1 if json_mode else 0.0,
            response_mime_type="application/json" if json_mode else None,
            max_output_tokens=2048 if json_mode else 8,
        )
        response = self._client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config,
        )
        return response.text or "{}"

    async def analyze(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> AIAnalysisOutput:
        if not self.is_configured():
            raise RuntimeError("Gemini AI provider is not configured. Missing GEMINI_API_KEY.")

        prompt = build_analysis_prompt(request, deterministic_checks)

        # One retry is allowed for transient 429/503 responses. The outer service
        # still enforces the total budget, so a slow first attempt cannot push
        # the scan past the extension's HTTP timeout.
        raw_text: Optional[str] = None
        for attempt in range(2):
            try:
                raw_text = await asyncio.wait_for(
                    asyncio.to_thread(self._generate, prompt, json_mode=True),
                    timeout=settings.AI_TIMEOUT_SECONDS,
                )
                break
            except asyncio.TimeoutError:
                raise TimeoutError(
                    f"Gemini API timed out after {settings.AI_TIMEOUT_SECONDS} seconds."
                )
            except Exception as e:
                if attempt == 0 and _is_retryable(e):
                    logger.warning(
                        f"Gemini transient error ({type(e).__name__}); retrying once."
                    )
                    await asyncio.sleep(0.8)
                    continue
                logger.error(f"Gemini API call failed: {type(e).__name__}")
                raise RuntimeError(f"Gemini API call failed: {e}")

        if raw_text is None:
            raise RuntimeError("Gemini API call failed without a response.")

        # Parse and validate response against the strict Pydantic schema.
        clean_text = clean_json_markdown(raw_text)
        try:
            parsed_dict = json.loads(clean_text)
            return AIAnalysisOutput.model_validate(parsed_dict)
        except Exception as e:
            logger.error(f"Failed to validate Gemini JSON output: {type(e).__name__}")
            raise ValueError(f"Malformed AI output schema: {e}")

    async def probe(self) -> Tuple[bool, str]:
        """Make one tiny authenticated call and return (ok, human-readable detail)."""
        if not self.is_configured():
            return False, "missing GEMINI_API_KEY"
        try:
            await asyncio.wait_for(
                asyncio.to_thread(self._generate, "Reply with OK.", json_mode=False),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )
            return True, "OK"
        except asyncio.TimeoutError:
            return False, f"timed out after {settings.AI_TIMEOUT_SECONDS:.0f}s"
        except Exception as e:
            return False, f"{type(e).__name__}: {str(e)[:240]}"

    async def list_models(self) -> List[str]:
        """Return model ids visible to this key (empty list on failure)."""
        if self._client is None:
            return []
        try:
            models = await asyncio.to_thread(lambda: list(self._client.models.list()))
            return sorted(m.name.replace("models/", "") for m in models)
        except Exception as e:
            logger.warning(f"Gemini model listing failed: {type(e).__name__}")
            return []

    async def check_connectivity(self) -> bool:
        ok, _ = await self.probe()
        return ok
