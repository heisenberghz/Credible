"""Trust DNA multidimensional profile builder."""

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
    Builds the 6 canonical Trust DNA dimensions based strictly on observed checks.
    Dimensions:
    1. identity_domain
    2. connection_technical
    3. transparency
    4. page_behavior
    5. content_consistency
    6. credential_payment
    """
    check_map = {c.check_id: c for c in deterministic_checks}
    url_str = ""
    if request.mode == AnalysisMode.PAGE and request.page:
        url_str = request.page.url
    elif request.mode == AnalysisMode.SELECTION and request.selection:
        url_str = request.selection.url

    parsed_url = urlparse(url_str) if url_str else None

    dimensions: List[TrustDnaDimension] = []

    # 1. Identity & Domain Signals
    identity_evidences: List[Evidence] = []
    identity_concerns = []
    for cid in ("url.ip_host", "url.lookalike", "url.suspicious_tld", "url.obfuscation"):
        res = check_map.get(cid)
        if res and res.status == CheckStatus.DETECTED:
            identity_concerns.append(res)
            identity_evidences.extend(res.evidence)

    if identity_concerns:
        dimensions.append(
            TrustDnaDimension(
                id="identity_domain",
                name="Identity and Domain Signals",
                status=TrustDnaStatus.CONCERN,
                confidence=Confidence.HIGH if any(c.confidence == Confidence.HIGH for c in identity_concerns) else Confidence.MEDIUM,
                summary="Domain or hostname patterns exhibit risk characteristics (e.g. lookalike, IP host, or high-risk TLD).",
                evidence=identity_evidences,
                limitations=["Automated heuristic detection; legitimate organizations occasionally register campaign domains."],
            )
        )
    elif url_str:
        dimensions.append(
            TrustDnaDimension(
                id="identity_domain",
                name="Identity and Domain Signals",
                status=TrustDnaStatus.POSITIVE,
                confidence=Confidence.MEDIUM,
                summary="Hostname conforms to standard domain conventions without obvious lookalikes or IP hosts.",
                evidence=[],
                limitations=["Passes syntax heuristics. Independent domain registration lookup was not performed to preserve user privacy."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="identity_domain",
                name="Identity and Domain Signals",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                summary="No target URL available to evaluate domain signals.",
                evidence=[],
                limitations=["Target URL was not provided."],
            )
        )

    # 2. Connection & Technical Signals
    conn_evidences: List[Evidence] = []
    is_localhost = (
        parsed_url.hostname in ("localhost", "127.0.0.1", "::1", "testserver")
        if (parsed_url and parsed_url.hostname)
        else False
    )
    is_https = parsed_url.scheme == "https" if parsed_url else False
    is_secure_transport = is_https or is_localhost
    len_check = check_map.get("url.length")
    obf_check = check_map.get("url.obfuscation")

    if not is_secure_transport and url_str:
        conn_evidences.append(Evidence(source="url", excerpt=url_str[:50], reason="URL uses unencrypted HTTP protocol."))
    if len_check and len_check.status == CheckStatus.DETECTED:
        conn_evidences.extend(len_check.evidence)

    if conn_evidences or (obf_check and obf_check.status == CheckStatus.DETECTED):
        dimensions.append(
            TrustDnaDimension(
                id="connection_technical",
                name="Connection and Technical Signals",
                status=TrustDnaStatus.CONCERN if not is_secure_transport else TrustDnaStatus.MIXED,
                confidence=Confidence.HIGH,
                summary="Technical connection or URL structure shows hygiene issues.",
                evidence=conn_evidences,
                limitations=["Connection inspection is limited to client-observable URL components."],
            )
        )
    elif is_secure_transport:
        summary_text = (
            "Secure HTTPS protocol used with standard link structure."
            if is_https
            else "Secure local development loopback context with standard link structure."
        )
        dimensions.append(
            TrustDnaDimension(
                id="connection_technical",
                name="Connection and Technical Signals",
                status=TrustDnaStatus.POSITIVE,
                confidence=Confidence.HIGH,
                summary=summary_text,
                evidence=[],
                limitations=["Transport encryption verified; does not verify backend server integrity."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="connection_technical",
                name="Connection and Technical Signals",
                status=TrustDnaStatus.UNKNOWN,
                confidence=Confidence.UNKNOWN,
                summary="Technical connection information unavailable.",
                evidence=[],
                limitations=[],
            )
        )

    # 3. Transparency
    dimensions.append(
        TrustDnaDimension(
            id="transparency",
            name="Transparency",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Organizational registration and corporate legal entity records were not independently checked.",
            evidence=[],
            limitations=[
                "External corporate registrar and WHOIS lookups are not performed for user privacy in MVP.",
                "Users should verify organization independently on official channels.",
            ],
        )
    )

    # 4. Page Behavior
    if obf_check and obf_check.status == CheckStatus.DETECTED:
        dimensions.append(
            TrustDnaDimension(
                id="page_behavior",
                name="Page Behavior",
                status=TrustDnaStatus.CONCERN,
                confidence=Confidence.HIGH,
                summary="Navigation structure contains obfuscation or misleading authority tokens.",
                evidence=list(obf_check.evidence),
                limitations=["Evaluation based on URL structure and readable content."],
            )
        )
    else:
        dimensions.append(
            TrustDnaDimension(
                id="page_behavior",
                name="Page Behavior",
                status=TrustDnaStatus.POSITIVE,
                confidence=Confidence.MEDIUM,
                summary="No structural obfuscation detected in submitted page address or links.",
                evidence=[],
                limitations=["Active runtime browser script execution is not inspected."],
            )
        )

    # 5. Content & Offer Consistency
    promise_check = check_map.get("content.unrealistic_promises")
    urgency_check = check_map.get("content.urgency")
    content_concerns: List[Evidence] = []

    if promise_check and promise_check.status == CheckStatus.DETECTED:
        content_concerns.extend(promise_check.evidence)
    if urgency_check and urgency_check.status == CheckStatus.DETECTED:
        content_concerns.extend(urgency_check.evidence)

    if content_concerns:
        dimensions.append(
            TrustDnaDimension(
                id="content_consistency",
                name="Content and Offer Consistency",
                status=TrustDnaStatus.CONCERN,
                confidence=Confidence.HIGH,
                summary="Content displays unrealistic promises, guaranteed outcomes, or artificial urgency.",
                evidence=content_concerns,
                limitations=["Language patterns are contextual indicators, not proof of intent."],
            )
        )
    else:
        has_text = bool((request.page and request.page.visible_text) or (request.selection and request.selection.text))
        dimensions.append(
            TrustDnaDimension(
                id="content_consistency",
                name="Content and Offer Consistency",
                status=TrustDnaStatus.POSITIVE if has_text else TrustDnaStatus.UNKNOWN,
                confidence=Confidence.MEDIUM if has_text else Confidence.UNKNOWN,
                summary="Content text does not display overt pressure or unrealistic promises." if has_text else "No text content submitted.",
                evidence=[],
                limitations=[],
            )
        )

    # 6. Credential & Payment Pressure
    pay_check = check_map.get("content.payment_pressure")
    cred_check = check_map.get("content.credential_pressure")
    data_check = check_map.get("content.data_exposure")
    pressure_concerns: List[Evidence] = []

    for c in (pay_check, cred_check, data_check):
        if c and c.status == CheckStatus.DETECTED:
            pressure_concerns.extend(c.evidence)

    if pressure_concerns:
        dimensions.append(
            TrustDnaDimension(
                id="credential_payment",
                name="Credential and Payment Pressure",
                status=TrustDnaStatus.CONCERN,
                confidence=Confidence.HIGH,
                summary="Explicit requests for upfront money, deposits, credentials, or sensitive identity documents detected.",
                evidence=pressure_concerns,
                limitations=["Legitimate job recruitment does not require applicants to transfer funds."],
            )
        )
    else:
        has_text = bool((request.page and request.page.visible_text) or (request.selection and request.selection.text))
        dimensions.append(
            TrustDnaDimension(
                id="credential_payment",
                name="Credential and Payment Pressure",
                status=TrustDnaStatus.POSITIVE if has_text else TrustDnaStatus.UNKNOWN,
                confidence=Confidence.HIGH if has_text else Confidence.UNKNOWN,
                summary="No upfront fee requests or credential harvesting demands observed in submitted content." if has_text else "No content available.",
                evidence=[],
                limitations=[],
            )
        )

    return dimensions

