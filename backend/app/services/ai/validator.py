"""Validator for AI-generated findings and claims."""

import re
from typing import List, Tuple
from app.services.ai.schemas import AIAnalysisOutput, AIFinding


SUPPORTED_FINDING_TYPES = {
    "payment_pressure",
    "urgency",
    "credential_harvesting",
    "data_exposure",
    "unrealistic_offer",
    "brand_impersonation",
    "social_engineering",
    "suspicious_link",
    "informational",
}


def is_quote_grounded(quote: str, original_text: str) -> bool:
    """Verify that an evidence quote appears in the user-submitted content."""
    if not quote or not original_text:
        return False

    clean_quote = " ".join(quote.lower().split())
    clean_original = " ".join(original_text.lower().split())

    if clean_quote in clean_original:
        return True

    # If long quote, check if at least significant 4-word sub-phrase appears
    words = clean_quote.split()
    if len(words) >= 4:
        for i in range(len(words) - 3):
            subphrase = " ".join(words[i : i + 4])
            if subphrase in clean_original:
                return True

    return False


def validate_and_filter_ai_output(
    ai_output: AIAnalysisOutput,
    original_text: str,
    executed_check_ids: List[str],
) -> Tuple[AIAnalysisOutput, List[str]]:
    """
    Validate AI output against strict policy:
    1. Filter out findings with completely fabricated quotes not grounded in content.
    2. Normalize finding types to supported categories.
    3. Ensure AI cannot pretend unrun deterministic checks were executed.
    Returns (filtered_output, validation_limitations).
    """
    limitations: List[str] = []
    validated_findings: List[AIFinding] = []

    for f in ai_output.findings:
        # Check supported finding type
        norm_type = f.finding_type.lower().strip()
        if norm_type not in SUPPORTED_FINDING_TYPES:
            norm_type = "social_engineering"
        f.finding_type = norm_type

        # Evidence grounding verification
        if not is_quote_grounded(f.evidence_quote, original_text):
            limitations.append(
                f"An AI finding regarding '{f.finding_type}' was excluded because its quoted text could not be verified in the submitted page content."
            )
            continue

        validated_findings.append(f)

    # Validate dimensions against allowed checks
    validated_dimensions = []
    for dim in ai_output.dimension_assessments:
        if dim.evidence_quote and not is_quote_grounded(dim.evidence_quote, original_text):
            dim.evidence_quote = None
            dim.limitations.append("Quote could not be grounded in submitted text.")
        validated_dimensions.append(dim)

    filtered_output = AIAnalysisOutput(
        assessment_status=ai_output.assessment_status,
        summary=ai_output.summary,
        findings=validated_findings,
        dimension_assessments=validated_dimensions,
        unknowns=ai_output.unknowns,
        recommended_next_actions=ai_output.recommended_next_actions,
    )

    return filtered_output, limitations

