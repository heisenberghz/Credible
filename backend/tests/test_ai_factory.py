"""Provider factory and AI status endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from app.api.routes import ai as ai_route
from app.core.config import provider_order_from_settings, settings
from app.main import app
from app.services.ai.factory import PROVIDER_CLASSES, build_ai_providers, first_configured_provider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.mock_provider import MockAIProvider
from app.services.ai.service import reset_runtime_status


class TestProviderOrder:
    def test_auto_mode_uses_configured_order(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["gemini"])

        providers = build_ai_providers()

        assert [p.provider_name for p in providers] == ["gemini"]

    def test_explicit_provider_overrides_chain(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["not-a-provider", "gemini"])

        assert provider_order_from_settings() == ["gemini"]
        assert [p.provider_name for p in build_ai_providers()] == ["gemini"]

    def test_disabled_mode_has_no_providers(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "disabled")

        assert provider_order_from_settings() == []
        assert build_ai_providers() == []

    def test_unknown_provider_is_ignored(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["not-a-provider", "gemini"])

        providers = build_ai_providers()

        assert [p.provider_name for p in providers] == ["gemini"]

    def test_duplicate_provider_names_are_deduplicated(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["gemini", "gemini"])

        assert provider_order_from_settings() == ["gemini"]

    def test_only_gemini_is_registered(self):
        assert set(PROVIDER_CLASSES) == {"gemini"}

    def test_first_configured_provider_skips_unconfigured(self):
        providers = [GeminiProvider(api_key=""), MockAIProvider()]

        active = first_configured_provider(providers)

        assert active is not None
        assert active.provider_name == "mock"

    def test_provider_instances_expose_models(self):
        assert GeminiProvider(api_key="").model_name


class TestAIStatusEndpoint:
    @pytest.fixture(autouse=True)
    def _reset_runtime(self):
        reset_runtime_status()
        yield
        reset_runtime_status()

    def test_status_reports_deterministic_mode_without_keys(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["gemini"])
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

        response = TestClient(app).get("/api/v1/ai/status")

        assert response.status_code == 200
        data = response.json()
        assert data["ai_enabled"] is False
        assert data["mode"] == "deterministic_only"
        assert data["active_provider"] is None
        assert data["provider_order"] == ["gemini"]
        assert len(data["providers"]) == 1
        assert data["providers"][0]["name"] == "gemini"
        assert data["providers"][0]["configured"] is False
        assert data["degraded"] is False

    def test_status_reports_configured_provider_without_leaking_key(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["gemini"])
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIza-test-only-not-a-real-key")

        response = TestClient(app).get("/api/v1/ai/status")
        data = response.json()

        assert data["ai_enabled"] is True
        assert data["mode"] == "ai_assisted"
        assert data["active_provider"] == "gemini"
        assert data["provider_order"] == ["gemini"]
        assert data["providers"][0]["configured"] is True
        assert data["providers"][0]["role"] == "primary"
        assert "AIza-test-only-not-a-real-key" not in response.text

    def test_status_exposes_degraded_runtime_state(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "AI_PROVIDER_ORDER", ["gemini"])
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIza-test-only-not-a-real-key")
        monkeypatch.setattr(
            ai_route,
            "get_runtime_status",
            lambda: {
                "degraded": True,
                "last_error": "gemini: 503 UNAVAILABLE",
                "last_error_at": None,
                "last_success_at": None,
            },
        )

        data = TestClient(app).get("/api/v1/ai/status").json()

        assert data["degraded"] is True
        assert data["last_error"] == "gemini: 503 UNAVAILABLE"

    def test_health_includes_ai_summary(self, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "disabled")

        response = TestClient(app).get("/health")
        data = response.json()

        assert response.status_code == 200
        assert data["ai"]["enabled"] is False
        assert data["ai"]["mode"] == "deterministic_only"
        assert data["ai"]["degraded"] is False
