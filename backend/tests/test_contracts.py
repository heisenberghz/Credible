"""Contract verification tests ensuring Python schemas match TypeScript definitions."""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.errors import ErrorCode
from app.schemas.findings import CheckStatus, Confidence, FindingSource, Severity
from app.schemas.reports import AssessmentStatus, TrustDnaStatus
from app.schemas.requests import AnalysisMode


FIXTURES_DIR = Path(__file__).parent / "fixtures"
EXTENSION_FIXTURES_DIR = Path(__file__).parent.parent.parent / "extension" / "tests" / "fixtures"

# The golden bundle is a tracked fixture. A real pipeline run stamps the current
# time, which would make every test run dirty the working tree, so pin the
# timestamp when exporting. The extension contract tests only validate shape.
GOLDEN_TIMESTAMP = "2026-01-01T00:00:00Z"


class TestSchemaContracts:
    def test_enum_parity_with_typescript(self):
        """Assert exact parity between Python enums and TypeScript types."""
        # AnalysisMode
        assert set(e.value for e in AnalysisMode) == {"page", "selection"}

        # Severity
        assert set(e.value for e in Severity) == {
            "critical",
            "high",
            "medium",
            "low",
            "informational",
        }

        # Confidence
        assert set(e.value for e in Confidence) == {"high", "medium", "low", "unknown"}

        # CheckStatus
        assert set(e.value for e in CheckStatus) == {
            "detected",
            "not_detected",
            "unknown",
            "not_checked",
            "unavailable",
            "error",
        }

        # FindingSource
        assert set(e.value for e in FindingSource) == {
            "deterministic",
            "ai_interpreted",
            "reconciled",
        }

        # TrustDnaStatus
        assert set(e.value for e in TrustDnaStatus) == {
            "warning_found",
            "no_indicator_detected",
            "unknown",
        }

        # AssessmentStatus
        assert set(e.value for e in AssessmentStatus) == {
            "needs_verification",
            "suspicious",
            "caution",
            "benign",
            "inconclusive",
            "error",
        }

        # ErrorCode
        assert set(e.value for e in ErrorCode) == {
            "INVALID_REQUEST",
            "PAYLOAD_TOO_LARGE",
            "UNSUPPORTED_MODE",
            "MALFORMED_URL",
            "AI_PROVIDER_ERROR",
            "AI_TIMEOUT",
            "RATE_LIMITED",
            "INTERNAL_ERROR",
        }

    def test_export_golden_reports_for_extension_testing(self):
        """Generate golden reports from real pipeline to test extension contract validation."""
        client = TestClient(app)

        # Benign Report
        with open(FIXTURES_DIR / "benign.json", "r", encoding="utf-8") as f:
            benign_payload = json.load(f)
        benign_resp = client.post("/api/v1/analyze", json=benign_payload)
        assert benign_resp.status_code == 200
        benign_report = benign_resp.json()

        # Suspicious Report
        with open(FIXTURES_DIR / "suspicious.json", "r", encoding="utf-8") as f:
            suspicious_payload = json.load(f)
        suspicious_resp = client.post("/api/v1/analyze", json=suspicious_payload)
        assert suspicious_resp.status_code == 200
        suspicious_report = suspicious_resp.json()

        # Selection Mode Report
        selection_payload = {
            "request_id": "req-golden-selection-001",
            "mode": "selection",
            "page": None,
            "selection": {
                "url": "https://g00gle.xyz/verify",
                "text": "Deposit refundable fee of $500 immediately to confirm your appointment.",
                "link": {"text": "Deposit now", "href": "https://g00gle.xyz/pay"},
            },
        }
        selection_resp = client.post("/api/v1/analyze", json=selection_payload)
        assert selection_resp.status_code == 200
        selection_report = selection_resp.json()

        for report in (benign_report, suspicious_report, selection_report):
            report["timestamp"] = GOLDEN_TIMESTAMP

        golden_bundle = {
            "benign": benign_report,
            "suspicious": suspicious_report,
            "selection": selection_report,
        }

        EXTENSION_FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
        golden_path = EXTENSION_FIXTURES_DIR / "golden_reports.json"
        serialized = json.dumps(golden_bundle, indent=2)
        existing = golden_path.read_text(encoding="utf-8") if golden_path.exists() else None
        if existing != serialized:
            golden_path.write_text(serialized, encoding="utf-8")

        assert golden_path.exists()

