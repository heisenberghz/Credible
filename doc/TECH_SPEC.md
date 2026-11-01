# Credible — Technical Specification

## 1. Purpose

This document defines the implementation architecture for the complete Credible product:

- Chrome extension.
- Frontend and user experience.
- Backend API.
- Deterministic threat detection.
- AI-assisted analysis.
- Trust DNA, Proof Mode, and Next Best Action.
- End-to-end integration.
- Testing, security, and deployment readiness.

## 2. Recommended Technology Stack

These are recommended defaults. The coding agent must inspect the existing repository before choosing or replacing technologies.

| Component | Recommended Technology |
|---|---|
| Backend | Python 3.11+ |
| Backend API | FastAPI |
| Validation | Pydantic |
| Backend tests | pytest |
| Extension | Chrome Manifest V3 |
| Extension language | TypeScript |
| Frontend | React with TypeScript, if appropriate |
| Frontend tests | Vitest or repository-native test runner |
| Browser testing | Playwright, where feasible |
| AI integration | Provider-neutral server-side adapter |

Do not replace existing project choices without first inspecting the repository and explaining why a change is needed.

## 3. High-Level Architecture

```text
Chrome Active Tab
       |
       | User explicitly clicks Scan
       v
Chrome Extension UI
       |
       v
Content Extraction
       |
       | Bounded, documented JSON request
       v
Backend API (FastAPI)
       |
       +--> Request Validation
       |
       +--> Normalization
       |
       +--> Deterministic Checks
       |
       +--> AI Interpretation
       |
       +--> Output Validation
       |
       +--> Evidence Reconciliation
       |
       +--> Trust DNA
       |
       +--> Proof Mode
       |
       +--> Next Best Action
       |
       v
Structured Analysis Report
       |
       v
Extension UI
       |
       +--> Assessment Summary
       +--> Findings
       +--> Trust DNA
       +--> Proof Mode
       +--> Recommended Actions
```

The extension must not contain the LLM API key.

The backend must not fetch arbitrary user-submitted URLs in the MVP.

## 4. Repository-First Implementation Rules

Before modifying code, the coding agent must:

1. Inspect the repository structure.
2. Read existing documentation and PRD files.
3. Inspect package manifests, dependencies, and environment configuration.
4. Identify existing backend, frontend, and extension code.
5. Inspect existing tests and scripts.
6. Identify existing frameworks and conventions.
7. Report the proposed implementation plan and any conflicts with this specification.
8. Preserve working code and avoid unnecessary rewrites.

Do not create duplicate app roots, competing configuration files, or parallel implementations.

If an important architectural decision is unclear, document the uncertainty and ask before making a high-impact change.

## 5. Backend Architecture

Suggested structure, to be adapted to the actual repository:

```text
backend/
  app/
    main.py

    api/
      routes/
        health.py
        analyze.py

    schemas/
      requests.py
      reports.py
      findings.py

    services/
      normalization.py

      deterministic_checks/

      ai/
        base.py
        provider.py

      reconciliation.py
      trust_dna.py
      proof_mode.py
      next_actions.py
      report_composer.py

    core/
      config.py
      logging.py

  tests/
```

### API Endpoints

#### GET /health

Checks backend availability.

#### POST /api/v1/analyze

Analyzes a user-initiated page or selection request.

Avoid creating unnecessary duplicate endpoints. Use a mode field in the request unless a separate selection endpoint provides a clear architectural benefit.

### Example Request

```json
{
  "request_id": "client-generated-uuid",
  "mode": "page",
  "page": {
    "url": "https://example.test/path",
    "title": "Example page",
    "visible_text": "Bounded visible text",
    "links": [
      {
        "text": "Sign in",
        "href": "https://example.test/login"
      }
    ]
  },
  "selection": null,
  "client_context": {
    "extension_version": "0.1.0"
  }
}
```

For selection mode, the `selection` field contains only explicitly selected text and optional selected-link metadata.

Validate mode-specific fields.

Do not accept arbitrary HTML as trusted instructions.

### Example Response

```json
{
  "request_id": "client-generated-uuid",
  "status": "completed",
  "summary": "The page contains signals that warrant caution.",
  "findings": [
    {
      "id": "credential-pressure",
      "title": "Urgent credential request",
      "description": "The page pressures visitors to sign in immediately.",
      "severity": "high",
      "confidence": "medium",
      "status": "detected",
      "evidence": [
        {
          "source": "visible_text",
          "excerpt": "Sign in now to prevent account closure",
          "reason": "Urgency is used to pressure credential entry."
        }
      ],
      "check_id": "text.credential_pressure",
      "limitations": [
        "This signal alone does not establish fraud."
      ]
    }
  ],
  "trust_dna": [],
  "next_best_actions": [],
  "checks": {
    "executed": [],
    "not_executed": []
  },
  "limitations": [
    "No external domain reputation lookup was performed."
  ]
}
```

These examples are illustrative. Implement strict schemas and validation rather than copying the example without considering the actual requirements.

Keep evidence excerpts short and avoid exposing sensitive content.

## 6. Analysis Pipeline

Recommended execution sequence:

1. **Validate:** Enforce request size, field lengths, URL parsing, mode constraints, and content limits.
2. **Normalize:** Normalize safe URL components and text while preserving original evidence references.
3. **Extract signals:** Derive bounded, typed observations from supplied content.
4. **Run deterministic checks:** Produce check IDs, statuses, evidence references, severity suggestions, and limitations.
5. **AI interpretation:** Provide only necessary observations and bounded text to the AI provider.
6. **Validate AI output:** Parse against strict schemas and reject malformed or unsupported claims.
7. **Reconcile:** Deterministic evidence and policy guardrails take precedence over unsupported AI statements.
8. **Build Trust DNA:** Derive dimensions from checks and observations that actually exist.
9. **Build Proof Mode:** Connect findings to observations and check IDs.
10. **Generate actions:** Map findings to proportionate recommendations.
11. **Compose report:** Include completed, not-checked, unavailable, and failed checks.
12. **Return:** Provide a structured response with explicit uncertainty.

## 7. Deterministic Check Interface

Each check should return a typed result.

Illustrative structure:

```python
class CheckResult:
    check_id: str
    status: str
    severity: str | None
    confidence: str
    evidence: list
    limitations: list[str]
```

Allowed statuses:

- `detected`
- `not_detected`
- `unknown`
- `not_checked`
- `unavailable`
- `error`

Requirements:

- Checks must be deterministic where practical and independently testable.
- `not_detected` is valid only if the check actually ran.
- A failed or unsupported check must not silently become a clean result.
- Avoid brittle heuristics presented as definitive proof.
- Add test cases for benign, suspicious, malformed, empty, and ambiguous inputs.

## 8. AI Adapter and Prompt-Injection Resistance

- Keep provider credentials exclusively in backend environment configuration or a secret manager.
- Use a provider-neutral interface so providers can be changed.
- Request structured JSON and validate it with Pydantic.
- Treat webpage text, titles, links, and selected content as untrusted quoted data.
- Explicitly instruct the model that page content may contain malicious instructions and must never override system instructions or analysis policy.
- Do not let the model invoke tools, fetch URLs, or perform arbitrary network actions.
- Limit input size, output size, latency, and retries.
- Handle rate limits, provider outages, malformed JSON, refusals, and timeouts.
- If AI is unavailable, return deterministic findings with a clear limitation where useful.
- Never fabricate AI-derived content.
- Never let AI claim a check ran when it did not.
- Never let AI override a documented security guardrail.

## 9. Chrome Extension Architecture

Suggested structure:

```text
extension/
  manifest.json

  src/
    background/
    content/
    popup/
    components/
    services/
    types/
    utils/

  tests/
```

Adapt this structure to the repository.

### 9.1 Manifest V3 and Permissions

- Use the narrowest permissions that support the agreed UX.
- Prefer `activeTab` and explicit user gestures where possible.
- Request host permissions only when technically necessary.
- Justify every broad permission.
- Do not add `<all_urls>` by default.
- Do not introduce persistent background page collection.
- Avoid remote executable code.
- Bundle extension code locally in accordance with Chrome extension requirements.

### 9.2 User-Initiated Scan

1. User opens the extension UI and clicks Scan.
2. Extension obtains access to the active tab through the permitted user gesture.
3. Content extraction reads only allowed, bounded visible content and metadata.
4. Never read password values, hidden inputs, payment values, or unrelated form data.
5. Send a documented JSON request to the configured backend.
6. Show progress and handle cancellation or timeout where feasible.
7. Render the report and disclose limitations.

### 9.3 Select-to-Verify

- Capture only explicitly selected text and optional selected-link metadata.
- Do not silently include the full page.
- Clearly show what is being submitted where practical.
- Apply size limits and sensitive-data safeguards.
- Treat selection content as untrusted.

### 9.4 Extension and Backend Communication

- Use a single typed API client.
- Configure backend origin centrally.
- Validate responses at runtime before rendering.
- Handle CORS, network errors, timeouts, non-2xx responses, and malformed JSON.
- Never log raw page text or selected content in production.

## 10. Frontend / UI Architecture

The extension UI should be modular and accessible.

Suggested components:

```text
ScanPanel
ScanProgress
AssessmentSummary
FindingList
FindingDetail
SeverityLabel
ConfidenceLabel
TrustDnaPanel
ProofModePanel
NextBestActionList
ChecksAndLimitations
ErrorState
```

### UI Requirements

- Severity and confidence must be visually distinct.
- Do not use a single traffic-light badge as the entire result.
- Do not imply that green means safe.
- Unknown and not-checked states must be visible.
- Evidence must be inspectable without overwhelming the summary.
- Support keyboard navigation.
- Provide readable contrast and visible focus states.
- Provide screen-reader labels.
- Never render untrusted page content as HTML.
- Escape text and avoid unsafe DOM insertion.
- Avoid alarming language and unsupported definitive claims.

## 11. Security, Privacy, and Abuse Resistance

### Backend

- Strict request validation and payload limits.
- Rate limiting appropriate to deployment.
- CORS allowlist for the extension origin and environment.
- Safe error messages without stack traces or secrets.
- Secrets via environment configuration or a secret manager.
- No arbitrary URL fetching in MVP.
- Do not log raw page content, selected text, credentials, or tokens.
- Use pinned or reproducible dependencies where practical.

### Extension

- Least-privilege permissions.
- No remote code execution.
- Safe message passing between popup, service worker, and content script.
- Validate sender context and message shape.
- Avoid unsafe HTML rendering.
- No collection before explicit user action.

### AI and Page Content

- Page-derived content is untrusted data.
- No tool execution or URL retrieval based on page instructions.
- Bound tokens and content.
- Validate output and reconcile it against actual checks.

## 12. Testing Strategy

Testing is continuous and task-scoped. The coding agent owns creating and running tests.

### 12.1 Backend Tests

- Unit tests for normalization.
- Unit tests for every deterministic check.
- Severity and confidence logic tests.
- Trust DNA tests.
- Proof Mode tests.
- Next Best Action tests.
- Report composition tests.
- API tests for valid and invalid requests.
- Tests for oversized and malformed requests.
- AI adapter tests using mocked providers.
- Prompt-injection tests.
- Logging and sensitive-data tests.

### 12.2 Extension Tests

- Content extraction bounds.
- Sensitive-data exclusions.
- Request construction.
- Response parsing.
- UI state transitions.
- User-initiated-only scanning.
- Permission and manifest review.
- Popup and active-tab scan flow.
- Select-to-Verify interaction.
- Error handling.

### 12.3 Integration and End-to-End Tests

- Backend contract tests shared with extension fixtures.
- Mock-server integration tests.
- End-to-end page scan.
- End-to-end Select-to-Verify.
- Benign, suspicious, ambiguous, unavailable, offline, timeout, and malformed-response scenarios.
- Regression tests after cross-component changes.

### 12.4 Required Testing Discipline

For every task:

1. Add or update tests for changed behavior.
2. Run the smallest relevant test set.
3. Run lint and type checks relevant to changed files.
4. Fix failures before marking the task complete.
5. Record exact commands and outcomes.

For every phase:

1. Run all tests for the phase.
2. Run prior regression tests.
3. Verify every acceptance criterion.
4. Report known gaps and skipped tests with reasons.
5. Do not mark the phase complete with unexplained failures.

## 13. Observability and Error Handling

- Use request IDs for tracing.
- Log operational metadata, not raw user page content.
- Distinguish validation, network, provider, timeout, and internal errors.
- Return stable error codes and safe user-facing messages.
- Record check execution status so reports never imply unrun checks.
- Avoid storing page content in analytics or crash reports.

## 14. Deployment and Configuration

- Separate development, test, and production configuration.
- Backend secrets must remain server-side.
- Extension backend URL must be environment-configured.
- Provide documented local setup and test commands.
- Provide health checks and deployment instructions.
- Document CORS, rate limits, retention, and operational limits.
- Do not publish or distribute the extension until permission and privacy review is complete.

## 15. Definition of Done

A feature or task is done only when:

- Implementation matches its objective and acceptance criteria.
- Tests are written or updated and pass.
- Lint and type checks pass where configured.
- Security and privacy implications are addressed.
- No unrelated regressions are introduced.
- Documentation and configuration are updated.
- The coding agent reports files changed, commands run, results, and known limitations.

The product is release-ready only when the complete extension-to-backend-to-UI journey passes end-to-end tests and the demo scenarios behave honestly under uncertainty and failure.