# LCOC MOAA Legislative Dashboard

A veterans/military legislative tracker for the **Louisiana Council of Chapters, Military Officers Association of America (LCOC MOAA)**. Tracks both **federal** and **Louisiana state** bills affecting veterans.

**Live Site:** https://moaa-legi.com/

---

## Project Structure

```
├── backend/          — Node.js + TypeScript API & LegiScan ingest
├── moaa-dashboard/   — Static HTML/CSS/JS dashboard UI (LIVE)
├── infra/            — Local Docker Compose dev setup (optional)
└── .github/workflows/— GitHub Actions for deployment & daily ingestion
```

---

## Production Architecture

```
GitHub Actions (Daily)
    ↓
Trigger LegiScan ingest
    ↓
Backend API (DigitalOcean 167.172.158.216:4000)
    ├─ Fetch bills from LegiScan API
    ├─ Filter for veteran-related bills
    ├─ Store in local JSON files
    └─ Serve via REST API
    ↓
Nginx (DigitalOcean)
    ├─ Serve moaa-dashboard/ (static files)
    └─ Proxy /api/ → backend:4000
    ↓
https://moaa-legi.com (Live Dashboard)
```

---

## Deployment

### Backend Deployment

**Automatic:** GitHub Actions deploys on every push to `main`
- Runs: `npm install && npm run build` in backend/
- Deploys to: DigitalOcean droplet via SSH
- Restarts: PM2 process `moaa-backend`

**Requires GitHub Secrets:**
- `DEPLOY_KEY` - SSH private key for DigitalOcean access

### Dashboard Deployment

**Manual:** Copy files to DigitalOcean
```bash
scp -r moaa-dashboard/* root@167.172.158.216:/var/www/moaa-dashboard/
```

**Nginx Config:** `/etc/nginx/sites-available/moaa-backend`
- Serves moaa-dashboard as static site
- Proxies `/api/` requests to backend:4000

### Daily Ingest

**Automatic:** GitHub Actions runs daily at 10 AM UTC
- Triggers: `POST /api/ingest/daily` endpoint
- Fetches: Latest bills from LegiScan API
- Filters: Only veteran-related bills
- Stores: In backend JSON file storage

**Requires GitHub Secrets:**
- `INGEST_SECRET` - Must match backend's `INGEST_SECRET` env var

---

## Local Development

### Quick Start

```bash
# Clone repo
git clone https://github.com/vpanep1-oss/moaa-legi.git
cd moaa-legi

# Backend
cd backend
npm install
npm run build
LEGISCAN_API_KEY="your-key" npm start

# Frontend (separate terminal)
cd moaa-dashboard
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Full Stack (Docker)

```bash
cd infra
docker compose up --build
```

Runs:
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Postgres: localhost:5432

---

## Environment Variables

### Backend (`.env` in backend/)

```
LEGISCAN_API_KEY=your-api-key-here          # Get from https://legiscan.com/legiscan-api
INGEST_SECRET=your-chosen-secret-token      # For securing daily ingest endpoint
PORT=4000                                     # Optional, defaults to 4000
RUN_INGEST_ON_START=false                    # Run ingest when backend starts
DATABASE_URL=postgres://...                   # Optional, not currently used
```

### GitHub Secrets

```
DEPLOY_KEY                   # SSH private key for DigitalOcean
INGEST_SECRET                # Must match backend INGEST_SECRET
```

---

## Data Sources

- **Federal Bills:** LegiScan API (Congress.gov aggregator)
- **Louisiana Bills:** LegiScan API (Louisiana Legislature)
- **Status Codes:** LegiScan numeric status (1-6)
- **Categories:** Inferred from bill subjects and keywords

### LegiScan API Limits

- Free tier: 30,000 requests/month (resets monthly)
- Bill detail retrieval: 100ms throttle between requests
- Master list: ~16,000 bills per state per session

---

## Bill Categorization

Bills are categorized by their **primary mechanism**, not just who they affect:

- **Education** — schools, tuition, education benefits
- **Employment** — hiring, civil service, job programs
- **Tax & Property** — tax exemptions, property transfers, deductions
- **Veterans Benefits** — VA programs, disability compensation, pensions
- **Legal & Justice** — courts, criminal justice, stolen valor
- **Armed Forces & Security** — active duty, installations, national security
- **Other** — commemorative, general

---

## API Reference

### Get All Bills

```
GET /api/bills
```

Response:
```json
{
  "bills": [
    {
      "id": "louisiana-HB175",
      "source": "louisiana",
      "scope": "louisiana",
      "title": "...",
      "summary": "...",
      "status": "Introduced",
      "category": "benefits",
      "sponsors": ["Rep. Smith", "Sen. Jones"],
      "billUrl": "https://...",
      "subjects": ["veterans", "tax"],
      "statusCode": 1,
      "changeHash": "abc123...",
      "introducedDate": "2026-05-01",
      "lastActionDate": "2026-06-15"
    }
  ],
  "count": 6,
  "federal": 3,
  "louisiana": 3
}
```

### Filter by State

```
GET /api/federal    # Federal bills only
GET /api/louisiana  # Louisiana bills only
```

### Get Single Bill

```
GET /api/bills/:id
```

### Trigger Daily Ingest (Admin)

```
POST /api/ingest/daily
Header: X-Ingest-Token: <INGEST_SECRET>
```

---

## Technology Stack

- **Backend:** Node.js 20, TypeScript, Express.js
- **Database:** JSON file storage (no SQL DB)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **CI/CD:** GitHub Actions
- **Hosting:** DigitalOcean ($5/month droplet)
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)

---

## Maintenance

### Monthly

- Monitor LegiScan API quota
- Check GitHub Actions workflow runs
- Review bill data for accuracy

### Quarterly

- Update dependencies (npm audit)
- Review and clean old bill data
- Test disaster recovery (backup restoration)

### On July 1st (Annually)

- LegiScan API quota resets
- Real bill data will resume (if quota was exhausted in June)

---

## Troubleshooting

### No bills showing on dashboard

1. Check backend is running: `curl http://localhost:4000/api/health`
2. Check logs: `pm2 logs moaa-backend`
3. Verify LegiScan API key: Check `/home/moaa-legi/backend/.env`
4. If quota exceeded: Wait until next month or get new API key

### Ingest not running

1. Check GitHub Actions workflow status
2. Verify `INGEST_SECRET` matches backend env var
3. Manual trigger: `curl -X POST https://moaa-legi.com/api/ingest/daily -H "X-Ingest-Token: YOUR_SECRET"`

### Dashboard not updating

1. Clear browser cache (Ctrl+Shift+R)
2. Check network tab in DevTools for `/api/bills` response
3. Verify Nginx is running: `systemctl status nginx`
4. Check Nginx logs: `tail -f /var/log/nginx/error.log`

---

## Future Enhancements

- [ ] Email alerts for priority bills
- [ ] Database (PostgreSQL) instead of file storage
- [ ] React frontend for better UX
- [ ] Persist bill change history
- [ ] Add sponsored bills section
- [ ] Mobile app

---

## Questions?

See `moaa-dashboard/DEPLOYMENT.md` for detailed deployment procedures.

For data accuracy issues, check `PROJECT_CLEANUP.md` for project structure and unused components.
