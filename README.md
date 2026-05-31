# LCOC MOAA Legislative Dashboard

A public dashboard for tracking federal and Louisiana veterans/military legislation.

This repository contains:

- `backend/` — Node.js + TypeScript ingestion and API service
- `frontend/` — React + Vite dashboard UI
- `.github/workflows/` — GitHub Actions for CI, deployment, and daily ingestion
- `infra/` — local Docker Compose development setup

## Deployment via GitHub Actions

The project is set up to deploy automatically via GitHub Actions:

1. **Frontend** → GitHub Pages (automatic)
2. **Backend** → Render, Railway, or other Node.js host (requires configuration)
3. **Daily Ingest** → Scheduled GitHub Actions workflow

### Frontend Deployment (GitHub Pages)

Frontend is automatically deployed to GitHub Pages on every push to `main`.

**Required secrets:**
- `BACKEND_URL` — Backend API URL (e.g., `https://your-backend.onrender.com`)

### Backend Deployment (Render)

1. Create a free Render account at https://render.com
2. Create a new Web Service connected to this GitHub repo
3. Configure environment variables in Render:
   - `PORT=4000`
   - `RUN_INGEST_ON_START=false`
   - `LEGISCAN_API_KEY=<your-key>` (get from https://legiscan.com/legiscan-api)
   - `INGEST_SECRET=<your-secret>`

4. Add GitHub secrets for automated deployment:
   - `RENDER_DEPLOY_URL` — Render deploy hook URL

### Daily Ingest

The daily ingest workflow runs at 10 AM UTC every day.

**Required secrets:**
- `BACKEND_INGEST_URL` — Backend URL (e.g., `https://your-backend.onrender.com`)
- `INGEST_SECRET` — Must match backend `INGEST_SECRET`

## Local Development

1. Clone the repo:

```powershell
cd C:\Users\vpane
git clone <repo-url> louc-moaa-legislation-dashboard
cd louc-moaa-legislation-dashboard
```

2. Configure backend env:

```powershell
cd backend
copy .env.example .env
# edit .env and add LEGISCAN_API_KEY and INGEST_SECRET
```

3. Backend:

```powershell
cd backend
npm install
npm run build
npm run dev
```

4. Frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend proxy will forward `/api` calls to the backend at `http://localhost:4000`.

## API Keys

- **LegiScan API** — https://legiscan.com/legiscan-api
  - Free tier available
  - Provides both federal and state legislation, including Louisiana
