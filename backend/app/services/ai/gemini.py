"""Google Gemini AI provider implementation using google-genai SDK."""


import asyncio
import json
import re
from typing import List, Optional
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import logger
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisRequest
from app.services.ai.base import AIProvider
from app.services.ai.prompts import SYSTEM_PROMPT, build_analysis_prompt
from app.services.ai.schemas import AIAnalysisOutput


def clean_json_markdown(text: str) -> str:
    """Strip markdown code fence blocks if returned by model."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


class GeminiProvider(AIProvider):
    provider_name = "gemini"

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None

        if self.api_key and self.api_key.strip():
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self._client = None

    def is_configured(self) -> bool:
        return bool(self._client is not None and self.api_key and self.api_key.strip())

    async def analyze(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> AIAnalysisOutput:
        if not self.is_configured():
            raise RuntimeError("Gemini AI provider is not configured. Missing GEMINI_API_KEY.")

        prompt = build_analysis_prompt(request, deterministic_checks)

        # Call Gemini in async threadpool to avoid blocking event loop
        def _call_gemini() -> str:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,  # Low temperature for objective defensive analysis
                    response_mime_type="application/json",
                ),
            )
            return response.text or "{}"

        try:
            raw_text = await asyncio.wait_for(
                asyncio.to_thread(_call_gemini),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            raise TimeoutError(f"Gemini API timed out after {settings.AI_TIMEOUT_SECONDS} seconds.")
        except Exception as e:
            logger.error(f"Gemini API call failed: {type(e).__name__}")
            raise RuntimeError(f"Gemini API call failed: {e}")

        # Parse and validate response against Pydantic schema
        clean_text = clean_json_markdown(raw_text)
        try:
            parsed_dict = json.loads(clean_text)
            return AIAnalysisOutput.model_validate(parsed_dict)
        except Exception as e:
            logger.error(f"Failed to validate Gemini JSON output: {e}")
            raise ValueError(f"Malformed AI output schema: {e}")
