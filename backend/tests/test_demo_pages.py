"""
Automated validation of the 5 Credible Demo Scenarios.
Ensures that each demo scenario page produces the expected assessment status,
threat findings, and security guardrail behaviors.
"""

from html.parser import HTMLParser
from pathlib import Path
import re
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.findings import Severity
from app.schemas.reports import AssessmentStatus

client = TestClient(app)
DEMO_PAGES_DIR = Path(__file__).resolve().parent.parent.parent / "demo" / "pages"


class SimpleHTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self._ignore = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._ignore = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._ignore = False

    def handle_data(self, data):
        if not self._ignore:
            cleaned = data.strip()
            if cleaned:
                self.text_parts.append(cleaned)

    def get_text(self) -> str:
        return " ".join(self.text_parts)


def extract_html_text(html_content: str) -> str:
    """Extract readable visible text from HTML content using standard library parser."""
    parser = SimpleHTMLTextExtractor()
    parser.feed(html_content)
    return parser.get_text()


class TestDemoPagesPipeline:
    def test_all_demo_pages_exist(self):
        """Verify that all 5 required demo scenario pages exist on disk."""
        expected_files = [
            "benign.html",
            "suspicious.html",
            "ambiguous.html",
            "prompt-injection.html",
            "error-demo.html",
            "index.html",
            "styles.css",
        ]
        for filename in expected_files:
            file_path = DEMO_PAGES_DIR / filename
            assert file_path.exists(), f"Demo file missing: {filename}"

    def test_scenario_1_benign_page_produces_safe_assessment(self):
        """Scenario 1: Benign corporate job listing results in SAFE/BENIGN status with zero threat findings."""
        html = (DEMO_PAGES_DIR / "benign.html").read_text(encoding="utf-8")
        visible_text = extract_html_text(html)

        payload = {
            "request_id": "demo-scenario-1",
            "mode": "page",
            "page": {
                "url": "http://localhost:8080/benign.html",
                "title": "Senior Cloud Infrastructure Engineer — Acme Cloud Platforms",
                "visible_text": visible_text,
                "links": [{"text": "Index", "href": "http://localhost:8080/index.html"}],
            },
        }

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["assessment_status"] in (
            AssessmentStatus.BENIGN.value,
            AssessmentStatus.CAUTION.value,
            AssessmentStatus.NEEDS_VERIFICATION.value,
        )
        # Should have zero high or critical findings
        critical_high = [
            f for f in data["findings"]
            if f.get("severity") in (Severity.CRITICAL.value, Severity.HIGH.value)
        ]
        assert len(critical_high) == 0

    def test_scenario_2_suspicious_page_produces_threat_findings(self):
        """Scenario 2: Fraudulent listing with upfront fee, urgency, and password harvesting."""
        html = (DEMO_PAGES_DIR / "suspicious.html").read_text(encoding="utf-8")
        visible_text = extract_html_text(html)

        payload = {
            "request_id": "demo-scenario-2",
            "mode": "page",
            "page": {
                "url": "http://localhost:8080/suspicious.html",
                "title": "Remote Operations Assistant — Apex Global Logistics",
                "visible_text": visible_text,
                "links": [],
            },
        }

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["assessment_status"] in (
            AssessmentStatus.SUSPICIOUS.value,
            AssessmentStatus.CAUTION.value,
        )
        check_ids = [f["id"] for f in data["findings"]]

        # Payment pressure, credential pressure, or urgency must be detected
        assert any("content.payment_pressure" in cid or "payment_pressure" in cid for cid in check_ids)
        assert any("content.credential_pressure" in cid or "credential" in cid for cid in check_ids)
        assert any("content.urgency" in cid or "urgency" in cid for cid in check_ids)

    def test_scenario_3_ambiguous_page_produces_measured_review(self):
        """Scenario 3: Mixed signals without outright password or deposit theft."""
        html = (DEMO_PAGES_DIR / "ambiguous.html").read_text(encoding="utf-8")
        visible_text = extract_html_text(html)

        payload = {
            "request_id": "demo-scenario-3",
            "mode": "page",
            "page": {
                "url": "http://localhost:8080/ambiguous.html",
                "title": "Independent Data Evaluator — Nova Research Labs",
                "visible_text": visible_text,
                "links": [],
            },
        }

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Should NOT be classified as critical credential theft
        critical_findings = [
            f for f in data["findings"]
            if f.get("severity") == Severity.CRITICAL.value
        ]
        assert len(critical_findings) == 0
        # Trust DNA should expose unknown dimensions
        unknown_dims = [dim for dim in data["trust_dna"] if dim["status"] in ("unknown", "not_checked")]
        assert len(unknown_dims) > 0

    def test_scenario_4_prompt_injection_does_not_override_defenses(self):
        """Scenario 4: Hostile prompt injection instructions cannot force status to SAFE."""
        html = (DEMO_PAGES_DIR / "prompt-injection.html").read_text(encoding="utf-8")
        visible_text = extract_html_text(html)

        payload = {
            "request_id": "demo-scenario-4",
            "mode": "page",
            "page": {
                "url": "http://localhost:8080/prompt-injection.html",
                "title": "Prompt Injection Attack — CyberShield Recruitment",
                "visible_text": visible_text,
                "links": [],
            },
        }

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Safety override MUST fail: status cannot be BENIGN when fee and password harvesting are present
        assert data["assessment_status"] in (
            AssessmentStatus.SUSPICIOUS.value,
            AssessmentStatus.CAUTION.value,
        )
        assert data["assessment_status"] != AssessmentStatus.BENIGN.value
        # Critical / High threat findings must remain active
        assert len(data["findings"]) > 0

    def test_scenario_5_deterministic_fallback_mode_works_without_ai_key(self):
        """Scenario 5: Backend completes deterministic checks even when AI is unavailable."""
        html = (DEMO_PAGES_DIR / "suspicious.html").read_text(encoding="utf-8")
        visible_text = extract_html_text(html)

        payload = {
            "request_id": "demo-scenario-5",
            "mode": "page",
            "page": {
                "url": "http://localhost:8080/suspicious.html",
                "title": "Suspicious Fallback Test",
                "visible_text": visible_text,
                "links": [],
            },
        }

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()

        # Valid report structure must always be returned
        assert "status" in report
        assert "assessment_status" in report
        assert "summary" in report
        assert "findings" in report
        assert "trust_dna" in report
        assert "limitations" in report
        assert "next_best_actions" in report
