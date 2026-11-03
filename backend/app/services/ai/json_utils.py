"""Shared helpers for AI provider responses."""

import re


def clean_json_markdown(text: str) -> str:
    """Strip markdown code fence blocks if returned by a model."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()
