"""Mock AI provider for repeatable offline testing and demo scenarios."""

from typing import List, Optional
from app.schemas.findings import CheckResult, CheckStatus, Confidence, Severity
from app.schemas.reports import AssessmentStatus, TrustDnaStatus
from app.schemas.requests import AnalysisRequest
from app.services.ai.base import AIProvider
from app.services.ai.schemas import AIAnalysisOutput, AIDimensionAssessment, AIFinding


class MockAIProvider(AIProvider):
    provider_name = "mock"

    def __init__(self, override_output: Optional[AIAnalysisOutput] = None, should_fail: bool = False, should_timeout: bool = False):
        self.override_output = override_output
        self.should_fail = should_fail
        self.should_timeout = should_timeout

    def is_configured(self) -> bool:
        return True

    async def analyze(
        self,
        request: AnalysisRequest,
        deterministic_checks: List[CheckResult],
    ) -> AIAnalysisOutput:
        if self.should_timeout:
            raise TimeoutError("Mock AI provider timed out.")
        if self.should_fail:
            raise RuntimeError("Mock AI provider simulated outage.")
        if self.override_output:
            return self.override_output

        # Context-aware mock response based on deterministic detections
        detected = [r for r in deterministic_checks if r.status == CheckStatus.DETECTED]

        findings = []
        for r in detected:
            findings.append(
                AIFinding(
                    finding_type=r.check_id.replace("content.", "").replace("url.", ""),
                    severity=r.severity or Severity.MEDIUM,
                    confidence=r.confidence,
                    evidence_quote=r.evidence[0].excerpt if r.evidence else "Observed signal",
                    explanation=f"AI confirmed contextual concern based on {r.check_id}.",
                    recommended_action="Verify employer background through official independent channels.",
                )
            )

        status = AssessmentStatus.SUSPICIOUS if findings else AssessmentStatus.BENIGN
        summary = "AI analysis flagged social-engineering indicators requiring caution." if findings else "No immediate deceptive indicators detected in visible text."

        return AIAnalysisOutput(
            assessment_status=status,
            summary=summary,
            findings=findings,
            dimension_assessments=[
                AIDimensionAssessment(
                    dimension_id="content_consistency",
                    status=TrustDnaStatus.CONCERN if findings else TrustDnaStatus.POSITIVE,
                    confidence=Confidence.HIGH,
                    summary="Content analysis completed.",
                    evidence_quote=findings[0].evidence_quote if findings else None,
                    limitations=[],
                )
            ],
            unknowns=["Employer incorporation status could not be verified from page content."],
            recommended_next_actions=[
                "Do not submit advance payments or sensitive documents.",
                "Visit the company's official corporate careers page independently.",
            ],
        )

