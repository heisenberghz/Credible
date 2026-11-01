# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript, React 19, Vite, Chrome Extension Manifest V3, Python FastAPI, Pydantic, Vitest, Pytest.

## Users

High-risk job seekers, remote applicants, freelancers, and students evaluating unfamiliar online job postings, recruitment portals, and unsolicited recruiter communications in real time.

## Product Purpose

Protect individuals from employment fraud, advance-fee scams, artificial urgency traps, and identity theft through observable client-side evidence, deterministic rules, and AI semantic reasoning.

## Positioning

Epistemological honesty with zero client PII leakage. Unlike opaque black-box AI checkers or slow domain reputation lists, Credible pairs deterministic client-side DOM heuristics with AI semantic analysis, backed by a verifiable 3-layer Proof Mode trace that strictly adheres to the core axiom: "Absence of a warning is not proof of safety."

## Operating Context

Dual-surface Chrome Extension (Manifest V3) operating within Chromium desktop browsers:
- **Contextual Side Panel (380px):** Fast, persistent companion for live page evaluation while actively browsing.
- **Full-Tab Command Center Dashboard (`src/dashboard/index.html`):** Expansive cybersecurity workstation for multi-column forensic analysis, heuristic matrix inspection, and Markdown/JSON dossier export.
- **Select-to-Verify Context Menu:** In-situ verification of highlighted snippets and suspicious email/chat text.

## Capabilities and Constraints

- **Client-Side Privacy Boundary:** Sensitive fields (`<input type="password">`, hidden auth tokens, credit cards) are strictly screened out before analysis. Zero outbound data leaks to unverified third parties.
- **Deterministic Heuristic Engine:** Instant regex and structural checks for bare IP hostnames, high-abuse TLDs, upfront crypto/deposit demands, artificial 24h scarcity timers, and premature identity document harvesting.
- **AI Semantic Reasoning:** Contextual reasoning via Gemini with automatic graceful degradation to deterministic-only rules during network outages or quota limits.
- **Trust DNA Multi-Factor Profile:** Evaluates 6 distinct dimensions (Payment Risk, Identity Risk, Social Engineering Risk, Data Exposure Risk, Link & Domain Risk, Evidence Confidence) with calibrated certainty levels.
- **Proof Mode Trace:** 3-layer epistemological breakdown for every finding (Raw Observed Signal + Threat Interpretation + External Corroboration).
- **Proportionate Action Runbook:** Interactive checklist guiding users through calm, actionable verification rituals.

## Brand Commitments

- **Swiss Architectural Aesthetic:** High-contrast, clean layout, structured grid rhythm, and tabular numerals (`font-variant-numeric: tabular-nums`).
- **Zero AI Slop / Gradients:** Strictly no purple-to-pink generic AI gradients. Solid, high-contrast signal colors only.
- **Signal Color Palette:** Solid Signal Emerald (`#059669`), Crimson (`#E11D48`), Amber (`#D97706`), Deep Cobalt (`#0052FF`), and Slate neutrals (`#0F172A`, `#475569`, `#F8FAFC`).
- **Typography:** System UI / SF Pro / Inter font stack with heavy mathematical precision, monospace metadata tags, and sharp geometric glyphs.

## Evidence on Hand

- Ground-truth calibration benchmark scenarios (`benign.html`, `suspicious.html`, `ambiguous.html`) validating deterministic triggers.
- Unit and integration test suites: 113 / 113 extension tests passing, 115 / 115 backend tests passing.
- Real DOM extraction fixtures validating strict password and PII stripping.

## Product Principles

1. **Absence of a Warning Is Not Proof of Safety:** Never fabricate safety or claim complete legitimacy. Unknown state remains explicitly `UNKNOWN`.
2. **Zero PII Leakage:** User privacy is non-negotiable; sensitive inputs never cross the extraction boundary.
3. **Evidence-Grounded Findings:** Every alert must cite observable text or DOM selectors; no ungrounded algorithmic accusations.
4. **Calm, Actionable Guidance:** Never induce alarmist panic; provide proportionate, verify-first next best actions.

## Accessibility & Inclusion

- WCAG AA contrast compliance across all text labels, badges, and dials.
- Accessible keyboard navigation (`Enter`, `Space`, `Escape`) across accordions, runbook checklists, and benchmark toggles.
- Screen-reader accessible SVG radial dials and ARIA live regions for scan progress.

