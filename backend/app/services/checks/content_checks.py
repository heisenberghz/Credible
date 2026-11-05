"""Deterministic page content and selection threat checks."""

import re
from typing import List, Optional, Tuple
from app.schemas.findings import CheckResult, CheckStatus, Confidence, Evidence, Severity
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.checks.base import BaseCheck


def extract_content_text(request: AnalysisRequest) -> str:
    """Extract readable visible text or selection text from request."""
    if request.mode == AnalysisMode.PAGE and request.page:
        return request.page.visible_text or ""
    elif request.mode == AnalysisMode.SELECTION and request.selection:
        return request.selection.text or ""
    return ""


def find_matching_sentences(text: str, patterns: List[re.Pattern]) -> List[Tuple[str, str]]:
    """
    Search text for patterns.
    Returns list of (matched_sentence_or_phrase, matched_pattern_label).
    """
    if not text:
        return []

    # Split into rough sentences or lines
    chunks = [c.strip() for c in re.split(r"[.\n\r?!]+", text) if len(c.strip()) > 5]
    matches = []

    for chunk in chunks:
        for pat in patterns:
            match = pat.search(chunk)
            if match:
                matches.append((chunk, match.group(0)))
                break  # avoid multiple detections for same chunk
    return matches


# A legitimate disclaimer can mention payment words without requesting money,
# e.g. "we never ask contributors to pay any fee". Skip those clauses unless the
# same sentence also contains an affirmative demand or a concrete amount.
PAYMENT_DISCLAIMER_PATTERNS = [
    re.compile(
        r"\b(?:never|do|does|did)\s*(?:not|n't)?\s*"
        r"(?:ask|require|expect|demand|charge|pay|need)\b[^.;]{0,50}"
        r"\b(?:pay|payment|fee|charge|deposit)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bno\s+(?:\w+\s+){0,2}(?:fee|charge|deposit|payment)\s+"
        r"(?:is|are)?\s*(?:required|needed|necessary)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:fee|charge|deposit|payment)\s+(?:is|are)\s+not\s+"
        r"(?:required|needed|necessary)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bwithout\s+(?:paying|any)\s+(?:fee|charge|deposit)\b", re.IGNORECASE),
    re.compile(r"\b(?:do|does|did)\s*(?:not|n't)\s+charge\b[^.;]{0,30}\b(?:fee|deposit|payment|money)\b", re.IGNORECASE),
]

PAYMENT_AFFIRMATIVE_PATTERN = re.compile(
    r"\b(?:must|please|kindly)\b"
    r"|\byou\s+(?:will|must|should|are\s+required)\b"
    r"|\b(?:are|is)\s+required\s+to\b"
    r"|\bfailure\s+to\b|\bbefore\s+you\s+can\b|\bto\s+proceed\b|\bin\s+order\s+to\b"
    r"|[₹$]\s*\d+"
    r"|\b\d[\d,]*\s*(?:usd|inr|rupees|dollars)\b"
    r"|\b(?:send|transfer|wire|submit|pay|deposit)\b[^.;]{0,25}"
    r"\b(?:usdt|bitcoin|ethereum|crypto|wallet|upi|account\s+number)\b",
    re.IGNORECASE,
)


class PaymentPressureCheck(BaseCheck):
    check_id = "content.payment_pressure"
    category = "content"
    description = "Detects upfront fees, registration charges, deposits, or non-standard payment requests for jobs/internships."

    PATTERNS = [
        re.compile(r"\b(?:pay|deposit|transfer|send|wire)\b[^\n.]{0,40}(?:\b(?:fee|charge|deposit|amount|money|rupees|crypto|usdt|upi)\b|[₹$]\s*\d+)", re.IGNORECASE),
        re.compile(r"\b(?:registration|application|processing|training|interview|kit|security)\s+(?:fee|charge|deposit|cost|amount)\b", re.IGNORECASE),
        re.compile(r"\b(?:refundable|upfront|advance)\s+(?:deposit|fee|payment|charge)\b", re.IGNORECASE),
        re.compile(r"\b(?:crypto|bitcoin|ethereum|usdt|upi)\s+(?:wallet|address|payment|transfer|account)\b", re.IGNORECASE),
    ]

    @staticmethod
    def _is_disclaimer(chunk: str) -> bool:
        if PAYMENT_AFFIRMATIVE_PATTERN.search(chunk):
            return False
        return any(pattern.search(chunk) for pattern in PAYMENT_DISCLAIMER_PATTERNS)

    def run(self, request: AnalysisRequest) -> CheckResult:
        text = extract_content_text(request)
        if not text.strip():
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["No readable content was submitted for text analysis."],
            )

        matches = [
            (chunk, label)
            for chunk, label in find_matching_sentences(text, self.PATTERNS)
            if not self._is_disclaimer(chunk)
        ]
        if matches:
            evidences = [
                Evidence(
                    source="visible_text" if request.mode == AnalysisMode.PAGE else "selection",
                    excerpt=chunk[:200],
                    reason="Explicit request for upfront payment, registration fee, or security deposit detected.",
                )
                for chunk, _ in matches[:3]
            ]
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=evidences,
                limitations=[
                    "Legitimate employers and university internships do not charge candidates money to apply or work.",
                    "Certain independent training bootcamps charge tuition, but fees requested for employment offers strongly warrant independent verification.",
                ],
            )

        return CheckResult(
            check_id=self.check_id,
            status=CheckStatus.NOT_DETECTED,
            severity=None,
            confidence=Confidence.HIGH,
            evidence=[],
            limitations=["No explicit fee or upfront payment requests detected in provided content."],
        )


class UrgencyCheck(BaseCheck):
    check_id = "content.urgency"
    category = "content"
    description = "Detects artificial urgency, scarcity pressure, and coercive time limits."

    PATTERNS = [
        re.compile(r"\b(?:urgent|immediately|act\s+now|hurry|don'?t\s+miss\s+out)\b", re.IGNORECASE),
        re.compile(r"\b(?:only|limited)\s+(?:\d+|few|seats?|slots?|openings?)\s+(?:left|remaining|available)\b", re.IGNORECASE),
        re.compile(r"\b(?:expires?|valid)\s+(?:in|within)\s+(?:\d+\s+(?:hours?|minutes?|days?)|today|24\s*hours?)\b", re.IGNORECASE),
        re.compile(r"\b(?:offer\s+will\s+be\s+revoked|forfeit\s+your\s+seat|last\s+chance)\b", re.IGNORECASE),
    ]

    def run(self, request: AnalysisRequest) -> CheckResult:
        text = extract_content_text(request)
        if not text.strip():
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["No text content available."],
            )

        matches = find_matching_sentences(text, self.PATTERNS)
        if matches:
            evidences = [
                Evidence(
                    source="visible_text" if request.mode == AnalysisMode.PAGE else "selection",
                    excerpt=chunk[:200],
                    reason="Language creating artificial urgency or pressure to act quickly without independent review.",
                )
                for chunk, _ in matches[:3]
            ]
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.MEDIUM,
                confidence=Confidence.MEDIUM,
                evidence=evidences,
                limitations=[
                    "Social engineering attacks frequently create artificial deadlines to prevent victims from consulting others or verifying facts."
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


class CredentialPressureCheck(BaseCheck):
    check_id = "content.credential_pressure"
    category = "content"
    description = "Detects requests asking users to input or submit account passwords, PINs, or security credentials."

    PATTERNS = [
        re.compile(r"\b(?:enter|provide|send|verify|confirm|share|submit)\b[^\n.]{0,35}\b(?:password|pin|otp|passcode|secret\s+key|recovery\s+phrase|seed\s+phrase)\b", re.IGNORECASE),
        re.compile(r"\b(?:share|submit|enter)\s+(?:your\s+)?(?:login\s+credentials|login\s+details|email\s+password)\b", re.IGNORECASE),
    ]

    def run(self, request: AnalysisRequest) -> CheckResult:
        text = extract_content_text(request)
        if not text.strip():
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["No text content available."],
            )

        matches = find_matching_sentences(text, self.PATTERNS)
        if matches:
            evidences = [
                Evidence(
                    source="visible_text" if request.mode == AnalysisMode.PAGE else "selection",
                    excerpt=chunk[:200],
                    reason="Page explicitly pressures user to provide login credentials, passwords, or security passcodes.",
                )
                for chunk, _ in matches[:2]
            ]
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.CRITICAL,
                confidence=Confidence.HIGH,
                evidence=evidences,
                limitations=[
                    "Legitimate organizations do not request passwords, OTPs, or recovery phrases through recruitment or unauthenticated forms."
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


class DataExposureCheck(BaseCheck):
    check_id = "content.data_exposure"
    category = "content"
    description = "Detects requests for sensitive personal identity documents or financial data prematurely."

    PATTERNS = [
        re.compile(r"\b(?:upload|send|submit)\s+(?:your\s+)?(?:passport|aadhaar|ssn|social\s+security|id\s+card|pan\s+card|driver'?s?\s+licen[sc]e)\b", re.IGNORECASE),
        re.compile(r"\b(?:bank\s+account\s+(?:number|details)|credit\s+card\s+details|cvv|debit\s+card)\b", re.IGNORECASE),
    ]

    def run(self, request: AnalysisRequest) -> CheckResult:
        text = extract_content_text(request)
        if not text.strip():
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["No text content available."],
            )

        matches = find_matching_sentences(text, self.PATTERNS)
        if matches:
            evidences = [
                Evidence(
                    source="visible_text" if request.mode == AnalysisMode.PAGE else "selection",
                    excerpt=chunk[:200],
                    reason="Premature collection of sensitive national identity documents or financial account details.",
                )
                for chunk, _ in matches[:3]
            ]
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.MEDIUM,
                evidence=evidences,
                limitations=[
                    "Identity verification is standard during formal post-offer onboarding, but requesting sensitive documents on initial public listings creates data theft risk."
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


class UnrealisticPromisesCheck(BaseCheck):
    check_id = "content.unrealistic_promises"
    category = "content"
    description = "Detects unrealistic income promises, guaranteed selection without interview, or too-good-to-be-true claims."

    PATTERNS = [
        re.compile(r"\b(?:100%|guaranteed)\s+(?:selection|placement|job|income|returns|salary)\b", re.IGNORECASE),
        re.compile(r"\b(?:earn|make)\s+(?:up\s+to\s+)?(?:₹|\$|rs\.?)\s*(?:\d{4,}|[\d,]+)\s*(?:daily|per\s+day|per\s+hour|weekly)\b", re.IGNORECASE),
        re.compile(r"\b(?:no\s+skills?|no\s+experience|no\s+interview)\s+(?:required|needed)\s+[^\n.]{0,30}\b(?:earn|high\s+pay|guaranteed)\b", re.IGNORECASE),
    ]

    def run(self, request: AnalysisRequest) -> CheckResult:
        text = extract_content_text(request)
        if not text.strip():
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.UNAVAILABLE,
                confidence=Confidence.UNKNOWN,
                limitations=["No text content available."],
            )

        matches = find_matching_sentences(text, self.PATTERNS)
        if matches:
            evidences = [
                Evidence(
                    source="visible_text" if request.mode == AnalysisMode.PAGE else "selection",
                    excerpt=chunk[:200],
                    reason="Unrealistic opportunity promises such as guaranteed placement or extreme income without qualifications.",
                )
                for chunk, _ in matches[:2]
            ]
            return CheckResult(
                check_id=self.check_id,
                status=CheckStatus.DETECTED,
                severity=Severity.MEDIUM,
                confidence=Confidence.HIGH,
                evidence=evidences,
                limitations=[
                    "Legitimate organizations rarely guarantee outcomes or compensation without screening."
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
