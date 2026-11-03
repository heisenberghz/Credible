"""Pytest configuration and shared test fixtures."""

import os
import sys
from pathlib import Path
import pytest

# Tests must never read a developer's real key from backend/.env or call a live
# provider. Environment variables win over the .env file, so blanking the key
# here forces every analyze test onto the deterministic path.
os.environ["GEMINI_API_KEY"] = ""
os.environ["AI_PROVIDER"] = "auto"
os.environ["AI_PROVIDER_ORDER"] = "gemini"

# Ensure app package is on path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

