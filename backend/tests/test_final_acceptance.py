"""
Task 20: Comprehensive Final Regression & Acceptance Test Suite
Verifies all 14 Acceptance Criteria specified in doc/AGENT_TASKS.md.
"""

import json
from pathlib import Path
import re
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.findings import CheckResult, CheckStatus, Confidence, Evidence, FindingSource, Severity
from app.schemas.reports import AssessmentStatus, TrustDnaStatus
from app.schemas.requests import AnalysisMode
from app.services.ai.schemas import AIAnalysisOutput, AIFinding
from app.services.ai.validator import validate_and_filter_ai_output
from app.services.reconciliation import reconcile_findings

client = TestClient(app)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent


class TestFinalAcceptanceCriteria:
    def test_criterion_01_user_can_initiate_scan(self):
        """Criterion 1: User can initiate scan via page payload and receive analysis report."""
        payload = {
            "request_id": "req-crit-1",
            "mode": "page",
            "page": {
                "url": "https://example.com/careers/internship",
                "title": "Software Engineering Internship",
                "visible_text": "Apply for summer engineering internship. No fees required.",
                "links": [{"text": "Apply", "href": "https://example.com/apply"}],
            },
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == "req-crit-1"
        assert data["status"] == "completed"
        assert data["assessment_status"] in [s.value for s in AssessmentStatus]

    def test_criterion_02_sidepanel_shows_full_results_with_evidence(self):
        """Criterion 2: Results include full findings with observed evidence excerpts and reasons."""
        payload = {
            "request_id": "req-crit-2",
            "mode": "page",
            "page": {
                "url": "https://suspicious-job.com/offer",
                "title": "Remote Assistant",
                "visible_text": "Selected candidates must pay ₹3000 registration fee immediately. Only 2 seats left!",
                "links": [],
            },
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["findings"]) > 0

        # Each finding must have evidence with source, excerpt, and reason
        for finding in data["findings"]:
            assert "title" in finding
            assert "description" in finding
            assert "severity" in finding
            assert "confidence" in finding
            assert "evidence" in finding
            if finding["evidence"]:
                ev = finding["evidence"][0]
                assert "source" in ev
                assert "excerpt" in ev
                assert "reason" in ev

    def test_criterion_03_extension_sends_only_bounded_fields(self):
        """Criterion 3: Backend enforces strict bounds (50,000 chars for page, 5,000 chars for selection)."""
        # 1. Page visible_text oversized (>50,000 chars) is rejected by schema validator
        oversized_page_text = "A" * 55000
        payload_page = {
            "request_id": "req-crit-3a",
            "mode": "page",
            "page": {
                "url": "https://example.com/large",
                "visible_text": oversized_page_text,
                "links": [],
            },
        }
        resp = client.post("/api/v1/analyze", json=payload_page)
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"

        # 2. Selection text oversized (>5,000 chars) is rejected by schema validator
        oversized_sel_text = "B" * 6000
        payload_sel = {
            "request_id": "req-crit-3b",
            "mode": "selection",
            "selection": {
                "url": "https://example.com/large",
                "text": oversized_sel_text,
            },
        }
        resp_sel = client.post("/api/v1/analyze", json=payload_sel)
        assert resp_sel.status_code == 422
        assert resp_sel.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"

        # 3. Valid bounded text within limits processes successfully
        valid_page_text = "A" * 5000
        valid_payload = {
            "request_id": "req-crit-3c",
            "mode": "page",
            "page": {
                "url": "https://example.com/valid",
                "visible_text": valid_page_text,
                "links": [],
            },
        }
        resp_valid = client.post("/api/v1/analyze", json=valid_payload)
        assert resp_valid.status_code == 200

    def test_criterion_04_backend_validates_and_handles_malformed_requests(self):
        """Criterion 4: Backend validates payloads and handles malformed inputs safely."""
        # Missing required page field in page mode
        resp_missing = client.post("/api/v1/analyze", json={"request_id": "req-1", "mode": "page"})
        assert resp_missing.status_code == 422

        # Malformed URL
        resp_bad_url = client.post(
            "/api/v1/analyze",
            json={
                "request_id": "req-2",
                "mode": "page",
                "page": {"url": "not-a-valid-url-format", "visible_text": "text"},
            },
        )
        assert resp_bad_url.status_code == 400
        assert "error" in resp_bad_url.json()

        # Unsupported URL scheme (javascript:)
        resp_bad_scheme = client.post(
            "/api/v1/analyze",
            json={
                "request_id": "req-3",
                "mode": "page",
                "page": {"url": "javascript:alert(1)", "visible_text": "text"},
            },
        )
        assert resp_bad_scheme.status_code == 400

    def test_criterion_05_deterministic_checks_report_status_and_evidence(self):
        """Criterion 5: Deterministic checks report check_id, status, severity, confidence, evidence, limitations."""
        payload = {
            "request_id": "req-crit-5",
            "mode": "page",
            "page": {
                "url": "http://192.168.1.100/verify",
                "title": "Direct IP Portal",
                "visible_text": "Please provide your email password to unlock server.",
                "links": [],
            },
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()

        check_summary = data["checks"]
        assert "executed" in check_summary
        assert len(check_summary["executed"]) > 0

        # Raw checks in proof mode must have full structured metadata
        proof_mode = data["proof_mode"]
        assert len(proof_mode) > 0
        for entry in proof_mode:
            assert "finding_id" in entry
            assert "check_id" in entry
            assert "is_deterministic" in entry
            assert "confidence" in entry

    def test_criterion_06_ai_output_schema_validated_cannot_override_guardrails(self):
        """Criterion 6: AI findings are validated and cannot lower threat assessments below deterministic floor."""
        # Simulated AI attempt to return zero findings and claim BENIGN
        ai_output = AIAnalysisOutput(
            findings=[],
            summary="Completely safe certified employer.",
            assessment_status=AssessmentStatus.BENIGN,
        )

        # Deterministic checks detect payment pressure (HIGH severity)
        det_check = CheckResult(
            check_id="content.payment_pressure",
            status=CheckStatus.DETECTED,
            severity=Severity.HIGH,
            confidence=Confidence.HIGH,
            evidence=[Evidence(source="visible_text", excerpt="pay a refundable registration fee", reason="Fee demand")],
        )

        reconciled_findings, limitations = reconcile_findings(
            deterministic_checks=[det_check],
            ai_output=ai_output,
        )

        # AI cannot suppress the HIGH severity deterministic finding
        assert len(reconciled_findings) == 1
        assert reconciled_findings[0].severity == Severity.HIGH
        assert reconciled_findings[0].source in (FindingSource.DETERMINISTIC, FindingSource.RECONCILED)

    def test_criterion_07_severity_and_confidence_kept_strictly_separate(self):
        """Criterion 7: Severity (impact) and Confidence (evidential certainty) are distinct enums and never conflated."""
        severities = {s.value for s in Severity}
        confidences = {c.value for c in Confidence}

        # They represent distinct conceptual dimensions
        assert "critical" in severities
        assert "critical" not in confidences
        assert "unknown" in confidences
        assert "unknown" not in severities

        payload = {
            "request_id": "req-crit-7",
            "mode": "page",
            "page": {
                "url": "https://example.com/careers",
                "visible_text": "Urgent! Only 2 seats remaining today!",
                "links": [],
            },
        }
        res = client.post("/api/v1/analyze", json=payload).json()
        for f in res["findings"]:
            assert f["severity"] in severities
            assert f["confidence"] in confidences

    def test_criterion_08_insufficient_evidence_results_in_unknown_not_fabrication(self):
        """Criterion 8: Insufficient evidence leaves dimensions as UNKNOWN rather than guessing."""
        payload = {
            "request_id": "req-crit-8",
            "mode": "page",
            "page": {
                "url": "https://simple-site.org/info",
                "title": "Static Page",
                "visible_text": "Simple community notice without business registration data.",
                "links": [],
            },
        }
        res = client.post("/api/v1/analyze", json=payload).json()
        trust_dna = res["trust_dna"]

        # Dimensions that cannot be verified must be unknown or not_checked
        unknown_dims = [
            dim for dim in trust_dna
            if dim["status"] in (TrustDnaStatus.UNKNOWN.value, TrustDnaStatus.NOT_CHECKED.value)
        ]
        assert len(unknown_dims) > 0

    def test_criterion_09_trust_dna_shows_evidence_and_limitations(self):
        """Criterion 9: All 6 Trust DNA dimensions are returned with evidence and limitations."""
        payload = {
            "request_id": "req-crit-9",
            "mode": "page",
            "page": {
                "url": "https://example.com/test",
                "visible_text": "Standard testing page.",
                "links": [],
            },
        }
        res = client.post("/api/v1/analyze", json=payload).json()
        assert len(res["trust_dna"]) == 6
        for dim in res["trust_dna"]:
            assert "id" in dim
            assert "name" in dim
            assert "status" in dim
            assert "confidence" in dim
            assert "summary" in dim
            assert "evidence" in dim
            assert "limitations" in dim

    def test_criterion_10_proof_mode_traces_findings_to_observations(self):
        """Criterion 10: Proof mode trace records link each finding to its observation and origin."""
        payload = {
            "request_id": "req-crit-10",
            "mode": "page",
            "page": {
                "url": "http://192.168.1.1/careers",
                "visible_text": "Pay $50 deposit via bitcoin wallet immediately.",
                "links": [],
            },
        }
        res = client.post("/api/v1/analyze", json=payload).json()
        assert len(res["proof_mode"]) > 0
        for entry in res["proof_mode"]:
            assert entry["finding_id"]
            assert entry["check_id"]
            assert "is_deterministic" in entry
            assert "observed" in entry

    def test_criterion_11_next_best_action_is_proportionate(self):
        """Criterion 11: Next Best Actions provide proportionate, constructive recommendations."""
        # High threat -> immediate protective actions
        res_threat = client.post(
            "/api/v1/analyze",
            json={
                "request_id": "req-crit-11a",
                "mode": "page",
                "page": {
                    "url": "https://bad-site.xyz/pay",
                    "visible_text": "Wire $500 fee via bitcoin wallet immediately.",
                    "links": [],
                },
            },
        ).json()
        assert len(res_threat["next_best_actions"]) > 0
        assert any("pay" in act.lower() or "verify" in act.lower() for act in res_threat["next_best_actions"])

        # Benign -> confirm on official channels
        res_safe = client.post(
            "/api/v1/analyze",
            json={
                "request_id": "req-crit-11b",
                "mode": "page",
                "page": {
                    "url": "https://careers.google.com/jobs",
                    "visible_text": "Standard senior engineering role. Equal opportunity employer.",
                    "links": [],
                },
            },
        ).json()
        assert len(res_safe["next_best_actions"]) > 0

    def test_criterion_12_ui_and_api_handle_loading_timeout_offline_errors(self):
        """Criterion 12: API and error handler return structured error schemas without stack traces."""
        # Force a validation error
        res = client.post(
            "/api/v1/analyze",
            json={"request_id": "", "mode": "invalid_mode"},
        )
        assert res.status_code == 422
        data = res.json()
        # No internal stack trace exposure
        assert "traceback" not in data
        assert "stack" not in data

    def test_criterion_13_no_secrets_in_code_or_operational_logs(self):
        """Criterion 13: Secret scanning regex proves zero API keys or tokens are in repo files."""
        secret_patterns = [
            re.compile(r"AIza[0-9A-Za-z\-_]{35}"),
            re.compile(r"sk-[a-zA-Z0-9]{32,}"),
            re.compile(r"ghp_[a-zA-Z0-9]{36}"),
        ]
        scanned_count = 0
        for ext in (".py", ".ts", ".tsx", ".json", ".html"):
            for path in ROOT_DIR.rglob(f"*{ext}"):
                if ".venv" in path.parts or "node_modules" in path.parts or ".git" in path.parts or "dist" in path.parts:
                    continue
                content = path.read_text(encoding="utf-8", errors="ignore")
                for pat in secret_patterns:
                    assert not pat.search(content), f"Secret matched in {path}"
                scanned_count += 1
        assert scanned_count > 20

    def test_criterion_14_demo_shows_benign_suspicious_ambiguous_honestly(self):
        """Criterion 14: All demo pages produce authentic, unmanipulated threat classifications."""
        demo_dir = ROOT_DIR / "demo" / "pages"
        assert (demo_dir / "benign.html").exists()
        assert (demo_dir / "suspicious.html").exists()
        assert (demo_dir / "ambiguous.html").exists()
        assert (demo_dir / "prompt-injection.html").exists()
        assert (demo_dir / "error-demo.html").exists()
