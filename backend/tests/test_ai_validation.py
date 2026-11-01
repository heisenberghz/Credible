"""Unit tests for AI output validation and failure fallback (Task 6)."""

import pytest

from app.schemas.findings import CheckResult, CheckStatus, Confidence, Severity
from app.schemas.reports import AssessmentStatus, TrustDnaStatus
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData
from app.services.ai.gemini import GeminiProvider
from app.services.ai.mock_provider import MockAIProvider
from app.services.ai.schemas import AIAnalysisOutput, AIDimensionAssessment, AIFinding
from app.services.ai.service import AIService
from app.services.ai.validator import is_quote_grounded, validate_and_filter_ai_output


class TestEvidenceGrounding:
    def test_exact_quote_grounded(self):
        text = "Candidates must deposit ₹2000 registration fee before interview."
        quote = "deposit ₹2000 registration fee"
        assert is_quote_grounded(quote, text) is True

    def test_case_insensitive_spacing_grounded(self):
        text = "Please submit your Resume and  Portfolio link."
        quote = "submit your resume and portfolio"
        assert is_quote_grounded(quote, text) is True

    def test_hallucinated_quote_not_grounded(self):
        text = "We are hiring junior engineers for our Bangalore office."
        hallucinated_quote = "Pay 500 dollars into our crypto account"
        assert is_quote_grounded(hallucinated_quote, text) is False

    def test_empty_quote_or_text(self):
        assert is_quote_grounded("", "some text") is False
        assert is_quote_grounded("quote", "") is False


class TestAIOutputValidationAndFiltering:
    def test_filter_removes_ungrounded_findings(self):
        original = "Selected applicants must pay ₹3000 registration fee."
        ai_output = AIAnalysisOutput(
            assessment_status=AssessmentStatus.SUSPICIOUS,
            summary="Threats identified.",
            findings=[
                AIFinding(
                    finding_type="payment_pressure",
                    severity=Severity.HIGH,
                    confidence=Confidence.HIGH,
                    evidence_quote="pay ₹3000 registration fee",
                    explanation="Upfront fee requested.",
                    recommended_action="Do not pay.",
                ),
                AIFinding(
                    finding_type="brand_impersonation",
                    severity=Severity.HIGH,
                    confidence=Confidence.HIGH,
                    evidence_quote="This company is definitely Microsoft Corporation Inc",  # Not in text!
                    explanation="Fake corporate identity.",
                    recommended_action="Verify employer.",
                ),
            ],
            dimension_assessments=[],
            unknowns=[],
            recommended_next_actions=[],
        )

        filtered, limitations = validate_and_filter_ai_output(
            ai_output,
            original_text=original,
            executed_check_ids=["content.payment_pressure"],
        )

        # Grounded finding preserved, ungrounded finding removed
        assert len(filtered.findings) == 1
        assert filtered.findings[0].finding_type == "payment_pressure"
        assert len(limitations) == 1
        assert "could not be verified" in limitations[0]


class TestAIServiceFallback:
    @pytest.mark.asyncio
    async def test_successful_analysis(self):
        mock_provider = MockAIProvider()
        service = AIService(provider=mock_provider)
        req = AnalysisRequest(
            request_id="test-val-1",
            mode=AnalysisMode.PAGE,
            page=PageData(url="https://example.com/apply", visible_text="Internship application"),
        )
        output, limitations = await service.run_ai_analysis(req, [])
        assert output is not None
        assert output.assessment_status in (AssessmentStatus.BENIGN, AssessmentStatus.SUSPICIOUS)

    @pytest.mark.asyncio
    async def test_timeout_fallback_does_not_crash(self):
        timeout_provider = MockAIProvider(should_timeout=True)
        service = AIService(provider=timeout_provider)
        req = AnalysisRequest(
            request_id="test-val-2",
            mode=AnalysisMode.PAGE,
            page=PageData(url="https://example.com/apply", visible_text="Internship application"),
        )
        output, limitations = await service.run_ai_analysis(req, [])
        # Gracefully returns None with limitation
        assert output is None
        assert len(limitations) == 1
        assert "timed out" in limitations[0].lower()

    @pytest.mark.asyncio
    async def test_provider_outage_fallback_does_not_crash(self):
        outage_provider = MockAIProvider(should_fail=True)
        service = AIService(provider=outage_provider)
        req = AnalysisRequest(
            request_id="test-val-3",
            mode=AnalysisMode.PAGE,
            page=PageData(url="https://example.com/apply", visible_text="Internship application"),
        )
        output, limitations = await service.run_ai_analysis(req, [])
        assert output is None
        assert len(limitations) == 1
        assert "unavailable" in limitations[0].lower()

    @pytest.mark.asyncio
    async def test_unconfigured_provider_fallback_does_not_crash(self):
        unconfigured_gemini = GeminiProvider(api_key="")
        service = AIService(provider=unconfigured_gemini)
        req = AnalysisRequest(
            request_id="test-val-4",
            mode=AnalysisMode.PAGE,
            page=PageData(url="https://example.com/apply", visible_text="Internship application"),
        )
        output, limitations = await service.run_ai_analysis(req, [])
        assert output is None
        assert len(limitations) == 1
        assert "not configured" in limitations[0].lower()

