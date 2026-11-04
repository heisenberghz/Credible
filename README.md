# Credible — Know before you trust.

AI-assisted defensive cybersecurity Chrome extension and analysis backend.

## Architecture

- **Extension (Chrome MV3):** React + TypeScript + Vite.
  - **Popup:** Apple-style compact card for user-initiated scan triggers and pulsing status animation.
  - **Side Panel:** Comprehensive, scrollable results view rendering Trust DNA, findings, Proof Mode, and Next Best Actions.
  - **Dashboard:** Full-tab command center with heuristic matrix, calibration benchmarks, scan ledger, and dossier export.
- **Backend:** Python + FastAPI + Pydantic.
  - Strict input validation and content normalization.
  - Deterministic security checks (URL structures, payment pressure, urgency, credential exposure).
  - Gemini AI adapter with a deterministic-only fallback when AI is unavailable.
  - Strict output schema validation, quote grounding, and prompt-injection defenses.
  - Reconciliation policy where deterministic findings take precedence.
  - Multidimensional Trust DNA and transparent Proof Mode attribution.
  - AI status endpoint and a CLI credential probe.

## Project Structure

```
credible-pro/
├── doc/               # Product and technical specifications
├── backend/           # FastAPI service, analysis pipeline, and test suite
│   ├── .env           # Local secrets (gitignored)
│   └── scripts/       # check_ai.py credential probe
├── extension/         # Manifest V3 Chrome extension (popup, side panel, dashboard)
├── demo/              # Local demonstration fixtures and pages
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows (or source .venv/bin/activate on Unix)
pip install -r requirements-dev.txt
# create .env in this directory and add the variables shown below
pytest -v
uvicorn app.main:app --reload --port 8000
```

### Extension

```bash
cd extension
npm install
npm test
npm run build
```

Load unpacked in Chrome (`chrome://extensions`) pointing to `extension/dist`.

Load the demo scenarios with `python demo/server.py --port 8080` and open
`http://localhost:8080/index.html`.

## AI Configuration

Credible works **without any API key**: it runs deterministic checks and
explicitly labels the report as deterministic-only. AI adds contextual
reasoning on top of those rules.

### Where the key goes

Put keys in **`backend/.env`** (gitignored, loaded from any working directory):

```dotenv
AI_PROVIDER=auto
AI_PROVIDER_ORDER=gemini

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

- **Local development:** `backend/.env` is the right place. It is never bundled
  into the extension and is covered by `.gitignore`.
- **CI / deployed server:** use environment variables or a secret manager and
  leave `backend/.env` empty. Environment variables override the file.
- **Never** put a key in `extension/`, `manifest.json`, source code, or a commit.

The backend loads only `backend/.env`, so there is exactly one source of truth.
No env template is committed; use the variables shown above.

### Provider modes

| Setting | Behavior |
|---|---|
| `AI_PROVIDER=auto` | Use Gemini when `GEMINI_API_KEY` is present, otherwise deterministic-only. |
| `AI_PROVIDER=gemini` | Gemini only. |
| `AI_PROVIDER=disabled` | Deterministic-only; no provider is initialized. |

Credible builds Gemini only. If the key is missing, the model returns an error,
or the call times out, the scan still succeeds with deterministic findings and a
limitation explaining what happened.

Timeouts cover free-tier latency (responses have been observed at 20-60s):

- `AI_TIMEOUT_SECONDS=60` — per attempt (one transient retry allowed).
- `AI_TOTAL_TIMEOUT_SECONDS=70` — whole AI stage.
- The extension's client timeout is `80s`.
- `AI_MAX_INPUT_CHARS=20000` — text sent to the model; deterministic checks still
  run over the full page text.

Because the scan is synchronous, a slow Gemini response means the scan can take
up to about a minute. The UI keeps the scanning state visible during that time.

### Free-tier limits

Gemini's free tier is per project and resets at midnight Pacific:

| Model class | RPM | RPD | TPM |
|---|---|---|---|
| Flash | ~5 | **20** | 250K |
| Flash Lite | ~15 | **500** | 250K |

A single scan sends up to 20K characters (~5–6K tokens), so a normal demo will
not exhaust the daily quota. `503`/`504` responses are capacity spikes, not quota
exhaustion, and degrade to deterministic results.

### Verify the key before scanning

```bash
cd backend
.\.venv\Scripts\python.exe scripts\check_ai.py
```

The script prints the effective order, whether each key is present (never the
key itself), and performs a live, low-cost probe. Use `--no-probe` to check
configuration only.

You can also inspect the running backend:

```bash
curl http://localhost:8000/api/v1/ai/status
curl http://localhost:8000/health
```

`/api/v1/ai/status` is configuration-only and never spends tokens:

```json
{
  "ai_enabled": true,
  "mode": "ai_assisted",
  "provider_order": ["gemini"],
  "active_provider": "gemini",
  "providers": [
    { "name": "gemini", "configured": true, "model": "gemini-3.5-flash-lite", "role": "primary" }
  ],
  "timeout_seconds": 60,
  "total_timeout_seconds": 70,
  "degraded": false,
  "last_error": null,
  "checked_at": "2026-11-02T00:00:00Z"
}
```

The extension queries this endpoint on popup/dashboard load and shows a truthful
badge: **AI READY · GEMINI**, **AI DEGRADED · GEMINI**, **DETERMINISTIC MODE**,
or **ENGINE OFFLINE**.

### After adding a key

1. Save `backend/.env`.
2. Restart `uvicorn` (config is read at startup).
3. Run `scripts/check_ai.py`.
4. Open the popup and confirm the badge says **AI** rather than **RULES**.
5. Run a scan on `http://localhost:8080/suspicious.html` and confirm the report
   includes AI-assisted findings while deterministic findings still take
   precedence.

See [`doc/API_INTEGRATION.md`](doc/API_INTEGRATION.md) for the full design,
fallback matrix, and how to add another provider.
