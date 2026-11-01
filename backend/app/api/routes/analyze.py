"""Analysis route for Credible API with end-to-end pipeline execution."""

from fastapi import APIRouter, HTTPException, status
from app.core.logging import log_request_event
from app.schemas.errors import ErrorCode, ErrorDetail, ErrorResponse
from app.schemas.reports import AnalysisReport
from app.schemas.requests import AnalysisRequest
from app.services.ai.service import AIService
from app.services.checks.registry import default_registry
from app.services.next_actions import generate_next_best_actions
from app.services.normalization import NormalizationError, normalize_request
from app.services.proof_mode import build_proof_mode
from app.services.reconciliation import reconcile_findings
from app.services.report_composer import ReportComposer
from app.services.trust_dna import build_trust_dna

router = APIRouter(prefix="/api/v1", tags=["Analysis"])
report_composer = ReportComposer()
ai_service = AIService()


@router.post(
    "/analyze",
    response_model=AnalysisReport,
    responses={
        400: {"model": ErrorResponse, "description": "Validation or Normalization Error"},
        422: {"model": ErrorResponse, "description": "Schema Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)
async def analyze_content(request: AnalysisRequest) -> AnalysisReport:
    """
    Execute full defensive cybersecurity analysis:
    1. Input normalization & content bounding
    2. Deterministic URL and text security checks
    3. AI contextual interpretation with prompt-injection defense
    4. Deterministic-first reconciliation
    5. Multidimensional Trust DNA generation
    6. Proof Mode evidence attribution
    7. Proportionate Next Best Actions
    8. Structured report composition
    """
    log_request_event(
        event="analyze_request_received",
        request_id=request.request_id,
        mode=request.mode.value,
    )

    # 1. Normalization & bounding
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

    # 2. Deterministic threat checks
    check_results, tracker = default_registry.run_all(normalized_req)

    # 3. AI contextual analysis (with resilient fallback if offline/unconfigured)
    ai_output, ai_limitations = await ai_service.run_ai_analysis(normalized_req, check_results)

    # 4. Finding reconciliation (deterministic guardrails take precedence)
    reconciled_findings, rec_limitations = reconcile_findings(check_results, ai_output)

    # 5. Trust DNA profile
    trust_dna = build_trust_dna(normalized_req, check_results, ai_output)

    # 6. Proof Mode inspection entries
    proof_mode = build_proof_mode(reconciled_findings)

    # 7. Next Best Actions
    next_actions = generate_next_best_actions(reconciled_findings, trust_dna)

    # 8. Compose structured report
    all_limitations = norm_limitations + ai_limitations + rec_limitations

    report = report_composer.compose(
        request=normalized_req,
        check_tracker=tracker,
        findings=reconciled_findings,
        trust_dna=trust_dna,
        proof_mode=proof_mode,
        next_actions=next_actions,
        limitations=all_limitations,
        ai_output=ai_output,
    )

    log_request_event(
        event="analyze_request_completed",
        request_id=request.request_id,
        status="completed",
        extra={"status": report.assessment_status.value, "findings": len(report.findings)},
    )

    return report
