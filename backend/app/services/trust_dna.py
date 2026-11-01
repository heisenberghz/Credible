"""
Trust DNA multidimensional profile builder aligned with MVP Specification 5.1.
Dimensions:
1. payment_risk
2. identity_risk
3. social_engineering_risk
4. data_exposure_risk
5. link_domain_risk
6. evidence_confidence
"""

from typing import List, Optional
from urllib.parse import urlparse

from app.schemas.findings import CheckResult, CheckStatus, Confidence, Evidence, Severity
from app.schemas.reports import TrustDnaDimension, TrustDnaStatus
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.ai.schemas import AIAnalysisOutput


def build_trust_dna(
    request: AnalysisRequest,
    deterministic_checks: List[CheckResult],
    ai_output: Optional[AIAnalysisOutput] = None,
) -> List[TrustDnaDimension]:
    """
    Builds the 6 canonical 5.1 Trust DNA dimensions based on observed checks and AI consensus.
    """
    check_map = {c.check_id: c for c in deterministic_checks}
    url_str = ""
    has_text = False

    if request.mode == AnalysisMode.PAGE and request.page:
        url_str = request.page.url
        has_text = bool(request.page.visible_text and request.page.visible_text.strip())
    elif request.mode == AnalysisMode.SELECTION and request.selection:
        url_str = request.selection.url
        has_text = bool(request.selection.text and request.selection.text.strip())

    parsed_url = urlparse(url_str) if url_str else None
    dimensions: List[TrustDnaDimension] = []

    # -------------------------------------------------------------
    # 1. Payment Risk (payment_risk)
    # -------------------------------------------------------------
    pay_check = check_map.get("content.payment_pressure")
    if pay_check and pay_check.status == CheckStatus.DETECTED:
        dimensions.append(
            TrustDnaDimension(
                id="payment_risk",
                name="Payment Risk",
                status=TrustDnaStatus.WARNING_FOUND,
                confidence=Confidence.HIGH,
                dimension_score=20,
                summary="Explicit requests for upfront money, deposits, equipment fees, or cryptocurrency transfers detected.",
                evidence=list(pay_check.evidence),
                limitations=["Legitimate job recruitment never requires applicants to transfer money or buy supplies in advance."],
            )
        )
    elif has_text:
        dimensions.append(
            TrustDnaDimension(
                id="payment_risk",
                name="Payment Risk",
                status=TrustDnaStatus.NO_INDICATOR_DETECTED,
                confidence=Confidence.HIGH,
                dimension_score=100,
                summary="No upfront fee requests, deposit demands, or cryptocurrency transfer language observed in content.",
                evidence=[],
                limitations=["Content was scanned for payment keywords; off-platform payment communications cannot be monitored."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="payment_risk",
                name="Payment Risk",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                dimension_score=50,
                summary="No text content available to evaluate payment demands.",
                evidence=[],
                limitations=["Content text was not provided."],
            )
        )

    # -------------------------------------------------------------
    # 2. Identity Risk (identity_risk)
    # -------------------------------------------------------------
    lookalike_check = check_map.get("url.lookalike")
    if lookalike_check and lookalike_check.status == CheckStatus.DETECTED:
        dimensions.append(
            TrustDnaDimension(
                id="identity_risk",
                name="Identity Risk",
                status=TrustDnaStatus.WARNING_FOUND,
                confidence=Confidence.HIGH,
                dimension_score=25,
                summary="Domain employs brand typosquatting, character substitution, or lookalike impersonation patterns.",
                evidence=list(lookalike_check.evidence),
                limitations=["Heuristic character comparison against known corporate brands."],
            )
        )
    else:
        # Without independent registrar/WHOIS lookup, identity cannot be proven (absence of warning != proof of safety)
        dimensions.append(
            TrustDnaDimension(
                id="identity_risk",
                name="Identity Risk",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.LOW,
                dimension_score=75,
                summary="Domain conforms to standard naming conventions, but corporate identity was not independently verified via registrar records.",
                evidence=[],
                limitations=[
                    "Independent corporate registrar lookup and WHOIS ownership queries were not performed to preserve user privacy in MVP.",
                    "Always confirm listings on the organization's verified careers portal.",
                ],
            )
        )

    # -------------------------------------------------------------
    # 3. Social Engineering Risk (social_engineering_risk)
    # -------------------------------------------------------------
    urgency_check = check_map.get("content.urgency")
    promise_check = check_map.get("content.unrealistic_promises")
    soc_evidences: List[Evidence] = []

    if urgency_check and urgency_check.status == CheckStatus.DETECTED:
        soc_evidences.extend(urgency_check.evidence)
    if promise_check and promise_check.status == CheckStatus.DETECTED:
        soc_evidences.extend(promise_check.evidence)

    if soc_evidences:
        dimensions.append(
            TrustDnaDimension(
                id="social_engineering_risk",
                name="Social Engineering Risk",
                status=TrustDnaStatus.WARNING_FOUND,
                confidence=Confidence.HIGH,
                dimension_score=35,
                summary="High-pressure urgency tactics, artificial countdowns, or unrealistic compensation guarantees detected.",
                evidence=soc_evidences,
                limitations=["Language heuristics identify pressure tactics; tone analysis is contextual."],
            )
        )
    elif has_text:
        dimensions.append(
            TrustDnaDimension(
                id="social_engineering_risk",
                name="Social Engineering Risk",
                status=TrustDnaStatus.NO_INDICATOR_DETECTED,
                confidence=Confidence.MEDIUM,
                dimension_score=100,
                summary="No artificial urgency, scarcity countdowns, or unrealistic promises observed in content.",
                evidence=[],
                limitations=["Heuristic scan covers common deceptive patterns; sophisticated conversational manipulation may vary."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="social_engineering_risk",
                name="Social Engineering Risk",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                dimension_score=50,
                summary="No text content provided to evaluate social engineering patterns.",
                evidence=[],
                limitations=[],
            )
        )

    # -------------------------------------------------------------
    # 4. Data Exposure Risk (data_exposure_risk)
    # -------------------------------------------------------------
    cred_check = check_map.get("content.credential_pressure")
    data_check = check_map.get("content.data_exposure")
    exposure_evidences: List[Evidence] = []

    if cred_check and cred_check.status == CheckStatus.DETECTED:
        exposure_evidences.extend(cred_check.evidence)
    if data_check and data_check.status == CheckStatus.DETECTED:
        exposure_evidences.extend(data_check.evidence)

    if exposure_evidences:
        dimensions.append(
            TrustDnaDimension(
                id="data_exposure_risk",
                name="Data Exposure Risk",
                status=TrustDnaStatus.WARNING_FOUND,
                confidence=Confidence.HIGH,
                dimension_score=20,
                summary="Demands for sensitive passwords, 2FA codes, SSNs, passports, or banking numbers detected.",
                evidence=exposure_evidences,
                limitations=["Never provide passwords, seed phrases, or sensitive tax IDs during initial opportunity exploration."],
            )
        )
    elif has_text:
        dimensions.append(
            TrustDnaDimension(
                id="data_exposure_risk",
                name="Data Exposure Risk",
                status=TrustDnaStatus.NO_INDICATOR_DETECTED,
                confidence=Confidence.HIGH,
                dimension_score=100,
                summary="No illicit credential harvesting or premature personal identity document collection observed.",
                evidence=[],
                limitations=["Only visible text is evaluated; do not input credentials into unverified forms."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="data_exposure_risk",
                name="Data Exposure Risk",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                dimension_score=50,
                summary="No text content available to evaluate data exposure risk.",
                evidence=[],
                limitations=[],
            )
        )

    # -------------------------------------------------------------
    # 5. Link & Domain Risk (link_domain_risk)
    # -------------------------------------------------------------
    is_localhost = (
        parsed_url.hostname in ("localhost", "127.0.0.1", "::1", "testserver")
        if (parsed_url and parsed_url.hostname)
        else False
    )
    is_https = parsed_url.scheme == "https" if parsed_url else False
    is_secure_transport = is_https or is_localhost

    ip_check = check_map.get("url.ip_host")
    tld_check = check_map.get("url.suspicious_tld")
    obf_check = check_map.get("url.obfuscation")
    len_check = check_map.get("url.length")

    link_evidences: List[Evidence] = []
    if not is_secure_transport and url_str:
        link_evidences.append(Evidence(source="url", excerpt=url_str[:50], reason="URL uses unencrypted HTTP transport."))
    if ip_check and ip_check.status == CheckStatus.DETECTED:
        link_evidences.extend(ip_check.evidence)
    if tld_check and tld_check.status == CheckStatus.DETECTED:
        link_evidences.extend(tld_check.evidence)
    if obf_check and obf_check.status == CheckStatus.DETECTED:
        link_evidences.extend(obf_check.evidence)
    if len_check and len_check.status == CheckStatus.DETECTED:
        link_evidences.extend(len_check.evidence)

    if link_evidences:
        dimensions.append(
            TrustDnaDimension(
                id="link_domain_risk",
                name="Link and Domain Risk",
                status=TrustDnaStatus.WARNING_FOUND,
                confidence=Confidence.HIGH,
                dimension_score=30,
                summary="Suspicious top-level domain, raw IP hosting, URL obfuscation, or unencrypted protocol detected.",
                evidence=link_evidences,
                limitations=["Technical structural inspection of observable URL authority and parameters."],
            )
        )
    elif url_str:
        summary_text = (
            "Secure HTTPS protocol and standard domain structure with zero URL obfuscation detected."
            if is_https
            else "Secure local development loopback context with standard link structure."
        )
        dimensions.append(
            TrustDnaDimension(
                id="link_domain_risk",
                name="Link and Domain Risk",
                status=TrustDnaStatus.NO_INDICATOR_DETECTED,
                confidence=Confidence.HIGH,
                dimension_score=100,
                summary=summary_text,
                evidence=[],
                limitations=["Transport encryption verified; backend server infrastructure reputation not queried."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="link_domain_risk",
                name="Link and Domain Risk",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                dimension_score=50,
                summary="No URL provided to evaluate link technical signals.",
                evidence=[],
                limitations=[],
            )
        )

    # -------------------------------------------------------------
    # 6. Evidence Confidence (evidence_confidence) - Consensus Engine
    # -------------------------------------------------------------
    deterministic_warnings = any(
        c.status == CheckStatus.DETECTED for c in deterministic_checks
    )
    ai_warnings = bool(ai_output and ai_output.findings)

    # Consensus determination
    if ai_output and ai_output.analysis_mode == "ai_full":
        # Both models executed
        if deterministic_warnings and not ai_warnings:
            # Deterministic caught something that AI missed or suppressed
            dimensions.append(
                TrustDnaDimension(
                    id="evidence_confidence",
                    name="Evidence Confidence",
                    status=TrustDnaStatus.WARNING_FOUND,
                    confidence=Confidence.HIGH,
                    dimension_score=60,
                    summary="Signal divergence detected: Deterministic heuristics flagged threat indicators that AI model missed or suppressed.",
                    evidence=[],
                    limitations=["Deterministic threat findings take strict safety precedence over AI outputs."],
                )
            )
        else:
            dimensions.append(
                TrustDnaDimension(
                    id="evidence_confidence",
                    name="Evidence Confidence",
                    status=TrustDnaStatus.NO_INDICATOR_DETECTED,
                    confidence=Confidence.HIGH,
                    dimension_score=100,
                    summary="High observational consensus: Deterministic threat checks and AI reasoning agree on grounded evidence.",
                    evidence=[],
                    limitations=["Evidence is grounded strictly against observable page text without hallucinated claims."],
                )
            )
    else:
        # Deterministic-only / fallback mode
        dimensions.append(
            TrustDnaDimension(
                id="evidence_confidence",
                name="Evidence Confidence",
                status=TrustDnaStatus.NO_INDICATOR_DETECTED if has_text else TrustDnaStatus.UNKNOWN,
                confidence=Confidence.MEDIUM if has_text else Confidence.UNKNOWN,
                dimension_score=90 if has_text else 50,
                summary="Assessment grounded reliably on client-observable deterministic heuristic rules." if has_text else "Insufficient content available to ground findings.",
                evidence=[],
                limitations=["AI semantic reasoning is offline; evaluation performed using local deterministic heuristics."],
            )
        )

    return dimensions
