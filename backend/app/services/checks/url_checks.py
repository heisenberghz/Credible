"""Deterministic URL and hostname threat checks."""

import ipaddress
import re
from urllib.parse import urlparse
from typing import Optional

from app.schemas.findings import CheckResult, CheckStatus, Confidence, Evidence, Severity
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.checks.base import BaseCheck


def extract_target_url(request: AnalysisRequest) -> Optional[str]:
    """Helper to extract target URL from request."""
    if request.mode == AnalysisMode.PAGE and request.page:
        return request.page.url
    elif request.mode == AnalysisMode.SELECTION and request.selection:
        return request.selection.url
    return None


class IpHostCheck(BaseCheck):
    check_id = "url.ip_host"
    category = "url"
    description = "Checks if target URL uses a raw IP address instead of a domain name."

    def run(self, request: AnalysisRequest) -> CheckResult:
        url_str = extract_target_url(request)
        if not url_str:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["Target URL was not available for check."],
            )

        try:
            parsed = urlparse(url_str)
            hostname = parsed.hostname or ""
        except Exception:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.ERROR,
                confidence=Confidence.UNKNOWN,
                limitations=["Failed to parse target URL hostname."],
            )

        is_ip = False
        try:
            ipaddress.ip_address(hostname)
            is_ip = True
        except ValueError:
            is_ip = False

        if is_ip:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[
                    Evidence(
                        source="url",
                        excerpt=hostname,
                        reason="URL uses a direct IP address rather than a registered domain name, often used in evasion.",
                    )
                ],
                limitations=[
                    "Raw IP addresses can be used in internal development or legitimate direct routing, but are uncommon for public business portals."
                ],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=["Hostname is a standard domain name, not a raw IP address."],
        )


class SuspiciousTldCheck(BaseCheck):
    check_id = "url.suspicious_tld"
    category = "url"
    description = "Checks if domain uses a top-level domain frequently associated with disposable phishing campaigns."

    SUSPICIOUS_TLDS = {
        "tk", "ml", "ga", "cf", "gq", "top", "xyz", "buzz", "rest", "surf",
        "cam", "icu", "click", "link", "monster", "sbs", "cfd"
    }

    def run(self, request: AnalysisRequest) -> CheckResult:
        url_str = extract_target_url(request)
        if not url_str:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["Target URL was not available."],
            )

        try:
            parsed = urlparse(url_str)
            hostname = (parsed.hostname or "").lower()
            tld = hostname.split(".")[-1] if "." in hostname else ""
        except Exception:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.ERROR,
                confidence=Confidence.UNKNOWN,
                limitations=["Could not parse hostname."],
            )

        if tld in self.SUSPICIOUS_TLDS:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.MEDIUM,
                confidence=Confidence.MEDIUM,
                evidence=[
                    Evidence(
                        source="url",
                        excerpt=f".{tld}",
                        reason=f"The domain uses the '.{tld}' top-level domain, which has higher statistical prevalence in disposable phishing.",
                    )
                ],
                limitations=[
                    "A suspicious TLD is a contextual hygiene risk indicator and does not prove wrongdoing on its own."
                ],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=[],
        )


class UrlObfuscationCheck(BaseCheck):
    check_id = "url.obfuscation"
    category = "url"
    description = "Detects obfuscated URL structures, misleading authority prefixes, and excessive subdomains."

    def run(self, request: AnalysisRequest) -> CheckResult:
        url_str = extract_target_url(request)
        if not url_str:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["Target URL not available."],
            )

        evidences: list[Evidence] = []
        parsed = urlparse(url_str)
        hostname = (parsed.hostname or "").lower()
        netloc = parsed.netloc

        # Check 1: Userinfo / '@' sign in netloc (misleading credentials prefix)
        if "@" in netloc:
            evidences.append(
                Evidence(
                    source="url",
                    excerpt=netloc,
                    reason="URL contains '@' in authority segment, which browsers interpret by ignoring prefix text.",
                )
            )

        # Check 2: Excessive subdomain nesting (>= 5 components in hostname)
        parts = [p for p in hostname.split(".") if p]
        if len(parts) >= 5:
            evidences.append(
                Evidence(
                    source="url",
                    excerpt=hostname,
                    reason=f"Hostname has {len(parts)} subdomain levels, often used to camouflage true domain identity.",
                )
            )

        # Check 3: Suspicious percent-encoding in path or query
        full_path_query = (parsed.path or "") + ("?" + parsed.query if parsed.query else "")
        if "%25" in full_path_query or re.search(r"%[0-9a-fA-F]{2}%[0-9a-fA-F]{2}", full_path_query):
            evidences.append(
                Evidence(
                    source="url",
                    excerpt=full_path_query[:100],
                    reason="URL contains multiple or nested percent-encoded sequences (%25 or consecutive percent sequences).",
                )
            )

        if evidences:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=evidences,
                limitations=["Obfuscation techniques strongly warrant independent address verification."],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=["No obvious URL structure obfuscation detected."],
        )


class LookalikeCheck(BaseCheck):
    check_id = "url.lookalike"
    category = "url"
    description = "Detects possible typosquatting, character substitution, or lookalike patterns mimicking known brands."

    TARGET_BRANDS = [
        "google", "amazon", "microsoft", "linkedin", "paypal",
        "apple", "infosys", "tcs", "wipro", "telegram", "whatsapp"
    ]

    SUBSTITUTION_MAP = {
        "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "vv": "w"
    }

    def run(self, request: AnalysisRequest) -> CheckResult:
        url_str = extract_target_url(request)
        if not url_str:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["Target URL not available."],
            )

        parsed = urlparse(url_str)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.NOT_DETECTED,
                confidence=Confidence.LOW,
                limitations=["Empty hostname."],
            )

        parts = hostname.split(".")
        sld = parts[-2] if len(parts) >= 2 else parts[0]

        # Normalize lookalike substitutions for the SLD
        norm_sld = sld
        for sub, orig in self.SUBSTITUTION_MAP.items():
            norm_sld = norm_sld.replace(sub, orig)

        detected_brand = None
        detected_part = None

        for brand in self.TARGET_BRANDS:
            # Skip if this is actually the official brand domain or official subdomain (e.g. google.com, careers.google.com)
            if sld == brand:
                continue

            # Case A: Substitution transformed SLD into the exact brand (e.g. "g00gle" -> "google", "amaz0n" -> "amazon")
            if sld != brand and norm_sld == brand:
                detected_brand = brand
                detected_part = sld
                break

            # Case B: Brand embedded in SLD with hyphen or extra text (e.g. "paypal-security-verification", "google-jobs")
            if brand in norm_sld and sld != brand:
                detected_brand = brand
                detected_part = sld
                break

            # Case C: Levenshtein distance 1 check for subtle typos (e.g. "gogle", "amzon")
            if len(sld) >= 4 and abs(len(sld) - len(brand)) <= 1:
                diffs = sum(1 for a, b in zip(sld, brand) if a != b) + abs(len(sld) - len(brand))
                if diffs == 1 and sld != brand:
                    detected_brand = brand
                    detected_part = sld
                    break

        if detected_brand and detected_part:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.MEDIUM,
                evidence=[
                    Evidence(
                        source="url",
                        excerpt=hostname,
                        reason=f"Hostname segment '{detected_part}' closely resembles official brand '{detected_brand}' but is not an official domain.",
                    )
                ],
                limitations=[
                    "Lookalike detection is heuristic. Organizations sometimes legitimately register campaign domains, but caution is advised."
                ],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=["No lookalike patterns detected for monitored brand set."],
        )


class UrlLengthCheck(BaseCheck):
    check_id = "url.length"
    category = "url"
    description = "Checks if target URL is abnormally long."

    MAX_REASONABLE_LENGTH = 250

    def run(self, request: AnalysisRequest) -> CheckResult:
        url_str = extract_target_url(request)
        if not url_str:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["Target URL not available."],
            )

        if len(url_str) > self.MAX_REASONABLE_LENGTH:
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.LOW,
                confidence=Confidence.HIGH,
                evidence=[
                    Evidence(
                        source="url",
                        excerpt=f"{url_str[:60]}... ({len(url_str)} chars)",
                        reason=f"URL is abnormally long ({len(url_str)} characters), which can obscure destination parameters.",
                    )
                ],
                limitations=[
                    "Long URLs frequently occur with complex tracking parameters, but reduce human inspection capability."
                ],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=[],
        )

