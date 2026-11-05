"""Unit and regression tests for content and social-engineering checks (Task 4)."""

import json
from pathlib import Path
import pytest

from app.schemas.findings import CheckStatus, Severity
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData, SelectionData
from app.services.checks.content_checks import (
    CredentialPressureCheck,
    DataExposureCheck,
    PaymentPressureCheck,
    UnrealisticPromisesCheck,
    UrgencyCheck,
)
from app.services.checks.registry import CheckRegistry


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def make_page_text_req(text: str) -> AnalysisRequest:
    return AnalysisRequest(
        request_id="test-content-req",
        mode=AnalysisMode.PAGE,
        page=PageData(url="https://example.com/listing", visible_text=text),
    )


def make_sel_text_req(text: str) -> AnalysisRequest:
    return AnalysisRequest(
        request_id="test-sel-req",
        mode=AnalysisMode.SELECTION,
        selection=SelectionData(url="https://example.com/listing", text=text),
    )


class TestPaymentPressureCheck:
    def test_benign_text_no_fee(self):
        check = PaymentPressureCheck()
        req = make_page_text_req("Google is an equal opportunity employer. We never ask for payments or fees.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_negated_fee_statement_not_detected(self):
        check = PaymentPressureCheck()
        req = make_page_text_req(
            "We never ask contributors to pay any fee or deposit money to join."
        )
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_no_fee_is_not_required(self):
        check = PaymentPressureCheck()
        req = make_page_text_req("No registration fee is required and no deposit is needed.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_negated_fee_with_real_demand_still_detected(self):
        check = PaymentPressureCheck()
        req = make_page_text_req(
            "We never ask for a fee, but selected applicants must pay a $250 deposit."
        )
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED

    def test_upfront_fee_detected(self):
        check = PaymentPressureCheck()
        req = make_page_text_req("Selected interns must pay ₹3000 registration fee to reserve their seat.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED
        assert res.severity == Severity.HIGH
        assert len(res.evidence) >= 1

    def test_refundable_deposit_detected(self):
        check = PaymentPressureCheck()
        req = make_sel_text_req("Please transfer advance refundable deposit before joining.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED

    def test_crypto_wallet_payment_detected(self):
        check = PaymentPressureCheck()
        req = make_page_text_req("Send USDT payment to our crypto wallet to activate your workspace.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED


class TestUrgencyCheck:
    def test_benign_text_no_urgency(self):
        check = UrgencyCheck()
        req = make_page_text_req("Applications close at the end of next month. Take your time to review our handbook.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_limited_seats_urgency_detected(self):
        check = UrgencyCheck()
        req = make_page_text_req("Only 3 seats remaining! Act now or forfeit your seat immediately.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED
        assert res.severity == Severity.MEDIUM

    def test_time_limit_expires_in_hours_detected(self):
        check = UrgencyCheck()
        req = make_sel_text_req("This exclusive offer expires in 2 hours. Urgent response required.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED


class TestCredentialPressureCheck:
    def test_benign_text_no_credential_pressure(self):
        check = CredentialPressureCheck()
        req = make_page_text_req("Create an account on our careers portal to track your application status.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_password_demand_detected(self):
        check = CredentialPressureCheck()
        req = make_page_text_req("Enter your email password and OTP to verify your candidate identity.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED
        assert res.severity == Severity.CRITICAL


class TestDataExposureCheck:
    def test_benign_resume_submission(self):
        check = DataExposureCheck()
        req = make_page_text_req("Please submit your resume, GitHub profile, and portfolio link.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_identity_document_harvesting_detected(self):
        check = DataExposureCheck()
        req = make_page_text_req("Upload your Aadhaar card and PAN card details before the screening call.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED
        assert res.severity == Severity.HIGH

    def test_bank_details_harvesting_detected(self):
        check = DataExposureCheck()
        req = make_sel_text_req("Submit your bank account number and credit card details for verification.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED


class TestUnrealisticPromisesCheck:
    def test_benign_compensation_range(self):
        check = UnrealisticPromisesCheck()
        req = make_page_text_req("Expected compensation: $35/hour commensurate with experience.")
        res = check.run(req)
        assert res.status == CheckStatus.NOT_DETECTED

    def test_guaranteed_income_no_skills_detected(self):
        check = UnrealisticPromisesCheck()
        req = make_page_text_req("100% guaranteed placement! No skills required, earn ₹50,000 per day from home.")
        res = check.run(req)
        assert res.status == CheckStatus.DETECTED
        assert res.severity == Severity.MEDIUM


class TestRegressionFixtures:
    def test_benign_fixture_zero_false_positives(self):
        with open(FIXTURES_DIR / "benign.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        req = AnalysisRequest.model_validate(data)
        registry = CheckRegistry()
        results, tracker = registry.run_all(req)

        detected = [r for r in results if r.status == CheckStatus.DETECTED]
        assert len(detected) == 0, f"False positives detected on benign fixture: {[d.check_id for d in detected]}"

    def test_suspicious_fixture_detects_threats(self):
        with open(FIXTURES_DIR / "suspicious.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        req = AnalysisRequest.model_validate(data)
        registry = CheckRegistry()
        results, tracker = registry.run_all(req)

        detected_ids = {r.check_id for r in results if r.status == CheckStatus.DETECTED}
        expected_ids = set(data["expected"]["detected_checks"])

        # Ensure all expected threat signals are detected
        assert expected_ids.issubset(detected_ids), f"Missing detections: {expected_ids - detected_ids}"

    def test_ambiguous_fixture_no_false_alarms(self):
        with open(FIXTURES_DIR / "ambiguous.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        req = AnalysisRequest.model_validate(data)
        registry = CheckRegistry()
        results, _ = registry.run_all(req)

        detected = [r for r in results if r.status == CheckStatus.DETECTED]
        assert len(detected) == 0, f"False alarm on ambiguous fixture: {[d.check_id for d in detected]}"

    def test_empty_fixture_handles_gracefully(self):
        with open(FIXTURES_DIR / "empty.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        req = AnalysisRequest.model_validate(data)
        registry = CheckRegistry()
        results, tracker = registry.run_all(req)

        assert len(results) == 10  # 5 URL + 5 Content
        # Content checks should report UNAVAILABLE since text is empty
        content_results = [r for r in results if r.check_id.startswith("content.")]
        for r in content_results:
            assert r.status == CheckStatus.UNAVAILABLE

    def test_prompt_injection_cannot_bypass_deterministic_rules(self):
        with open(FIXTURES_DIR / "prompt_injection.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        req = AnalysisRequest.model_validate(data)
        registry = CheckRegistry()
        results, _ = registry.run_all(req)

        # The adversarial text tries to claim it is 100% safe, but our deterministic rules still catch it!
        detected_ids = {r.check_id for r in results if r.status == CheckStatus.DETECTED}
        assert "content.payment_pressure" in detected_ids
        assert "content.urgency" in detected_ids

