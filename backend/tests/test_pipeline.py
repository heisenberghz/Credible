"""End-to-end analysis pipeline integration tests (Task 9)."""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.reports import AssessmentStatus, TrustDnaStatus


FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def client():
    return TestClient(app)


class TestFullAnalysisPipeline:
    def test_benign_fixture_full_pipeline(self, client):
        with open(FIXTURES_DIR / "benign.json", "r", encoding="utf-8") as f:
            payload = json.load(f)

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()

        assert report["request_id"] == payload["request_id"]
        assert report["assessment_status"] == AssessmentStatus.BENIGN.value
        assert len(report["findings"]) == 0
        assert len(report["trust_dna"]) == 6
        assert len(report["next_best_actions"]) > 0
        assert len(report["checks"]["executed"]) == 10
        assert len(report["limitations"]) > 0

    def test_suspicious_fixture_full_pipeline(self, client):
        with open(FIXTURES_DIR / "suspicious.json", "r", encoding="utf-8") as f:
            payload = json.load(f)

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()

        assert report["request_id"] == payload["request_id"]
        assert report["assessment_status"] == AssessmentStatus.SUSPICIOUS.value
        assert len(report["findings"]) >= 4

        finding_ids = {f["id"] for f in report["findings"]}
        assert "content-payment_pressure" in finding_ids
        assert "content-urgency" in finding_ids
        assert "url-lookalike" in finding_ids

        # Proof mode must match findings count
        assert len(report["proof_mode"]) == len(report["findings"])
        first_proof = report["proof_mode"][0]
        assert "observed" in first_proof
        assert "why_it_matters" in first_proof
        assert first_proof["is_deterministic"] is True

        # Trust DNA must reflect concerns
        dna_map = {d["id"]: d for d in report["trust_dna"]}
        assert dna_map["payment_risk"]["status"] == TrustDnaStatus.WARNING_FOUND.value
        assert dna_map["identity_risk"]["status"] == TrustDnaStatus.WARNING_FOUND.value

        # Next Best Actions must prioritize payment guidance
        assert any("fee" in a.lower() or "money" in a.lower() for a in report["next_best_actions"])

    def test_ambiguous_fixture_full_pipeline(self, client):
        with open(FIXTURES_DIR / "ambiguous.json", "r", encoding="utf-8") as f:
            payload = json.load(f)

        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()

        assert report["assessment_status"] in (AssessmentStatus.BENIGN.value, AssessmentStatus.CAUTION.value)
        # No severe false positive findings
        assert not any(f["severity"] in ("critical", "high") for f in report["findings"])

    def test_selection_mode_full_pipeline(self, client):
        payload = {
            "request_id": "test-pipe-sel",
            "mode": "selection",
            "selection": {
                "url": "https://example.com/gig",
                "text": "Transfer ₹1500 refundable security deposit to reserve your internship seat."
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()

        assert report["mode"] == "selection"
        assert report["assessment_status"] == AssessmentStatus.SUSPICIOUS.value
        assert len(report["findings"]) >= 1
        assert report["findings"][0]["id"] == "content-payment_pressure"
        assert report["findings"][0]["evidence"][0]["source"] == "selection"

