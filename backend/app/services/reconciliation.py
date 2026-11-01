"""Reconciliation service merging deterministic rules with AI interpretation."""

from typing import List, Optional, Tuple
from app.schemas.findings import (
    CheckResult,
    CheckStatus,
    Confidence,
    Evidence,
    Finding,
    FindingSource,
    Severity,
)
from app.services.ai.schemas import AIAnalysisOutput, AIFinding


CHECK_CATEGORY_MAP = {
    "url.ip_host": "ip_host",
    "url.suspicious_tld": "suspicious_tld",
    "url.obfuscation": "url_obfuscation",
    "url.lookalike": "brand_impersonation",
    "url.length": "url_length",
    "content.payment_pressure": "payment_pressure",
    "content.urgency": "urgency",
    "content.credential_pressure": "credential_harvesting",
    "content.data_exposure": "data_exposure",
    "content.unrealistic_promises": "unrealistic_offer",
}

CHECK_TITLES = {
    "url.ip_host": "Direct IP Address Host",
    "url.suspicious_tld": "Suspicious Top-Level Domain",
    "url.obfuscation": "Obfuscated URL Structure",
    "url.lookalike": "Brand Lookalike / Typosquat Domain",
    "url.length": "Abnormally Long URL",
    "content.payment_pressure": "Upfront Payment or Deposit Requested",
    "content.urgency": "Urgency and Scarcity Pressure",
    "content.credential_pressure": "Credential or Password Demanded",
    "content.data_exposure": "Sensitive Identity Document Request",
    "content.unrealistic_promises": "Unrealistic Compensation or Guaranteed Offer",
}

CHECK_ACTIONS = {
    "url.ip_host": "Do not navigate or submit credentials to raw IP addresses.",
    "url.suspicious_tld": "Verify company identity via established official domain records.",
    "url.obfuscation": "Inspect full destination address before opening or sharing links.",
    "url.lookalike": "Visit official brand website independently without clicking provided link.",
    "url.length": "Check where the link actually leads before interacting.",
    "content.payment_pressure": "Do not send fees, deposits, or crypto for employment or internships.",
    "content.urgency": "Pause and verify opportunity independently before taking rushed action.",
    "content.credential_pressure": "Never enter passwords, PINs, or OTPs on recruitment or unverified pages.",
    "content.data_exposure": "Do not upload national identity cards or bank details on initial application.",
    "content.unrealistic_promises": "Research typical role compensation and requirements on verified salary boards.",
}


def build_finding_from_check(check: CheckResult) -> Finding:
    """Construct a standardized Finding from a detected deterministic CheckResult."""
    title = CHECK_TITLES.get(check.check_id, f"Security Warning: {check.check_id}")
    action = CHECK_ACTIONS.get(check.check_id, "Verify opportunity through independent channels.")

    return Finding(
        id=check.check_id.replace(".", "-"),
        title=title,
        description=check.evidence[0].reason if check.evidence else "Threat pattern detected by security check.",
        severity=check.severity or Severity.MEDIUM,
        confidence=check.confidence,
        status=CheckStatus.DETECTED,
        evidence=list(check.evidence),
        check_id=check.check_id,
        source=FindingSource.DETERMINISTIC,
        limitations=list(check.limitations),
        recommended_action=action,
    )


def reconcile_findings(
    deterministic_checks: List[CheckResult],
    ai_output: Optional[AIAnalysisOutput] = None,
) -> Tuple[List[Finding], List[str]]:
    """
    Reconciles deterministic rules with AI contextual interpretation.
    Rules:
    1. Deterministic evidence always takes precedence over AI.
    2. AI cannot downgrade, suppress, or dismiss a detected deterministic check.
    3. If both rule and AI detect same signal, merge and tag as RECONCILED.
    4. If AI detects novel grounded finding not covered by rules, add as AI_INTERPRETED.
    5. Severity and confidence are strictly kept separate.
    """
    reconciled_findings: List[Finding] = []
    limitations: List[str] = []

    # Map of category -> finding
    category_to_finding = {}

    # 1. Process all detected deterministic checks first (ground truth)
    detected_checks = [c for c in deterministic_checks if c.status == CheckStatus.DETECTED]
    for check in detected_checks:
        finding = build_finding_from_check(check)
        cat = CHECK_CATEGORY_MAP.get(check.check_id, check.check_id)
        category_to_finding[cat] = finding
        reconciled_findings.append(finding)

    # 2. Reconcile with AI output if available
    if ai_output and ai_output.findings:
        for ai_f in ai_output.findings:
            ai_cat = ai_f.finding_type.lower().strip()

            if ai_cat in category_to_finding:
                # Both rule and AI detected this category: merge & tag as RECONCILED
                existing = category_to_finding[ai_cat]

                # Deterministic severity takes precedence (guardrail)
                # AI cannot downgrade e.g. HIGH -> LOW
                if ai_f.explanation:
                    existing.description = f"{existing.description} Context: {ai_f.explanation}"
                if ai_f.recommended_action:
                    existing.recommended_action = ai_f.recommended_action

                # Append AI evidence if unique
                if ai_f.evidence_quote and not any(ai_f.evidence_quote in e.excerpt for e in existing.evidence):
                    existing.evidence.append(
                        Evidence(
                            source="ai_context",
                            excerpt=ai_f.evidence_quote,
                            reason=ai_f.explanation,
                        )
                    )

                existing.source = FindingSource.RECONCILED

            else:
                # Novel finding identified by AI
                novel_id = f"ai-{ai_cat}-{len(reconciled_findings) + 1}"
                novel_finding = Finding(
                    id=novel_id,
                    title=f"Contextual Alert: {ai_f.finding_type.replace('_', ' ').title()}",
                    description=ai_f.explanation,
                    severity=ai_f.severity,
                    confidence=ai_f.confidence,
                    status=CheckStatus.DETECTED,
                    evidence=[
                        Evidence(
                            source="ai_context",
                            excerpt=ai_f.evidence_quote,
                            reason=ai_f.explanation,
                        )
                    ],
                    check_id=None,
                    source=FindingSource.AI_INTERPRETED,
                    limitations=["Finding generated via contextual AI evaluation."],
                    recommended_action=ai_f.recommended_action,
                )
                category_to_finding[ai_cat] = novel_finding
                reconciled_findings.append(novel_finding)

    return reconciled_findings, limitations

