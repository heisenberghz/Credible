"""Verify Credible's Gemini configuration without running a scan.

Usage (from the backend directory):
    .\\.venv\\Scripts\\python.exe scripts\\check_ai.py
    .\\.venv\\Scripts\\python.exe scripts\\check_ai.py --no-probe

Exit codes:
    0  configuration is usable (or AI is intentionally disabled)
    1  the configured model/key failed the connectivity or availability check
"""

import argparse
import asyncio
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import BACKEND_DIR as CONFIG_DIR, settings  # noqa: E402
from app.services.ai.gemini import GeminiProvider  # noqa: E402


def _key_state(key: str) -> str:
    return f"present (len={len(key.strip())})" if key and key.strip() else "missing"


def _suggest_models(models: list[str]) -> list[str]:
    return [
        name
        for name in models
        if "flash" in name
        and "lite" in name
        and not any(skip in name for skip in ("image", "tts", "live", "transcribe"))
    ]


async def main() -> int:
    parser = argparse.ArgumentParser(description="Check Credible's Gemini configuration.")
    parser.add_argument(
        "--no-probe",
        action="store_true",
        help="Only print configuration; do not make a live API call.",
    )
    args = parser.parse_args()

    print("Credible AI configuration check")
    print(f"  env file : {CONFIG_DIR / '.env'}")
    print(f"  provider : {settings.AI_PROVIDER}")
    print(f"  order    : {', '.join(settings.AI_PROVIDER_ORDER) or '(none)'}")
    print(f"  timeouts : {settings.AI_TIMEOUT_SECONDS}s per attempt, "
          f"{settings.AI_TOTAL_TIMEOUT_SECONDS}s total")
    print(f"  ai input : {settings.AI_MAX_INPUT_CHARS} chars max")
    print()

    if settings.AI_PROVIDER.strip().lower() in {"disabled", "none", "off"}:
        print("AI is disabled. Credible will run in deterministic-only mode.")
        return 0

    provider = GeminiProvider()
    print("[gemini]")
    print(f"  model       : {provider.model_name}")
    print(f"  key         : {_key_state(getattr(provider, 'api_key', ''))}")
    print(f"  configured  : {'yes' if provider.is_configured() else 'no'}")
    print()

    if not provider.is_configured():
        print("No Gemini key found. Add GEMINI_API_KEY to")
        print(f"  {CONFIG_DIR / '.env'}")
        print("Credible will continue to work in deterministic-only mode.")
        return 0

    if args.no_probe:
        print("Probe skipped (--no-probe).")
        return 0

    print("Probing Gemini...")
    ok, detail = await provider.probe()
    print(f"  gemini: {'OK' if ok else 'FAILED'} ({detail})")

    models = await provider.list_models()
    model_available = settings.GEMINI_MODEL in models if models else True
    if not models:
        print("  models: could not list models (probe result above is authoritative)")
    elif model_available:
        print(f"  models: {settings.GEMINI_MODEL} is available")
    else:
        print(f"  models: {settings.GEMINI_MODEL} is NOT available for this key")
        suggestions = _suggest_models(models)
        if suggestions:
            print(f"  try    : {', '.join(suggestions[-4:])}")

    print()
    print("Free-tier reference (AI Studio -> Rate limits):")
    print("  Flash      : ~5 RPM / 20 RPD / 250K TPM")
    print("  Flash Lite : ~15 RPM / 500 RPD / 250K TPM")
    print("  503/504 responses are capacity spikes, not quota exhaustion.")
    print()

    if ok and model_available:
        print("Gemini is ready.")
        return 0
    print("Gemini is not fully ready. Credible will fall back to deterministic")
    print("rules during a scan.")
    return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
