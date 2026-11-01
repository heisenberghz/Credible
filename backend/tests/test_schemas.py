"""Unit tests for backend Pydantic schemas (Task 1)."""

import pytest
from pydantic import ValidationError

from app.schemas.errors import ErrorCode, ErrorDetail, ErrorResponse
from app.schemas.findings import (
    CheckResult,
    CheckStatus,
    Confidence,
    Evidence,
    Finding,
    FindingSource,
    Severity,
)
from app.schemas.requests import (
    AnalysisMode,
    AnalysisRequest,
    ClientContext,
    LinkItem,
    PageData,
    SelectionData,
)
from app.schemas.reports import (
    AnalysisReport,
    AssessmentStatus,
    ExecutedChecksSummary,
    ProofModeEntry,
    TrustDnaDimension,
    TrustDnaStatus,
)


class TestRequestSchemas:
    def test_valid_page_request(self):
        req = AnalysisRequest(
            request_id="test-req-123",
            mode=AnalysisMode.PAGE,
            page=PageData(
                url="https://example.com/internship",
                title="Summer Internship Offer",
                visible_text="We offer a summer internship with a registration fee.",
                links=[LinkItem(text="Apply", href="https://example.com/apply")],
            ),
            client_context=ClientContext(extension_version="0.1.0"),
        )
        assert req.request_id == "test-req-123"
        assert req.mode == AnalysisMode.PAGE
        assert req.page.url == "https://example.com/internship"
        assert len(req.page.links) == 1

        # Test json roundtrip
        json_data = req.model_dump_json()
        restored = AnalysisRequest.model_validate_json(json_data)
        assert restored.request_id == req.request_id
        assert restored.page.url == req.page.url

    def test_valid_selection_request(self):
        req = AnalysisRequest(
            request_id="test-sel-456",
            mode=AnalysisMode.SELECTION,
            selection=SelectionData(
                url="https://example.com/job",
                text="Pay ₹5000 registration fee to reserve your seat immediately.",
            ),
        )
        assert req.mode == AnalysisMode.SELECTION
        assert req.selection.text.startswith("Pay ₹5000")

        # Test json roundtrip
        json_data = req.model_dump_json()
        restored = AnalysisRequest.model_validate_json(json_data)
        assert restored.selection.text == req.selection.text

    def test_missing_page_in_page_mode_raises(self):
        with pytest.raises(ValidationError) as exc:
            AnalysisRequest(
                request_id="bad-1",
                mode=AnalysisMode.PAGE,
                page=None,
            )
        assert "page" in str(exc.value)

    def test_missing_selection_in_selection_mode_raises(self):
        with pytest.raises(ValidationError) as exc:
            AnalysisRequest(
                request_id="bad-2",
                mode=AnalysisMode.SELECTION,
                selection=None,
            )
        assert "selection" in str(exc.value)

    def test_empty_selection_text_raises(self):
        with pytest.raises(ValidationError):
            SelectionData(url="https://example.com", text="")


class TestFindingAndCheckSchemas:
    def test_evidence_and_finding(self):
        ev = Evidence(
            source="visible_text",
            excerpt="Pay ₹5000 upfront fee",
            reason="Upfront fee requests for jobs create financial risk",
        )
        finding = Finding(
            id="payment-pressure-1",
            title="Upfront registration fee requested",
            description="The listing requires payment before beginning work.",
            severity=Severity.HIGH,
            confidence=Confidence.HIGH,
            status=CheckStatus.DETECTED,
            evidence=[ev],
            check_id="content.payment_pressure",
            source=FindingSource.DETERMINISTIC,
            limitations=["This signal alone does not prove fraud."],
            recommended_action="Do not pay until employer credentials are verified.",
        )
        assert finding.severity == Severity.HIGH
        assert finding.confidence == Confidence.HIGH
        assert finding.status == CheckStatus.DETECTED

        json_data = finding.model_dump_json()
        restored = Finding.model_validate_json(json_data)
        assert restored.id == finding.id
        assert restored.evidence[0].excerpt == ev.excerpt

    def test_check_result(self):
        cr = CheckResult(
            check_id="url.ip_host",
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=["Domain was an alphanumeric hostname."],
        )
        assert cr.status == CheckStatus.NOT_DETECTED


class TestReportSchemas:
    def test_full_analysis_report(self):
        report = AnalysisReport(
            request_id="rep-789",
            status="completed",
            assessment_status=AssessmentStatus.NEEDS_VERIFICATION,
            summary="Upfront payment request requires independent verification.",
            analyzed_url="https://example.com/apply",
            mode=AnalysisMode.PAGE,
            findings=[
                Finding(
                    id="find-1",
                    title="Upfront payment",
                    description="Fee required.",
                    severity=Severity.HIGH,
                    confidence=Confidence.HIGH,
                    status=CheckStatus.DETECTED,
                    evidence=[
                        Evidence(
                            source="visible_text",
                            excerpt="Pay ₹5000",
                            reason="Financial risk indicator",
                        )
                    ],
                )
            ],
            trust_dna=[
                TrustDnaDimension(
                    id="credential_payment",
                    name="Credential and Payment Pressure",
                    status=TrustDnaStatus.CONCERN,
                    confidence=Confidence.HIGH,
                    summary="Explicit fee request detected.",
                    evidence=[
                        Evidence(
                            source="visible_text",
                            excerpt="Pay ₹5000",
                            reason="Financial risk",
                        )
                    ],
                    limitations=[],
                ),
                TrustDnaDimension(
                    id="identity_domain",
                    name="Identity and Domain Signals",
                    status=TrustDnaStatus.UNKNOWN,
                    confidence=Confidence.LOW,
                    summary="No independent verification performed.",
                    evidence=[],
                    limitations=["Third-party registry checks not run."],
                ),
            ],
            proof_mode=[
                ProofModeEntry(
                    finding_id="find-1",
                    title="Upfront payment",
                    observed="Pay ₹5000",
                    location="visible_text",
                    why_it_matters="Paying an unverified party creates financial risk.",
                    check_id="content.payment_pressure",
                    is_deterministic=True,
                    confidence=Confidence.HIGH,
                    limitations=[],
                )
            ],
            next_best_actions=[
                "Pause before sending any money.",
                "Verify the opportunity via official employer website.",
            ],
            checks=ExecutedChecksSummary(
                executed=["content.payment_pressure", "url.ip_host"],
                not_executed=["external.whois"],
            ),
            limitations=[
                "This assessment does not prove fraud or guarantee safety.",
            ],
        )

        assert report.assessment_status == AssessmentStatus.NEEDS_VERIFICATION
        assert len(report.trust_dna) == 2
        assert len(report.proof_mode) == 1
        assert len(report.next_best_actions) == 2

        # Roundtrip JSON test
        json_data = report.model_dump_json()
        restored = AnalysisReport.model_validate_json(json_data)
        assert restored.request_id == report.request_id
        assert restored.assessment_status == AssessmentStatus.NEEDS_VERIFICATION
        assert restored.trust_dna[0].status == TrustDnaStatus.CONCERN


class TestErrorSchemas:
    def test_error_response(self):
        err = ErrorResponse(
            error=ErrorDetail(
                code=ErrorCode.MALFORMED_URL,
                message="The provided URL is invalid.",
                field="page.url",
            ),
            request_id="err-req-001",
        )
        assert err.error.code == ErrorCode.MALFORMED_URL
        assert err.error.field == "page.url"

        json_data = err.model_dump_json()
        restored = ErrorResponse.model_validate_json(json_data)
        assert restored.error.code == ErrorCode.MALFORMED_URL

