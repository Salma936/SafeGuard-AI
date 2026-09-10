
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
