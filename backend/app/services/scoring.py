"""
Scoring service computing transparent multi-factor credibility score (1-100).
Absence of warning indicators is not proof of absolute safety.
"""
from typing import List
from app.schemas.findings import Finding, Severity
from app.schemas.reports import TrustDnaDimension, TrustDnaStatus


def calculate_credibility_score(
    findings: List[Finding],
    trust_dna: List[TrustDnaDimension],
    has_content: bool,
) -> int:
    """
    Computes a transparent defensive credibility score between 1 and 100.
    100 = Optimal observable signals with zero detected threat indicators.
    50-84 = Caution / elevated risk patterns observed.
    1-49 = Suspicious / high-risk threat indicators confirmed.
    """
    if not has_content:
        return 50  # Inconclusive neutral baseline

    base_score = 100

    # 1. Deductions for confirmed findings based on severity
    for finding in findings:
        if finding.severity == Severity.CRITICAL:
            base_score -= 35
        elif finding.severity == Severity.HIGH:
            base_score -= 25
        elif finding.severity == Severity.MEDIUM:
            base_score -= 12
        elif finding.severity == Severity.LOW:
            base_score -= 5

    # 2. Deductions for Trust DNA dimensions with warnings
    for dimension in trust_dna:
        if dimension.status == TrustDnaStatus.WARNING_FOUND:
            base_score -= 8
        elif dimension.status == TrustDnaStatus.UNKNOWN:
            # Minor uncertainty deduction for unverified external records
            base_score -= 3

    # Ensure score stays bounded strictly between 1 and 100
    return max(1, min(100, base_score))

