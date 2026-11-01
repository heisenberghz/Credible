"""Report composer service assembling complete, structured analysis reports."""

from datetime import datetime, timezone
from typing import List, Optional

from app.schemas.findings import Finding, Severity
from app.schemas.reports import (
    AnalysisReport,
    AssessmentStatus,
    ExecutedChecksSummary,
    ProofModeEntry,
    TrustDnaDimension,
    TrustDnaStatus,
)
from app.schemas.requests import AnalysisMode, AnalysisRequest
from app.services.ai.schemas import AIAnalysisOutput
from app.services.checks.base import CheckExecutionTracker
from app.services.scoring import calculate_credibility_score


STANDARD_LIMITATIONS = [
    "This assessment does not prove fraud or guarantee that an opportunity is legitimate.",
    "Findings are derived solely from user-submitted content and observable technical signals.",
    "Users should always verify opportunities independently via official employer channels.",
]


class ReportComposer:
    """Assembles final, validated AnalysisReport from all pipeline stages."""

    @staticmethod
    def determine_assessment_status(
        findings: List[Finding],
        trust_dna: List[TrustDnaDimension],
        has_content: bool,
    ) -> AssessmentStatus:
        if not has_content:
            return AssessmentStatus.INCONCLUSIVE

        severities = {f.severity for f in findings}
        if Severity.CRITICAL in severities or Severity.HIGH in severities:
            return AssessmentStatus.SUSPICIOUS
        elif Severity.MEDIUM in severities:
            return AssessmentStatus.CAUTION
        elif Severity.LOW in severities:
            return AssessmentStatus.NEEDS_VERIFICATION

        # If any Trust DNA dimension has a warning found
        if any(d.status in (TrustDnaStatus.WARNING_FOUND, TrustDnaStatus.CONCERN) for d in trust_dna):
            return AssessmentStatus.CAUTION

        return AssessmentStatus.BENIGN

    @staticmethod
    def compose_summary(
        assessment_status: AssessmentStatus,
        findings: List[Finding],
        ai_output: Optional[AIAnalysisOutput] = None,
    ) -> str:
        if ai_output and ai_output.summary and len(ai_output.summary.strip()) > 10:
            return ai_output.summary.strip()

        if assessment_status == AssessmentStatus.SUSPICIOUS:
            primary_reasons = [f.title for f in findings[:2]]
            reasons_str = " and ".join(primary_reasons) if primary_reasons else "high-risk patterns"
            return f"Significant warning indicators detected: {reasons_str}. Independent verification is strongly advised before proceeding."
        elif assessment_status == AssessmentStatus.CAUTION:
            return "Potential social-engineering or ambiguous urgency indicators detected. Proceed with caution and verify independently."
        elif assessment_status == AssessmentStatus.NEEDS_VERIFICATION:
            return "Content requires independent verification before sharing personal details or taking action."
        elif assessment_status == AssessmentStatus.BENIGN:
            return "No immediate deceptive indicators or fee requests detected in analyzed content. Always confirm listings on official channels."
        else:
            return "Insufficient content available to establish a conclusive assessment."

    def compose(
        self,
        request: AnalysisRequest,
        check_tracker: CheckExecutionTracker,
        findings: List[Finding],
        trust_dna: List[TrustDnaDimension],
        proof_mode: List[ProofModeEntry],
        next_actions: List[str],
        limitations: List[str],
        ai_output: Optional[AIAnalysisOutput] = None,
    ) -> AnalysisReport:
        target_url = ""
        has_content = False

        if request.mode == AnalysisMode.PAGE and request.page:
            target_url = request.page.url
            has_content = bool(request.page.visible_text.strip())
        elif request.mode == AnalysisMode.SELECTION and request.selection:
            target_url = request.selection.url
            has_content = bool(request.selection.text.strip())

        status = self.determine_assessment_status(findings, trust_dna, has_content)
        summary = self.compose_summary(status, findings, ai_output)

        # Merge limitations (deduplicated)
        merged_limitations = []
        seen = set()
        for lim in limitations + STANDARD_LIMITATIONS:
            cleaned = lim.strip()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                merged_limitations.append(cleaned)

        tracker_summary = check_tracker.to_summary()
        credibility_score = calculate_credibility_score(findings, trust_dna, has_content)

        return AnalysisReport(
            request_id=request.request_id,
            status="completed",
            assessment_status=status,
            score=credibility_score,
            summary=summary,
            analyzed_url=target_url,
            mode=request.mode,
            timestamp=datetime.now(timezone.utc),
            findings=findings,
            trust_dna=trust_dna,
            proof_mode=proof_mode,
            next_best_actions=next_actions,
            checks=ExecutedChecksSummary(
                executed=tracker_summary.get("executed", []),
                not_executed=tracker_summary.get("not_executed", []),
                unavailable=tracker_summary.get("unavailable", []),
                failed=tracker_summary.get("failed", []),
            ),
            limitations=merged_limitations,
        )

