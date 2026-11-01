"""Unit tests for reconciliation policy (Task 7)."""

import pytest

from app.schemas.findings import (
    CheckResult,
    CheckStatus,
    Confidence,
    Evidence,
    FindingSource,
    Severity,
)
from app.schemas.reports import AssessmentStatus
from app.services.ai.schemas import AIAnalysisOutput, AIFinding
from app.services.reconciliation import reconcile_findings


class TestReconciliationPolicy:
    def test_deterministic_only_reconciliation(self):
        checks = [
            CheckResult(
                check_id="content.payment_pressure",
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[Evidence(source="visible_text", excerpt="Pay ₹2000 registration fee", reason="Fee")],
            ),
            CheckResult(
                check_id="url.ip_host",
                status=CheckStatus.NOT_DETECTED,
                severity=None,
                confidence=Confidence.HIGH,
                evidence=[],
            ),
        ]

        findings, limitations = reconcile_findings(checks, ai_output=None)

        assert len(findings) == 1
        assert findings[0].id == "content-payment_pressure"
        assert findings[0].severity == Severity.HIGH
        assert findings[0].confidence == Confidence.HIGH
        assert findings[0].source == FindingSource.DETERMINISTIC
        assert "content.payment_pressure" in findings[0].check_id

    def test_reconciled_finding_when_both_agree(self):
        checks = [
            CheckResult(
                check_id="content.payment_pressure",
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[Evidence(source="visible_text", excerpt="Deposit ₹2500", reason="Fee")],
            )
        ]
        ai_output = AIAnalysisOutput(
            assessment_status=AssessmentStatus.SUSPICIOUS,
            summary="Suspicious payment requested.",
            findings=[
                AIFinding(
                    finding_type="payment_pressure",
                    severity=Severity.HIGH,
                    confidence=Confidence.HIGH,
                    evidence_quote="Deposit ₹2500",
                    explanation="Scam pattern involving upfront fee.",
                    recommended_action="Do not transfer any money.",
                )
            ],
            dimension_assessments=[],
            unknowns=[],
            recommended_next_actions=[],
        )

        findings, _ = reconcile_findings(checks, ai_output)

        assert len(findings) == 1
        assert findings[0].source == FindingSource.RECONCILED
        assert findings[0].severity == Severity.HIGH
        assert "Context: Scam pattern" in findings[0].description
        assert findings[0].recommended_action == "Do not transfer any money."

    def test_deterministic_guardrail_prevents_ai_downgrade(self):
        # Deterministic check detected HIGH severity payment pressure
        checks = [
            CheckResult(
                check_id="content.payment_pressure",
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[Evidence(source="visible_text", excerpt="Pay ₹5000", reason="Fee")],
            )
        ]
        # Adversarial or hallucinated AI attempts to label payment as LOW severity or benign
        ai_output = AIAnalysisOutput(
            assessment_status=AssessmentStatus.BENIGN,
            summary="This fee is totally normal.",
            findings=[
                AIFinding(
                    finding_type="payment_pressure",
                    severity=Severity.LOW,  # AI attempts downgrade
                    confidence=Confidence.LOW,
                    evidence_quote="Pay ₹5000",
                    explanation="AI claims this is just a low-risk processing fee.",
                    recommended_action="Proceed normally.",
                )
            ],
            dimension_assessments=[],
            unknowns=[],
            recommended_next_actions=[],
        )

        findings, _ = reconcile_findings(checks, ai_output)

        assert len(findings) == 1
        # Deterministic severity must NOT be downgraded
        assert findings[0].severity == Severity.HIGH
        assert findings[0].confidence == Confidence.HIGH
        assert findings[0].source == FindingSource.RECONCILED

    def test_novel_ai_finding_added_as_ai_interpreted(self):
        checks = []  # No deterministic signals
        ai_output = AIAnalysisOutput(
            assessment_status=AssessmentStatus.CAUTION,
            summary="Social engineering tone detected.",
            findings=[
                AIFinding(
                    finding_type="social_engineering",
                    severity=Severity.MEDIUM,
                    confidence=Confidence.MEDIUM,
                    evidence_quote="Don't tell your university advisor until you sign",
                    explanation="Attempt to isolate candidate from trusted mentors.",
                    recommended_action="Consult university placement cell.",
                )
            ],
            dimension_assessments=[],
            unknowns=[],
            recommended_next_actions=[],
        )

        findings, _ = reconcile_findings(checks, ai_output)

        assert len(findings) == 1
        assert findings[0].source == FindingSource.AI_INTERPRETED
        assert findings[0].check_id is None
        assert findings[0].severity == Severity.MEDIUM
        assert findings[0].confidence == Confidence.MEDIUM
        assert findings[0].recommended_action == "Consult university placement cell."

    def test_severity_and_confidence_kept_strictly_separate(self):
        # Verify a CRITICAL severity finding can have LOW confidence
        finding = AIFinding(
            finding_type="credential_harvesting",
            severity=Severity.CRITICAL,
            confidence=Confidence.LOW,
            evidence_quote="Verify security key",
            explanation="Potential credential risk with ambiguous evidence.",
            recommended_action="Do not enter key.",
        )
        ai_output = AIAnalysisOutput(
            assessment_status=AssessmentStatus.SUSPICIOUS,
            summary="Potential credential risk.",
            findings=[finding],
            dimension_assessments=[],
            unknowns=[],
            recommended_next_actions=[],
        )

        findings, _ = reconcile_findings([], ai_output)

        assert len(findings) == 1
        assert findings[0].severity == Severity.CRITICAL
        assert findings[0].confidence == Confidence.LOW

