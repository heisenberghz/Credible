"""Tests for the ordered AI fallback chain."""

import pytest

from app.schemas.findings import CheckResult, CheckStatus, Confidence, Evidence, Severity
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData
from app.services.ai.mock_provider import MockAIProvider
from app.services.ai.service import (
    AIService,
    TIMEOUT_MESSAGE,
    UNCONFIGURED_MESSAGE,
    UNAVAILABLE_MESSAGE,
    get_runtime_status,
    reset_runtime_status,
)


def _request() -> AnalysisRequest:
    return AnalysisRequest(
        request_id="fallback-test",
        mode=AnalysisMode.PAGE,
        page=PageData(
            url="https://example.com/job",
            visible_text="Pay a ₹2000 registration fee to activate your account.",
        ),
    )


def _detected_check() -> CheckResult:
    return CheckResult(
        check_id="content.payment_pressure",
        status=CheckStatus.DETECTED,
        severity=Severity.HIGH,
        confidence=Confidence.HIGH,
        evidence=[
            Evidence(
                source="visible_text",
                excerpt="Pay a ₹2000 registration fee",
                reason="Upfront fee request",
            )
        ],
    )


class FailingProvider(MockAIProvider):
    provider_name = "primary-fails"

    def __init__(self, failure: str):
        super().__init__()
        self.failure = failure

    async def analyze(self, request, deterministic_checks):
        if self.failure == "timeout":
            raise TimeoutError("simulated timeout")
        raise RuntimeError("simulated outage")


class UnconfiguredProvider(MockAIProvider):
    provider_name = "unconfigured"

    def is_configured(self) -> bool:
        return False


class TestAIFallbackChain:
    @pytest.mark.asyncio
    async def test_secondary_provider_runs_when_primary_fails(self):
        service = AIService(
            providers=[FailingProvider("error"), MockAIProvider()]
        )

        output, limitations = await service.run_ai_analysis(_request(), [_detected_check()])

        assert output is not None
        assert len(output.findings) == 1
        assert any("fallback provider" in limitation.lower() for limitation in limitations)

    @pytest.mark.asyncio
    async def test_secondary_provider_runs_when_primary_times_out(self):
        service = AIService(
            providers=[FailingProvider("timeout"), MockAIProvider()]
        )

        output, limitations = await service.run_ai_analysis(_request(), [_detected_check()])

        assert output is not None
        assert any("timed out" in limitation.lower() for limitation in limitations)
        assert any("mock" in limitation.lower() for limitation in limitations)

    @pytest.mark.asyncio
    async def test_all_providers_failing_returns_one_unavailable_limitation(self):
        service = AIService(
            providers=[FailingProvider("error"), FailingProvider("error")]
        )

        output, limitations = await service.run_ai_analysis(_request(), [])

        assert output is None
        assert limitations == [UNAVAILABLE_MESSAGE]

    @pytest.mark.asyncio
    async def test_all_providers_timing_out_returns_timeout_limitation(self):
        service = AIService(
            providers=[FailingProvider("timeout"), FailingProvider("timeout")]
        )

        output, limitations = await service.run_ai_analysis(_request(), [])

        assert output is None
        assert limitations == [TIMEOUT_MESSAGE]

    @pytest.mark.asyncio
    async def test_no_configured_provider_returns_unconfigured_limitation(self):
        service = AIService(providers=[UnconfiguredProvider()])

        output, limitations = await service.run_ai_analysis(_request(), [])

        assert output is None
        assert limitations == [UNCONFIGURED_MESSAGE]

    @pytest.mark.asyncio
    async def test_unconfigured_primary_is_skipped(self):
        service = AIService(
            providers=[UnconfiguredProvider(), MockAIProvider()]
        )

        output, limitations = await service.run_ai_analysis(_request(), [_detected_check()])

        assert output is not None
        # No failure occurred, so there is no fallback warning.
        assert not any("fallback provider" in limitation.lower() for limitation in limitations)

    @pytest.mark.asyncio
    async def test_failure_marks_runtime_degraded(self):
        reset_runtime_status()
        service = AIService(providers=[FailingProvider("error")])

        output, _ = await service.run_ai_analysis(_request(), [])

        assert output is None
        status = get_runtime_status()
        assert status["degraded"] is True
        assert "primary-fails" in status["last_error"]

    @pytest.mark.asyncio
    async def test_success_clears_runtime_degradation(self):
        reset_runtime_status()
        service = AIService(providers=[MockAIProvider()])

        output, _ = await service.run_ai_analysis(_request(), [_detected_check()])

        assert output is not None
        status = get_runtime_status()
        assert status["degraded"] is False
        assert status["last_success_at"] is not None
