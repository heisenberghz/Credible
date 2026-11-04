"""Tests for the validated AI result cache."""

from typing import List, Optional

import pytest

from app.schemas.findings import CheckResult
from app.schemas.reports import AssessmentStatus
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData
from app.services.ai.base import AIProvider
from app.services.ai.cache import AIResultCache
from app.services.ai.gemini import GeminiProvider
from app.services.ai.schemas import AIAnalysisOutput
from app.services.ai.service import AIService, reset_runtime_status


def make_output(summary: str = "Cached AI summary.") -> AIAnalysisOutput:
    return AIAnalysisOutput(
        assessment_status=AssessmentStatus.SUSPICIOUS,
        summary=summary,
        findings=[],
    )


def make_request(text: str = "Pay a registration fee immediately.") -> AnalysisRequest:
    return AnalysisRequest(
        request_id="cache-test",
        mode=AnalysisMode.PAGE,
        page=PageData(url="https://example.com/job", visible_text=text),
    )


class CountingProvider(AIProvider):
    """Deterministic provider that counts how often the live path is used."""

    provider_name = "counting"
    model_name = "test-model"

    def __init__(
        self,
        output: Optional[AIAnalysisOutput] = None,
        fail_times: int = 0,
        fingerprint: Optional[str] = "fixed-fingerprint",
    ):
        self.output = output or make_output()
        self.fail_times = fail_times
        self.fingerprint = fingerprint
        self.calls = 0

    def is_configured(self) -> bool:
        return True

    def cache_fingerprint(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> Optional[str]:
        return self.fingerprint

    async def analyze(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> AIAnalysisOutput:
        self.calls += 1
        if self.calls <= self.fail_times:
            raise RuntimeError("temporary provider failure")
        return self.output.model_copy(deep=True)


@pytest.fixture(autouse=True)
def clear_runtime_status():
    reset_runtime_status()
    yield
    reset_runtime_status()


class TestAIResultCache:
    def test_ttl_expiry_forces_a_miss(self):
        now = [1000.0]
        cache = AIResultCache(ttl_seconds=10, max_entries=8, clock=lambda: now[0])
        cache.set("key", make_output(), ["limit"])

        assert cache.get("key") is not None

        now[0] += 11
        assert cache.get("key") is None

    def test_lru_eviction_drops_oldest_entry(self):
        cache = AIResultCache(ttl_seconds=60, max_entries=2)
        cache.set("a", make_output("A"), [])
        cache.set("b", make_output("B"), [])

        # Touch "a" so "b" becomes the least recently used entry.
        assert cache.get("a") is not None
        cache.set("c", make_output("C"), [])

        assert cache.get("a") is not None
        assert cache.get("b") is None
        assert cache.get("c") is not None

    def test_returned_values_are_deep_copies(self):
        cache = AIResultCache(ttl_seconds=60, max_entries=2)
        cache.set("key", make_output("original"), ["original limitation"])

        first_output, first_limitations = cache.get("key")
        first_output.summary = "mutated"
        first_limitations.append("mutated limitation")

        second_output, second_limitations = cache.get("key")
        assert second_output.summary == "original"
        assert second_limitations == ["original limitation"]

    def test_disabled_cache_is_a_noop(self):
        cache = AIResultCache(ttl_seconds=60, max_entries=8, enabled=False)
        cache.set("key", make_output(), [])

        assert cache.get("key") is None
        assert cache.stats()["entries"] == 0


class TestAIServiceCacheIntegration:
    @pytest.mark.asyncio
    async def test_second_identical_call_does_not_hit_provider(self):
        provider = CountingProvider()
        service = AIService(provider=provider, cache=AIResultCache(ttl_seconds=60))
        request = make_request()

        first_output, _ = await service.run_ai_analysis(request, [])
        second_output, _ = await service.run_ai_analysis(request, [])

        assert provider.calls == 1
        assert first_output is not None
        assert second_output is not None
        assert second_output is not first_output
        assert second_output.summary == first_output.summary
        assert service.cache.stats()["hits"] == 1

    @pytest.mark.asyncio
    async def test_disabled_cache_calls_provider_each_time(self):
        provider = CountingProvider()
        service = AIService(
            provider=provider,
            cache=AIResultCache(ttl_seconds=60, enabled=False),
        )
        request = make_request()

        await service.run_ai_analysis(request, [])
        await service.run_ai_analysis(request, [])

        assert provider.calls == 2

    @pytest.mark.asyncio
    async def test_failed_call_is_not_cached(self):
        provider = CountingProvider(fail_times=1)
        service = AIService(provider=provider, cache=AIResultCache(ttl_seconds=60))
        request = make_request()

        failed_output, failed_limitations = await service.run_ai_analysis(request, [])
        retry_output, _ = await service.run_ai_analysis(request, [])

        assert failed_output is None
        assert failed_limitations
        assert retry_output is not None
        assert provider.calls == 2

    @pytest.mark.asyncio
    async def test_provider_without_fingerprint_is_never_cached(self):
        provider = CountingProvider(fingerprint=None)
        service = AIService(provider=provider, cache=AIResultCache(ttl_seconds=60))
        request = make_request()

        await service.run_ai_analysis(request, [])
        await service.run_ai_analysis(request, [])

        assert provider.calls == 2
        assert service.cache.stats()["entries"] == 0


class TestGeminiCacheFingerprint:
    def test_same_content_and_model_produce_the_same_key(self):
        provider = GeminiProvider(api_key="fake-key", model_name="gemini-test")
        request = make_request()

        first = provider.cache_fingerprint(request, [])
        second = provider.cache_fingerprint(request, [])

        assert first is not None
        assert first == second

    def test_changed_content_or_model_produces_a_different_key(self):
        provider = GeminiProvider(api_key="fake-key", model_name="gemini-test")
        other_model = GeminiProvider(api_key="fake-key", model_name="gemini-other")

        first = provider.cache_fingerprint(make_request("Pay 2000 INR now."), [])
        changed_text = provider.cache_fingerprint(make_request("No payment required."), [])
        changed_model = other_model.cache_fingerprint(make_request("Pay 2000 INR now."), [])

        assert first != changed_text
        assert first != changed_model
