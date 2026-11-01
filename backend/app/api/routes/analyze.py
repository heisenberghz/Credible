"""Analysis route for Credible API."""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.core.logging import log_request_event
from app.schemas.errors import ErrorCode, ErrorDetail, ErrorResponse
from app.schemas.findings import CheckStatus, Confidence
from app.schemas.reports import (
    AnalysisReport,
    AssessmentStatus,
    ExecutedChecksSummary,
    TrustDnaDimension,
    TrustDnaStatus,
)
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.normalization import NormalizationError, normalize_request

router = APIRouter(prefix="/api/v1", tags=["Analysis"])


@router.post(
    "/analyze",
    response_model=AnalysisReport,
    responses={
        400: {"model": ErrorResponse, "description": "Validation or Normalization Error"},
        422: {"model": ErrorResponse, "description": "Schema Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)
def analyze_content(request: AnalysisRequest) -> AnalysisReport:
    """
    Analyze user-initiated page or selection content.
    Returns structured analysis report with Trust DNA, findings, Proof Mode, and actions.
    """
    log_request_event(
        event="analyze_request_received",
        request_id=request.request_id,
        mode=request.mode.value,
    )

    try:
        normalized_req, norm_limitations = normalize_request(request)
    except NormalizationError as exc:
        log_request_event(
            event="normalization_failed",
            request_id=request.request_id,
            status="error",
            extra={"code": exc.code, "field": exc.field or ""},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": exc.code,
                "message": exc.message,
                "field": exc.field,
            },
        )

    # In Task 2, we return a baseline structured report satisfying the complete schema contract.
    # Phase 2 will execute real deterministic checks and AI pipeline here.
    target_url = normalized_req.page.url if normalized_req.mode == AnalysisMode.PAGE else normalized_req.selection.url

    # Initial default dimensions
    initial_trust_dna = [
        TrustDnaDimension(
            id="identity_domain",
            name="Identity and Domain Signals",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Awaiting full deterministic evaluation.",
            evidence=[],
            limitations=["External WHOIS and registry lookups are not performed for user privacy."],
        ),
        TrustDnaDimension(
            id="connection_technical",
            name="Connection and Technical Signals",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Protocol evaluation pending.",
            evidence=[],
            limitations=[],
        ),
        TrustDnaDimension(
            id="transparency",
            name="Transparency",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Organizational disclosures evaluation pending.",
            evidence=[],
            limitations=[],
        ),
        TrustDnaDimension(
            id="page_behavior",
            name="Page Behavior",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Behavioral scripts evaluation pending.",
            evidence=[],
            limitations=[],
        ),
        TrustDnaDimension(
            id="content_consistency",
            name="Content and Offer Consistency",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Content claim consistency evaluation pending.",
            evidence=[],
            limitations=[],
        ),
        TrustDnaDimension(
            id="credential_payment",
            name="Credential and Payment Pressure",
            status=TrustDnaStatus.UNKNOWN,
            confidence=Confidence.LOW,
            summary="Payment and credential request evaluation pending.",
            evidence=[],
            limitations=[],
        ),
    ]

    all_limitations = [
        "This assessment does not prove fraud or guarantee safety.",
        "Analysis is based strictly on observable user-submitted content.",
    ]
    all_limitations.extend(norm_limitations)

    report = AnalysisReport(
        request_id=normalized_req.request_id,
        status="completed",
        assessment_status=AssessmentStatus.INCONCLUSIVE,
        summary="Request received and normalized successfully. Ready for evaluation pipeline.",
        analyzed_url=target_url,
        mode=normalized_req.mode,
        timestamp=datetime.now(timezone.utc),
        findings=[],
        trust_dna=initial_trust_dna,
        proof_mode=[],
        next_best_actions=[
            "Inspect claims independently via official channels.",
            "Do not submit credentials or payments without verification.",
        ],
        checks=ExecutedChecksSummary(
            executed=["normalization"],
            not_executed=[
                "url.ip_host",
                "url.obfuscation",
                "content.payment_pressure",
                "content.urgency",
                "content.credential_pressure",
            ],
            unavailable=[],
            failed=[],
        ),
        limitations=all_limitations,
    )

    log_request_event(
        event="analyze_request_completed",
        request_id=request.request_id,
        status="completed",
    )

    return report

