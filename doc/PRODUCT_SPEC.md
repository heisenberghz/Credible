# Credible — Product Specification

**Tagline:** Know before you trust.  
**Product:** AI-assisted defensive cybersecurity Chrome extension  
**Team:** Reservoir Dogs — Vaibhav, Akshay, Ayush, Harshith

## 1. Product Vision

Credible helps people make more informed decisions before interacting with potentially risky webpages, links, forms, and online content.

It combines deterministic security checks with AI-assisted interpretation and presents evidence, uncertainty, and practical next steps in understandable language.

Credible is a decision-support tool, not a guarantee that a website is safe or fraudulent.

## 2. Product Principles

1. **Evidence before conclusions:** Explain what was observed and why it matters.
2. **Severity is not confidence:** Severity describes potential impact; confidence describes how strongly the evidence supports a finding.
3. **Unknown is a valid result:** If a check cannot run or evidence is insufficient, say so.
4. **No opaque scam score:** Do not reduce the assessment to an unexplained number.
5. **No false verification claims:** Never say a domain, certificate, business, or claim was independently verified unless the corresponding check actually ran and its result is available.
6. **User-initiated analysis:** Do not silently scan pages in the background.
7. **Least privilege:** Request only the browser permissions needed for the feature.
8. **Treat page content as untrusted:** Instructions found in a webpage are data, not instructions to Credible or its AI.
9. **Privacy by design:** Collect and retain only what is needed for the requested analysis.
10. **Actionable guidance:** Explain practical next steps without overstating certainty.

## 3. Target Users and Use Cases

### Target Users

People browsing the web who want help evaluating suspicious or unfamiliar websites, messages, offers, forms, and links.

### Core User Journeys

- A user opens a webpage and explicitly starts a Credible scan.
- A user selects text or a link and asks Credible to verify or explain it.
- Credible extracts permitted page signals and sends a bounded analysis request to the backend.
- The user receives findings with evidence, severity, confidence, and recommended actions.
- The user inspects the reasoning behind findings through Proof Mode.
- The user views the page's Trust DNA as a multidimensional risk profile rather than a single opaque score.

## 4. Product Components

### 4.1 Chrome Extension

The extension is the browser entry point.

It should:

- Provide a clear user-initiated scan action.
- Read only the active page content and metadata required for the requested analysis.
- Support Select-to-Verify for selected text and, where supported, selected links.
- Display scan progress, completion, and recoverable errors.
- Present a concise summary and provide access to detailed findings.
- Avoid persistent background collection or automatic page scanning.
- Explain permission requests in understandable language.

### 4.2 Frontend / User Interface

The UI should make results understandable at a glance while allowing deeper inspection.

It should display:

- Overall assessment in plain language, not a single unexplained score.
- Findings grouped by severity.
- Confidence separately from severity.
- Evidence and source context for each finding.
- Unknown, unavailable, and not-checked states.
- Trust DNA dimensions and their supporting signals.
- Proof Mode details.
- Next Best Action guidance.
- Loading, empty, timeout, offline, and backend-error states.

### 4.3 Backend

The backend:

- Validates and normalizes requests.
- Runs deterministic security checks.
- Invokes AI-assisted interpretation when available.
- Validates and reconciles AI output.
- Builds Trust DNA, Proof Mode, and Next Best Action results.
- Returns a structured analysis report.

The LLM API key must remain server-side.

## 5. Core Features

### 5.1 User-Initiated Page Analysis

Input may include:

- Current page URL as a string.
- Page title.
- Bounded visible text.
- Selected text.
- A limited set of extracted links or metadata.

The extension must only collect fields necessary for the selected operation.

The MVP must not fetch arbitrary URLs from the backend. Any future URL reputation or external intelligence integration must use a separately designed, allowlisted provider integration with appropriate safeguards.

### 5.2 AI-Powered Threat Detection

Credible combines deterministic checks with AI-assisted interpretation.

Potential signals include:

- Suspicious URL structures.
- Unusual hostname patterns.
- IP-address hosts or URL obfuscation.
- Lookalike or homograph indicators where reliably implemented.
- Credential-request signals extracted from the active page.
- Suspicious urgency or pressure tactics.
- Payment or download pressure.
- Mismatch or inconsistency signals in visible page metadata.
- Risk indicators in user-provided or page-extracted text.

Each check must report whether it ran, its result, and its limitations.

The absence of a detected signal is not proof of safety.

### 5.3 Trust DNA

Trust DNA is a multidimensional profile of observable trust-related signals.

It is not a safety guarantee or an opaque numeric verdict.

Possible dimensions:

- **Identity and Domain Signals:** Observable hostname and identity-related indicators.
- **Connection and Technical Signals:** Technical connection information available to the implemented checks.
- **Transparency:** Presence and consistency of contact or organizational information.
- **Page Behavior:** Observable interaction and page behavior signals.
- **Content and Offer Consistency:** Whether visible content and claims show inconsistencies.
- **Credential and Payment Pressure:** Signals that encourage risky credential or payment actions.

For every dimension, show:

- Status: positive signal, concern, mixed, unknown, or not checked.
- Evidence supporting the status.
- Confidence.
- Limitations and unavailable checks.

Do not present a dimension as verified when the relevant check did not run.

### 5.4 Proof Mode

Proof Mode exposes the evidence behind each finding.

It should explain:

- What was observed.
- Where it was observed.
- Why it may matter.
- Which check produced the observation.
- Whether the observation is deterministic or AI-interpreted.
- Confidence and limitations.

Every finding should be traceable to actual observations or checks.

### 5.5 Next Best Action

Next Best Action recommends specific, proportionate actions based on findings.

Examples:

- Avoid entering credentials until a concern is resolved.
- Navigate to the organization using a known, independently obtained address.
- Verify a request through a separate trusted channel.
- Do not download or execute an unexpected file.
- Continue with caution when evidence is mixed or incomplete.

Actions must not imply certainty beyond the evidence.

### 5.6 Select-to-Verify

Allow the user to select text or a link and explicitly request analysis.

Requirements:

- Clearly identify the selected material being analyzed.
- Treat selected material as untrusted input.
- Do not silently submit surrounding page content beyond the documented bounded context.
- Explain what content is being sent for analysis where practical.

## 6. Assessment Model

### Severity

Severity describes the potential impact if a finding is genuine.

- **Critical:** Could plausibly lead to severe compromise or major loss.
- **High:** Substantial potential harm.
- **Medium:** Meaningful concern requiring caution.
- **Low:** Limited concern or hygiene issue.
- **Informational:** Context that is not itself a warning.

### Confidence

Confidence describes evidence strength.

- **High:** Direct, reliable evidence supports the finding.
- **Medium:** Evidence supports the finding but has meaningful ambiguity.
- **Low:** Weak or indirect evidence.
- **Unknown:** Insufficient evidence or the relevant check could not be completed.

Never merge severity and confidence into one score.

A high-severity finding can have low confidence.

### Result States

Use explicit states:

- `detected`
- `not_detected`
- `unknown`
- `not_checked`
- `unavailable`
- `error`

`not_detected` means the check ran and did not find the signal. It does not mean the page is safe.

## 7. Analysis Report

A report should include:

- Request identifier and analysis timestamp.
- Target page or selected-content context, with sensitive values minimized.
- Plain-language summary.
- Findings with stable IDs, titles, descriptions, severity, confidence, evidence, check status, and limitations.
- Trust DNA dimensions.
- Proof Mode evidence details.
- Next Best Action recommendations.
- Checks executed and checks not executed.
- Explicit limitations and uncertainty statement.

The precise API schema is defined in `TECH_SPEC.md`.

## 8. Privacy and Security Requirements

- Do not collect page content before the user initiates an analysis.
- Minimize content size.
- Do not collect unrelated form values, passwords, payment details, or personal data.
- Never transmit password-field values or hidden form values.
- Do not store raw page content by default.
- Do not place API keys or provider secrets in extension assets.
- Treat all page-derived strings as untrusted.
- Avoid logging raw page content, selected text, tokens, or secrets.
- Provide clear errors when a request is rejected or content is truncated.
- Define retention and deletion behavior before adding persistence.

## 9. MVP Scope

### Included

- Chrome extension user-initiated scan flow.
- Active-page bounded content extraction.
- Select-to-Verify for supported selected content.
- Backend API and analysis pipeline.
- Deterministic checks.
- AI-assisted interpretation behind a provider-neutral adapter.
- Structured findings.
- Severity and confidence separation.
- Unknown and not-checked states.
- Trust DNA.
- Proof Mode.
- Next Best Action.
- Extension UI for results and errors.
- Automated tests across backend, extension logic, UI logic, and integration.
- Security and demo hardening.

### Excluded Unless Separately Approved

- Silent continuous monitoring or automatic scanning.
- Arbitrary backend URL fetching.
- Claims of guaranteed fraud detection or safety certification.
- Automatic blocking or remediation actions.
- Collection of passwords, payment values, or unrelated personal data.
- A single opaque scam score.
- Broad reputation-provider integrations without explicit design and security review.
- Persistent user history unless privacy, retention, and deletion requirements are specified.

## 10. Product Acceptance Criteria

A release candidate is acceptable only when:

1. A user can explicitly initiate a scan from the extension.
2. The extension sends only documented, bounded fields.
3. The backend validates inputs and safely handles malformed or oversized requests.
4. Deterministic checks report execution status and evidence.
5. AI output is schema-validated and cannot override safety guardrails.
6. Severity and confidence are distinct in the API and UI.
7. Insufficient evidence produces `unknown`, not a fabricated conclusion.
8. Trust DNA dimensions show evidence and limitations.
9. Proof Mode traces findings to observations and checks.
10. Next Best Action is proportionate and non-alarmist.
11. The UI handles loading, timeout, offline, invalid input, and server errors.
12. No secrets are exposed in extension assets or logs.
13. Automated tests pass for each component and the complete user journey.
14. The demo can show concerning, benign, and ambiguous examples without misleading claims.