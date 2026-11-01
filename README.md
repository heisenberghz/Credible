# Credible — Know before you trust.

AI-assisted defensive cybersecurity Chrome extension and analysis backend.

## Architecture

- **Extension (Chrome MV3):** React + TypeScript + Vite.
  - **Popup:** Apple-style compact card for user-initiated scan triggers and pulsing status animation.
  - **Side Panel:** Comprehensive, scrollable results view rendering Trust DNA, findings, Proof Mode, and Next Best Actions.
- **Backend:** Python + FastAPI + Pydantic.
  - Strict input validation and content normalization.
  - Deterministic security checks (URL structures, payment pressure, urgency, credential exposure).
  - Provider-neutral AI adapter (Google Gemini) with strict output schema validation and prompt injection defenses.
  - Reconciliation policy where deterministic findings take precedence.
  - Multidimensional Trust DNA and transparent Proof Mode attribution.

## Project Structure

```
credible-pro/
├── doc/               # Product and technical specifications
├── backend/           # FastAPI service, analysis pipeline, and test suite
├── extension/         # Manifest V3 Chrome extension (popup + side panel)
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
cp .env.example .env
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

