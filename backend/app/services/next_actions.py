"""Next Best Action guidance generator."""

from typing import List, Optional
from app.schemas.findings import Finding, Severity
from app.schemas.reports import TrustDnaDimension, TrustDnaStatus


DEFAULT_SAFE_ACTIONS = [
    "Navigate to the organization's official website directly by typing its address into your browser.",
    "Search for the specific job or internship listing on the company's verified careers portal.",
    "Verify the recruiter's identity using independently sourced contact information.",
]


def generate_next_best_actions(
    findings: List[Finding],
    trust_dna: Optional[List[TrustDnaDimension]] = None,
) -> List[str]:
    """
    Generates tailored, prioritized, and proportionate next best actions.
    Ensures non-alarmist tone focused on protective practical steps.
    """
    if not findings:
        return list(DEFAULT_SAFE_ACTIONS)

    actions: List[str] = []
    seen = set()

    def add_action(act: str):
        cleaned = act.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            actions.append(cleaned)

    # 1. Critical actions: payment and credential protection first
    for f in findings:
        if f.severity in (Severity.CRITICAL, Severity.HIGH):
            if "payment" in f.id or "payment" in (f.check_id or ""):
                add_action("Do not transfer any fees, deposits, or advance money for an internship or job offer.")
            elif "credential" in f.id or "credential" in (f.check_id or ""):
                add_action("Do not share your account passwords, OTPs, or recovery phrases under any circumstances.")
            elif "data_exposure" in f.id:
                add_action("Refrain from uploading government identity cards or bank details before formal verification.")

    # 2. Add specific recommended actions from findings
    for f in findings:
        if f.recommended_action:
            add_action(f.recommended_action)

    # 3. Always include independent channel verification
    add_action("Visit the official employer or organization website independently to check for official openings.")
    add_action("If contacted via messaging apps (Telegram/WhatsApp), request confirmation through an official corporate email domain.")

    # Return top 4 prioritized actions
    return actions[:4]

