# API & AI Integration Design

This document describes how the extension, the FastAPI backend, and the AI
provider chain fit together, and the operational rules that keep the product
honest when a key is missing, a provider is down, or the model returns garbage.

## 1. Design goals

1. **Never require AI for a scan.** Deterministic checks are the floor.
2. **Never claim AI ran when it did not.** Reports and UI state must be truthful.
3. **Never hide uncertainty.** Failures become explicit limitations, not silent
   clean results.
4. **Never leak the key.** Credentials live only in the backend process.
5. **Stay inside the client timeout.** The extension aborts at 15 s; the AI
   chain must finish well before that.
6. **Prefer deterministic evidence.** Reconcile AI findings against rules and
   strip ungrounded quotes.

## 2. End-to-end flow

```
Popup / Side Panel / Dashboard
        │  user clicks Scan
        ▼
Service worker (or dashboard page)
        │  content extractor: visible text, title, links
        │  PII screen: no password/input values
        ▼
POST /api/v1/analyze
        │
        ├─ 1. Pydantic validation + URL scheme/size limits
        ├─ 2. Normalization and text bounding
        ├─ 3. Deterministic URL + content checks
        ├─ 4. AI stage (Gemini only), bounded by timeout
        ├─ 5. AI output validation + quote grounding
        ├─ 6. Reconciliation (deterministic wins)
        ├─ 7. Trust DNA (6 dimensions)
        ├─ 8. Proof Mode + Next Best Actions
        ▼
AnalysisReport JSON
        │  runtime schema validation in the extension
        ▼
Popup / Side Panel / Dashboard rendering
```

The backend does **not** fetch the scanned URL. It only analyzes the bounded
payload sent by the extension. This is an explicit SSRF boundary.

## 3. Configuration model

All settings load from `backend/.env` (absolute path, independent of the current
working directory) with environment variables taking precedence.

| Variable | Default | Purpose |
|---|---|---|
| `AI_PROVIDER` | `auto` | `auto`, `gemini`, or `disabled`. |
| `AI_PROVIDER_ORDER` | `gemini` | Provider list; only `gemini` is registered. |
| `GEMINI_API_KEY` | empty | Enables Gemini when non-empty. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Gemini model id. |
| `AI_TIMEOUT_SECONDS` | `10` | Per-attempt limit (one transient retry allowed). |
| `AI_TOTAL_TIMEOUT_SECONDS` | `12` | Whole AI-stage budget. |
| `AI_MAX_INPUT_CHARS` | `20000` | Text sent to the model. |

`backend/.env` is the single source of truth. No env template is committed.

## 4. Execution and degradation

```
AIService.run_ai_analysis()
        │
        ├─ configured = providers with a key
        ├─ if none             → UNCONFIGURED limitation
        │
        ├─ Gemini analyze (bounded by total budget)
        │     ├─ 429/503/504    → one retry, then record the failure
        │     ├─ timeout        → TIMEOUT limitation
        │     ├─ exception      → UNAVAILABLE limitation
        │     ├─ malformed JSON → UNAVAILABLE limitation
        │     └─ valid output   → validate quotes, return
        │
        └─ runtime status records last_error for the status endpoint
```

If no provider is configured, the limitation is:

> AI contextual analysis was not executed because the AI provider is not
> configured. Results reflect deterministic security checks only.

## 5. Failure matrix

| Situation | Result |
|---|---|
| configured + succeeds | AI-assisted report. |
| configured + times out | Deterministic report + timeout limitation. |
| configured + 429/503/504 | One retry; if still failing, deterministic report + unavailable limitation. |
| configured + malformed JSON | Deterministic report + unavailable limitation. |
| no key | Deterministic report + unconfigured limitation. |
| `AI_PROVIDER=disabled` | Deterministic report + unconfigured limitation. |

In every case the API returns HTTP 200 with a complete report. AI failure is not
a request failure. The status endpoint additionally reports `degraded` and
`last_error` after a failed AI call.

## 6. Status API

### `GET /api/v1/ai/status`

Configuration-only; never calls a provider and never spends tokens.

```json
{
  "ai_enabled": true,
  "mode": "ai_assisted",
  "provider_order": ["gemini"],
  "active_provider": "gemini",
  "providers": [
    { "name": "gemini", "configured": true, "model": "gemini-3.5-flash-lite", "role": "primary" }
  ],
  "timeout_seconds": 10,
  "total_timeout_seconds": 12,
  "degraded": false,
  "last_error": null,
  "checked_at": "2026-11-02T00:00:00Z"
}
```

No key material is returned.

### `GET /health`

Adds an `ai` summary:

```json
{
  "status": "ok",
  "service": "Credible API",
  "version": "0.1.0",
  "ai": {
    "enabled": false,
    "mode": "deterministic_only",
    "active_provider": null,
    "providers": [],
    "degraded": false,
    "last_error": null
  }
}
```

### Live probe

`backend/scripts/check_ai.py` performs a real, low-cost authenticated call:

- Gemini: a tiny `generate_content` request.
- It also lists visible models and warns if `GEMINI_MODEL` is retired or
  unavailable to the key.

Exit code `1` means the configured model/key failed; `0` means it is usable
(or AI is intentionally disabled).

## 7. Extension status badge

`useEngineStatus()` calls the typed API client once on popup/dashboard load.

| Backend state | Badge | Meaning |
|---|---|---|
| unreachable | `ENGINE OFFLINE` | Backend not running or blocked. |
| reachable, no key | `DETERMINISTIC MODE` | Rules only; explicitly not AI. |
| reachable, key present | `AI READY · GEMINI` | AI-assisted analysis available. |
| reachable, last AI call failed | `AI DEGRADED · GEMINI` | Key present, but scans currently fall back to rules. |

The badge is a convenience, not a guarantee about the next scan. A provider can
still fail during a scan; the report limitation is the source of truth.

## 8. Key management

**Recommended for local development:** `backend/.env`.

**Recommended for CI/deployment:** environment variables injected by the
platform or a secret manager. Do not ship `.env` files in images or artifacts.

Rules:

- `.env` files are gitignored.
- The extension never receives a key.
- Keys are never logged. Provider errors log only the exception type and HTTP
  status, never headers or request bodies.
- If a key leaks, rotate it at the provider; deleting the local file is not
  enough if it was committed.

## 9. Adding another provider (optional)

Credible ships with Gemini only. To add a provider later:

1. Create `backend/app/services/ai/<name>.py` implementing `AIProvider`:
   - `provider_name`
   - `model_name`
   - `is_configured()`
   - `analyze(request, deterministic_checks) -> AIAnalysisOutput`
   - optional `probe()` for the CLI check
2. Add settings for its key/model/base URL in `core/config.py`.
3. Register it in `PROVIDER_CLASSES` in `factory.py`.
4. Add it to `AI_PROVIDER_ORDER` if it should participate in fallback.
5. Add unit tests with a mocked transport; never call the real API in tests.
6. If it makes network calls, update the SSRF audit allowlist with a comment
   explaining that the endpoint is fixed and not user-controlled.

## 10. Security invariants

- Page text is wrapped in `<untrusted_content>` and treated as hostile data.
- The system prompt forbids obeying instructions found in page content.
- AI findings must quote text that actually appears in the submitted content;
  ungrounded findings are dropped.
- Deterministic findings cannot be cancelled by AI output.
- The backend never fetches user-supplied URLs.
- Request bodies and page text are never logged.
- CORS uses an explicit origin list plus a Chrome extension regex; the invalid
  `chrome-extension://*` wildcard is not relied upon.

## 11. Test and verification commands

```bash
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe scripts\check_ai.py

# Extension
cd extension
npm run typecheck
npm test
npm run build
```

Current coverage includes:

- provider order / disabled mode / unknown provider handling
- Gemini-only registration
- failure → deterministic limitation and runtime `degraded` tracking
- all-provider failure and timeout messages
- unconfigured providers
- Gemini JSON parsing, malformed output, and prompt truncation
- status endpoint shape, degraded state, and no-key-leak assertion
- extension status validation, offline mapping, and badge semantics
