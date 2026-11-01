"""API and endpoint tests for Credible (Task 2)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.errors import ErrorCode


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_check_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "timestamp" in data


class TestAnalyzeEndpoint:
    def test_analyze_page_success(self, client):
        payload = {
            "request_id": "req-page-123",
            "mode": "page",
            "page": {
                "url": "https://example.com/careers/internship",
                "title": "Summer Internship Program",
                "visible_text": "Join our team. No experience needed. Pay ₹2000 registration fee.",
                "links": [
                    {"text": "Apply Now", "href": "https://example.com/apply"}
                ],
            },
            "client_context": {
                "extension_version": "0.1.0"
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()
        assert report["request_id"] == "req-page-123"
        assert report["status"] == "completed"
        assert report["mode"] == "page"
        assert report["analyzed_url"] == "https://example.com/careers/internship"
        assert len(report["trust_dna"]) == 6
        assert len(report["next_best_actions"]) > 0
        assert "limitations" in report
        assert response.headers.get("X-Request-ID") is not None

    def test_analyze_selection_success(self, client):
        payload = {
            "request_id": "req-sel-456",
            "mode": "selection",
            "selection": {
                "url": "https://company.org/listing",
                "text": "Deposit 500 dollars into our crypto wallet to activate your account."
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        report = response.json()
        assert report["request_id"] == "req-sel-456"
        assert report["mode"] == "selection"
        assert report["analyzed_url"] == "https://company.org/listing"

    def test_missing_page_in_page_mode_returns_422(self, client):
        payload = {
            "request_id": "req-bad-1",
            "mode": "page",
            "page": None
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 422
        err = response.json()
        assert "error" in err
        assert err["error"]["code"] in (ErrorCode.INVALID_REQUEST, "INVALID_REQUEST")
        assert "page" in err["error"]["message"].lower()

    def test_invalid_mode_returns_422(self, client):
        payload = {
            "request_id": "req-bad-2",
            "mode": "unsupported_mode",
            "page": {"url": "https://example.com", "visible_text": "text"}
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 422
        err = response.json()
        assert "error" in err

    def test_malformed_url_returns_400(self, client):
        payload = {
            "request_id": "req-bad-url",
            "mode": "page",
            "page": {
                "url": "not-a-valid-url",
                "visible_text": "Some text"
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 400
        err = response.json()
        assert err["error"]["code"] == ErrorCode.MALFORMED_URL

    def test_unsupported_url_scheme_returns_400(self, client):
        payload = {
            "request_id": "req-bad-scheme",
            "mode": "page",
            "page": {
                "url": "javascript:alert(1)",
                "visible_text": "Some text"
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 400
        err = response.json()
        assert err["error"]["code"] == ErrorCode.MALFORMED_URL
        assert "scheme" in err["error"]["message"]

    def test_empty_selection_text_returns_422(self, client):
        payload = {
            "request_id": "req-empty-sel",
            "mode": "selection",
            "selection": {
                "url": "https://example.com",
                "text": ""
            }
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 422

    def test_text_bounding_adds_limitation(self, client):
        # Oversized text gets bounded safely
        huge_text = "A" * 60000
        payload = {
            "request_id": "req-oversized",
            "mode": "page",
            "page": {
                "url": "https://example.com/long",
                "visible_text": huge_text
            }
        }
        # In Pydantic schema, max_length for visible_text is 50000
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 422
        err = response.json()
        assert err["error"]["code"] == ErrorCode.PAYLOAD_TOO_LARGE

    def test_safe_error_response_no_stack_trace(self, client):
        # Send non-JSON body to trigger invalid request
        response = client.post(
            "/api/v1/analyze",
            content="not a json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
        err = response.json()
        assert "error" in err
        # Ensure no tracebacks or internal paths leak
        assert "Traceback" not in response.text
        assert "d:\\credible pro" not in response.text.lower()

