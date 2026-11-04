"""Proof Mode builder for transparent evidence attribution."""

from typing import List
from app.schemas.findings import Finding, FindingSource
from app.schemas.reports import ProofModeEntry


def build_proof_mode(findings: List[Finding]) -> List[ProofModeEntry]:
    """
    Constructs Proof Mode inspection entries for each finding,
    clearly disclosing what was observed, where, why it matters,
    which check produced it, and whether it was deterministic vs AI-interpreted.
    """
    entries: List[ProofModeEntry] = []

    for f in findings:
        primary_evidence = f.evidence[0] if f.evidence else None
        observed_text = primary_evidence.excerpt if primary_evidence else f.title
        location_text = primary_evidence.source if primary_evidence else "submitted_content"
        why_text = primary_evidence.reason if primary_evidence else f.description

        is_det = f.source in (FindingSource.DETERMINISTIC, FindingSource.RECONCILED)

        entries.append(
            ProofModeEntry(
                finding_id=f.id,
                title=f.title,
                observed=observed_text,
                location=location_text,
                why_it_matters=why_text,
                check_id=f.check_id,
                source=f.source,
                is_deterministic=is_det,
                confidence=f.confidence,
                limitations=list(f.limitations),
            )
        )

    return entries

