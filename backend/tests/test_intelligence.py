"""Unit tests for Trust DNA, Proof Mode, and Next Best Actions (Task 8)."""

import pytest

from app.schemas.findings import (
    CheckResult,
    CheckStatus,
    Confidence,
    Evidence,
    Finding,
    FindingSource,
    Severity,
)
from app.schemas.reports import TrustDnaStatus
from app.schemas.requests import AnalysisMode, AnalysisRequest, PageData
from app.services.next_actions import generate_next_best_actions
from app.services.proof_mode import build_proof_mode
from app.services.trust_dna import build_trust_dna


class TestTrustDnaBuilder:
    def test_trust_dna_produces_all_six_dimensions(self):
        req = AnalysisRequest(
            request_id="test-dna-1",
            mode=AnalysisMode.PAGE,
            page=PageData(url="https://careers.google.com/jobs", visible_text="Clean internship description"),
        )
        dimensions = build_trust_dna(req, deterministic_checks=[])

        assert len(dimensions) == 6
        dim_ids = [d.id for d in dimensions]
        assert dim_ids == [
            "payment_risk",
            "identity_risk",
            "social_engineering_risk",
            "data_exposure_risk",
            "link_domain_risk",
            "evidence_confidence",
        ]

    def test_suspicious_signals_reflect_concerns(self):
        req = AnalysisRequest(
            request_id="test-dna-2",
            mode=AnalysisMode.PAGE,
            page=PageData(url="http://192.168.1.50/pay", visible_text="Pay ₹3000 registration fee"),
        )
        checks = [
            CheckResult(
                check_id="url.ip_host",
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[Evidence(source="url", excerpt="192.168.1.50", reason="IP host")],
            ),
            CheckResult(
                check_id="content.payment_pressure",
                status=CheckStatus.DETECTED,
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                evidence=[Evidence(source="visible_text", excerpt="Pay ₹3000", reason="Fee")],
            ),
        ]

        dimensions = build_trust_dna(req, checks)
        dim_map = {d.id: d for d in dimensions}

        assert dim_map["link_domain_risk"].status == TrustDnaStatus.WARNING_FOUND
        assert dim_map["payment_risk"].status == TrustDnaStatus.WARNING_FOUND
        assert "WHOIS" in dim_map["identity_risk"].limitations[0]


class TestProofModeBuilder:
    def test_proof_mode_traces_findings_accurately(self):
        findings = [
            Finding(
                id="content-payment_pressure",
                title="Upfront Payment Requested",
                description="Fee required to participate.",
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                status=CheckStatus.DETECTED,
                evidence=[
                    Evidence(source="visible_text", excerpt="Pay ₹5000 deposit", reason="Financial risk")
                ],
                check_id="content.payment_pressure",
                source=FindingSource.DETERMINISTIC,
                limitations=["Heuristic rule observation."],
            ),
            Finding(
                id="ai-social-eng-1",
                title="Coercive Tone",
                description="High pressure psychological manipulation.",
                severity=Severity.MEDIUM,
                confidence=Confidence.MEDIUM,
                status=CheckStatus.DETECTED,
                evidence=[
                    Evidence(source="ai_context", excerpt="Act now or miss out", reason="Psychological urgency")
                ],
                check_id=None,
                source=FindingSource.AI_INTERPRETED,
                limitations=["Contextual interpretation."],
            ),
        ]

        proof_entries = build_proof_mode(findings)
        assert len(proof_entries) == 2

        # First entry: deterministic
        assert proof_entries[0].finding_id == "content-payment_pressure"
        assert proof_entries[0].observed == "Pay ₹5000 deposit"
        assert proof_entries[0].is_deterministic is True
        assert proof_entries[0].check_id == "content.payment_pressure"

        # Second entry: AI interpreted
        assert proof_entries[1].finding_id == "ai-social-eng-1"
        assert proof_entries[1].observed == "Act now or miss out"
        assert proof_entries[1].is_deterministic is False


class TestNextBestActions:
    def test_default_actions_when_no_threats(self):
        actions = generate_next_best_actions(findings=[])
        assert len(actions) == 3
        assert any("official website directly" in a for a in actions)

    def test_prioritizes_payment_and_credentials_without_alarmism(self):
        findings = [
            Finding(
                id="content-payment_pressure",
                title="Fee Requested",
                description="Fee demanded.",
                severity=Severity.HIGH,
                confidence=Confidence.HIGH,
                status=CheckStatus.DETECTED,
                evidence=[],
                check_id="content.payment_pressure",
                recommended_action="Do not pay any unverified recruiters.",
            )
        ]

        actions = generate_next_best_actions(findings)
        assert len(actions) <= 4
        # First action should be protective financial guidance
        assert "Do not transfer any fees" in actions[0]
        # Language is calm, proportionate, non-alarmist
        assert not any("HACKED" in a or "SCAMMER" in a or "CRIMINAL" in a for a in actions)

