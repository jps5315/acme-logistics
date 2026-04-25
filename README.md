# Acme Logistics — Inbound Carrier Sales System

AI-powered inbound carrier sales automation built on HappyRobot, with a React dashboard and Gemini AI insights.

## Architecture

```
Carrier (phone/web) → HappyRobot Voice Agent
                              │
                    ┌─────────┴──────────┐
                    │                    │
               FMCSA API        FastAPI Backend (main.py)
                                         │
                              ┌──────────┼──────────┐
                              │          │           │
                         /loads    /bookings   /calls/result
                                                     │
                                             GET /metrics
                                                     │
                                          ┌──────────┴──────────┐
                                          │                      │
                                  React Frontend           Gemini AI
                                  (Vite + TypeScript)    (AI Insights)
```

**Services:**
- **Backend** — FastAPI on port `8000`. Receives call data, aggregates KPIs, calls Gemini for insights.
- **Frontend** — Vite + React SPA on port `3000`. Polls `/metrics` every 30s and renders KPI cards, charts, call table, and AI insights.

## Project Structure

```
acme-logistics/
├── main.py                  # FastAPI application (api service)
├── requirements.txt         # Python runtime dependencies
├── requirements-test.txt    # Python test dependencies
├── Dockerfile.api           # Container definition for the api service
├── docker-compose.yml       # Orchestrates api + frontend services
├── data/
│   ├── loads.json           # Load database (edit to add/remove loads)
│   ├── call_results.json    # Created at runtime
│   └── bookings.json        # Created at runtime
├── frontend/                # React SPA (frontend service)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── hooks/useMetrics.ts
│   │   ├── components/      # Header, KpiCard, Charts, CallsTable, AiInsightsPanel
│   │   └── types/metrics.ts
│   ├── Dockerfile           # Multi-stage build: node → nginx
│   ├── vite.config.ts
│   └── package.json
└── tests/                   # Backend property-based tests (hypothesis)
```

## Quick Start (Local)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd acme-logistics

# 2. (Optional) set environment variables
export API_KEY=your-secure-key-here
export GEMINI_API_KEY=your-gemini-key-here   # omit to disable AI insights

# 3. Start Docker Desktop, then:
docker compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000      |
| API       | http://localhost:8000      |
| API Docs  | http://localhost:8000/docs |

## Environment Variables

| Variable            | Service  | Default                  | Description                              |
|---------------------|----------|--------------------------|------------------------------------------|
| `API_KEY`           | Backend  | `acme-secret-key-2024`   | Shared secret for all API calls          |
| `GEMINI_API_KEY`    | Backend  | *(empty)*                | Google Gemini API key for AI insights    |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000`  | Backend URL — set at build time          |
| `VITE_API_KEY`      | Frontend | `acme-secret-key-2024`   | API key sent in `X-API-Key` header — set at build time |

## API Endpoints

All endpoints require the `X-API-Key` header.

| Method | Path             | Description                              |
|--------|------------------|------------------------------------------|
| GET    | `/health`        | Health check                             |
| GET    | `/loads`         | List all loads                           |
| GET    | `/loads/search`  | Search loads by origin / equipment type  |
| POST   | `/bookings/confirm` | Confirm a booking                     |
| POST   | `/calls/result`  | Receive call data from HappyRobot        |
| GET    | `/metrics`       | Aggregated KPIs + AI insights            |

### Example: Post a Call Result

```bash
curl -X POST "http://localhost:8000/calls/result" \
  -H "X-API-Key: acme-secret-key-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "MC-123456",
    "carrier_name": "Swift Transport",
    "load_id": "LD-1001",
    "agreed_price": 2950,
    "loadboard_rate": 2850,
    "gross_profit": 100,
    "gross_profit_margin": 3.4,
    "deal_outcome": "successful",
    "customer_sentiment": "happy",
    "call_summary": "Carrier agreed after minor negotiation.",
    "call_duration": 210
  }'
```

## HappyRobot Workflow Setup

After deploying, update these node URLs in your HappyRobot workflow:

| Node                    | Method | URL                                                                 |
|-------------------------|--------|---------------------------------------------------------------------|
| Fetch Matching Loads    | GET    | `https://<your-domain>/loads/search?origin={{origin}}&equipment_type={{equipment_type}}` |
| Mock Transfer to Sales  | POST   | `https://<your-domain>/bookings/confirm`                            |
| Send Call Results       | POST   | `https://<your-domain>/calls/result`                                |

Set the `X-API-Key` header to your `API_KEY` value on all nodes.

---

## Railway Deployment (Current)

The application is deployed on Railway as two separate services.

### Accessing the deployment

| Service  | URL |
|----------|-----|
| Frontend | `https://<your-frontend-railway-url>` |
| Backend  | `https://<your-backend-railway-url>` |
| API Docs | `https://<your-backend-railway-url>/docs` |
| Health   | `https://<your-backend-railway-url>/health` |

### Reproducing the deployment from scratch

#### Prerequisites
- A [Railway](https://railway.app) account
- A GitHub repository with this code (see step 1 below)
- Railway CLI: `npm install -g @railway/cli`

#### Step 1 — Push code to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/acme-logistics.git
git push -u origin main
```

#### Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo

#### Step 3 — Deploy the backend service

Railway will auto-detect the repo. Configure the service:

1. In the service settings → **Build** → set Dockerfile path to `Dockerfile.api`
   (or Railway picks this up automatically from `railway.toml` at the repo root)
2. Go to **Variables** and add:
   ```
   API_KEY=your-secure-key-here
   GEMINI_API_KEY=your-gemini-key-here
   ```
3. Railway deploys automatically. Verify at `https://<backend-url>/health`

#### Step 4 — Deploy the frontend service

1. In the same Railway project → **New Service** → **GitHub Repo** → same repo
2. In service settings → **Build** → set **Root Directory** to `frontend/`
3. Go to **Variables** and add:
   ```
   VITE_API_BASE_URL=https://<your-backend-railway-url>
   VITE_API_KEY=your-secure-key-here
   ```
   *(must match the `API_KEY` set on the backend)*
4. Trigger a **Redeploy** to rebuild with the variables baked in
5. Open the frontend URL — the dashboard should load and connect to the backend

#### Step 5 — Add a volume for data persistence

By default Railway containers have ephemeral storage — call data is lost on redeploy. To persist it:

1. Backend service → **Volumes** → **Add Volume**
2. Mount path: `/app/data`

This keeps `call_results.json`, `bookings.json`, and `loads.json` across deploys.

#### Step 6 — Connect HappyRobot

Update your HappyRobot workflow nodes to point at the Railway backend URL (see HappyRobot Workflow Setup section below).

---

Each option deploys two containers independently:
- **FastAPI backend** — built from `Dockerfile.api` at the repo root
- **React frontend** — built from `frontend/Dockerfile`

## Security Notes

- Rotate `API_KEY` before going to production — the default is public.
- Never commit `GEMINI_API_KEY` to source control — use your platform's secrets manager.
- All cloud options above provide automatic HTTPS termination.
- Consider restricting CORS origins in `main.py` (`allow_origins`) for production.

## Running Tests

```bash
# Backend (hypothesis property-based tests)
pip install -r requirements-test.txt
python -m pytest tests/ -v

# Frontend (vitest + fast-check property-based tests)
cd frontend
npm install
npm test
```
