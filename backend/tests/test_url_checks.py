"""Unit tests for URL and Hostname checks (Task 3)."""

import pytest
from app.schemas.findings import CheckStatus, Confidence, Severity
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData, SelectionData
from app.services.checks.base import CheckExecutionTracker
from app.services.checks.registry import CheckRegistry
from app.services.checks.url_checks import (
    IpHostCheck,
    LookalikeCheck,
    SuspiciousTldCheck,
    UrlLengthCheck,
    UrlObfuscationCheck,
)


def make_page_req(url: str) -> AnalysisRequest:
    return AnalysisRequest(
        request_id="test-url-req",
        mode=AnalysisMode.PAGE,
        page=PageData(url=url, visible_text="Page body content"),
    )


def make_sel_req(url: str, text: str = "selected text") -> AnalysisRequest:
    return AnalysisRequest(
        request_id="test-sel-url-req",
        mode=AnalysisMode.SELECTION,
        selection=SelectionData(url=url, text=text),
    )


class TestIpHostCheck:
    def test_benign_domain_not_detected(self):
        check = IpHostCheck()
        req = make_page_req("https://careers.google.com/jobs")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED
        assert result.severity is None
        assert result.confidence == Confidence.HIGH

    def test_ipv4_host_detected(self):
        check = IpHostCheck()
        req = make_page_req("http://192.168.1.100/login")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.HIGH
        assert len(result.evidence) == 1
        assert "192.168.1.100" in result.evidence[0].excerpt

    def test_selection_mode_ipv4_detected(self):
        check = IpHostCheck()
        req = make_sel_req("http://45.33.32.156/internship")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED

    def test_ipv6_host_detected(self):
        check = IpHostCheck()
        req = make_page_req("http://[2001:db8::1]:8080/path")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED


class TestSuspiciousTldCheck:
    def test_benign_tld_not_detected(self):
        check = SuspiciousTldCheck()
        req = make_page_req("https://example.org/path")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED

    def test_suspicious_tld_detected(self):
        check = SuspiciousTldCheck()
        req = make_page_req("https://easy-money-internship.xyz/apply")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.MEDIUM
        assert ".xyz" in result.evidence[0].excerpt


class TestUrlObfuscationCheck:
    def test_benign_url_not_detected(self):
        check = UrlObfuscationCheck()
        req = make_page_req("https://sub.domain.company.com/page")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED

    def test_at_symbol_in_authority_detected(self):
        check = UrlObfuscationCheck()
        req = make_page_req("https://google.com@phishing-target.com/login")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.HIGH
        assert "@" in result.evidence[0].excerpt

    def test_excessive_subdomains_detected(self):
        check = UrlObfuscationCheck()
        req = make_page_req("https://login.verify.account.secure.portal.evil.com/auth")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert "subdomain levels" in result.evidence[0].reason

    def test_nested_percent_encoding_detected(self):
        check = UrlObfuscationCheck()
        req = make_page_req("https://example.com/redirect?url=%252e%252e%252f")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.HIGH


class TestLookalikeCheck:
    def test_legitimate_brand_not_flagged(self):
        check = LookalikeCheck()
        req = make_page_req("https://www.google.com/search")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED

    def test_legitimate_subdomain_not_flagged(self):
        check = LookalikeCheck()
        req = make_page_req("https://careers.google.com/jobs")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED

    def test_character_substitution_detected(self):
        check = LookalikeCheck()
        req = make_page_req("https://g00gle.com/login")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.HIGH
        assert "google" in result.evidence[0].reason

    def test_amazon_substitution_detected(self):
        check = LookalikeCheck()
        req = make_page_req("https://amaz0n-jobs.com/apply")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert "amazon" in result.evidence[0].reason

    def test_hyphenated_brand_impersonation_detected(self):
        check = LookalikeCheck()
        req = make_page_req("https://paypal-security-verification.com/login")
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED


class TestUrlLengthCheck:
    def test_normal_length_not_detected(self):
        check = UrlLengthCheck()
        req = make_page_req("https://example.com/jobs/apply")
        result = check.run(req)
        assert result.status == CheckStatus.NOT_DETECTED

    def test_abnormally_long_url_detected(self):
        check = UrlLengthCheck()
        long_url = "https://example.com/" + ("param=" + "a" * 50 + "&") * 6
        req = make_page_req(long_url)
        result = check.run(req)
        assert result.status == CheckStatus.DETECTED
        assert result.severity == Severity.LOW


class TestCheckRegistryAndTracker:
    def test_registry_executes_all_checks(self):
        registry = CheckRegistry()
        req = make_page_req("http://1.2.3.4/login.xyz")
        results, tracker = registry.run_all(req)

        assert len(results) == 5
        summary = tracker.to_summary()
        assert len(summary["executed"]) == 5
        assert len(summary["not_executed"]) == 0
        assert len(summary["failed"]) == 0

        # Verify results include ip_host detection
        ip_res = next(r for r in results if r.check_id == "url.ip_host")
        assert ip_res.status == CheckStatus.DETECTED

