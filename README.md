<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SafeGuard AI

Full-stack digital abuse detection platform — FastAPI backend + React/Vite frontend, deployable on GCP Cloud Run.

## 🔗 Links

- **Live Demo:** [safeguard-ai-830272410798.europe-west1.run.app](https://safeguard-ai-830272410798.europe-west1.run.app)
- **Demo Video:** [Watch on YouTube](https://www.youtube.com/watch?v=J-r_ClZ6Ae8)
- **Technical Documentation:** [Full Doc (Google Docs)](https://docs.google.com/document/d/1Po0MVJl-F9predqYrIzryZp44LKK8DV63yiONqh0Nik/edit?usp=sharing)
- **Blog Post:** [Read on Medium](your-medium-link-here)

Built for **Patchamomma 2026** — Build Phase Submission

---

## Project Structure

```
SafeGuard-AI/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI entrypoint: backend.app.main:app
│       ├── config.py
│       ├── routers/         # API route handlers
│       └── services/        # AI, DB, storage, forensics logic
├── src/                     # React/Vite frontend
├── tests/                   # Pytest backend test suite
├── requirements.txt         # Python deps (pillow, numpy, etc.)
├── package.json             # Node scripts
├── vite.config.ts           # Dev proxy: /api → http://127.0.0.1:8000
└── Dockerfile               # Multi-stage: Node (build) + Python (serve)
```

> **Important:** All Python commands **must be run from the repo root** (`SafeGuard-AI/`).
> The backend uses absolute imports (`from backend.app.xxx`) that require the repo root on `sys.path`.
> Never `cd backend` before running uvicorn or pytest.

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A `.env` file in the repo root (copy from `.env.example`)

---

## Local Development

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in GEMINI_API_KEY and any other required values
```

### 3. Start the backend

Run from the **repo root**:

```bash
# Option A — npm script (recommended)
npm run backend:dev

# Option B — direct
uvicorn backend.app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`.
Interactive docs: `http://127.0.0.1:8000/docs`

### 4. Start the frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.
API calls to `/api/*` are proxied to `http://127.0.0.1:8000` via `vite.config.ts` — no CORS issues in dev.

---

## Running Tests

Run from the **repo root**:

```bash
# Option A — npm script (recommended)
npm run test:backend

# Option B — direct
python3 -m pytest tests/ -v

# Option C — bare pytest (testpaths = tests in pytest.ini)
pytest
```

> **Do NOT** run `python3 tests/test_backend.py` directly — that bypasses pytest
> and doesn't add the repo root to `sys.path`, causing `ModuleNotFoundError`.

---

## Production (GCP Cloud Run / Docker)

The Dockerfile handles everything:

```bash
# Build
docker build -t safeguard-ai .

# Run locally (mirrors Cloud Run)
docker run -p 8080:8080 --env-file .env safeguard-ai
```

### Live Demo & Cloud Run Cold-Start Prevention

To guarantee zero cold-start latency and prevent request timeouts during live hackathon demos or judge reviews, deploy with at least 1 warm instance and an adequate request timeout:

```bash
gcloud run deploy safeguard-ai \
  --image gcr.io/YOUR_PROJECT_ID/safeguard-ai \
  --platform managed \
  --region us-central1 \
  --min-instances 1 \
  --timeout 120s \
  --memory 2Gi \
  --cpu 2 \
  --allow-unauthenticated
```

- `--min-instances 1`: Keeps 1 container instance always warm so initial demo requests do not suffer from the 5–10s container startup penalty.
- `--timeout 120s`: Gives multimodal analysis (screenshots, audio transcripts, deepfake analysis) plenty of runway.

The container runs:
```
uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1
```

FastAPI serves the Vite-built frontend from `dist/` and all `/api/*` routes from the same process — no separate frontend server needed in production.

---

## Features

| Feature | Endpoint |
|---------|----------|
| Text threat analysis | `POST /api/analyze/text` |
| URL analysis | `POST /api/analyze/url` |
| Image analysis | `POST /api/analyze/image` |
| Audio analysis | `POST /api/analyze/audio` |
| **Screenshot forensics (ELA)** | `POST /api/analyze-screenshot` |
| Incidents CRUD | `/api/incidents/` |
| Evidence management | `/api/incidents/{id}/evidence` |
| Analytics summary | `GET /api/analytics/summary` |
| Health check | `GET /health` or `GET /api/health` |
