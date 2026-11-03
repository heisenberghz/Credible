"""CORS coverage for browser and Chrome extension origins."""

from fastapi.testclient import TestClient

from app.main import app


CHROME_EXTENSION_ORIGIN = "chrome-extension://" + ("a" * 32)


class TestCors:
    def test_chrome_extension_preflight_is_allowed_by_regex(self):
        response = TestClient(app).options(
            "/api/v1/analyze",
            headers={
                "Origin": CHROME_EXTENSION_ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == CHROME_EXTENSION_ORIGIN

    def test_localhost_dev_origin_is_allowed(self):
        response = TestClient(app).options(
            "/api/v1/analyze",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

    def test_unrelated_origin_is_not_allowed(self):
        response = TestClient(app).options(
            "/api/v1/analyze",
            headers={
                "Origin": "https://evil.example.com",
                "Access-Control-Request-Method": "POST",
            },
        )

        assert response.headers.get("access-control-allow-origin") != "https://evil.example.com"
