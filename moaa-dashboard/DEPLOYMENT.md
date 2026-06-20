# MOAA Dashboard Deployment Guide

## Overview

The MOAA Dashboard is now fully integrated with your backend API. It consists of:

- **Frontend**: Static HTML/CSS/JS files (no build step required)
- **Backend**: Express API at `/api/bills` serving federal and Louisiana bills from LegiScan ingestion
- **Target URL**: https://moaa-legi.com/

## Architecture

```
User Browser
    ↓
https://moaa-legi.com (serves index.html, css, js)
    ↓
    ├─ GET /api/bills → Returns combined federal + louisiana bills
    ├─ GET /api/federal → Federal bills only
    └─ GET /api/louisiana → Louisiana bills only
```

## What's Changed

### Backend (backend/src/api.ts)
- ✅ Added `GET /api/bills` endpoint that combines federal and Louisiana bills
- ✅ Returns bills with `scope` field (mapped from `source`) for dashboard compatibility
- ✅ Includes metadata: `count` (total), `federal` (count), `louisiana` (count)

### Backend (backend/src/index.ts)
- ✅ Updated CORS to allow requests from:
  - https://moaa-legi.com
  - https://www.moaa-legi.com
  - localhost:3000, localhost:5173, localhost:8000

### Dashboard (moaa-dashboard/js/api.js)
- ✅ Updated API_CONFIG to point to https://moaa-legi.com/api/bills
- ✅ Implemented `normalizeBill()` to map backend Bill structure to dashboard format
- ✅ Implemented `parseStatusText()` to convert status strings to 3-bucket system (pending/passed/failed)
- ✅ Improved `inferCategory()` to categorize bills from subjects and text

## Bill Data Mapping

**Backend sends** (from LegiScan ingestion):
```json
{
  "id": "louisiana-HB175",
  "source": "louisiana",
  "title": "Disabled Veteran Property Tax Exemption",
  "summary": "Allows surviving spouse...",
  "status": "Passed Legislature",
  "introducedDate": "2025-01-15",
  "lastActionDate": "2025-05-10",
  "subjects": ["tax", "veterans", "property"],
  "sponsors": ["Rep. Smith", "Sen. Jones"],
  "billUrl": "https://legiscan.com/LA/bill/HB175/2026"
}
```

**Dashboard displays**:
```json
{
  "scope": "louisiana",
  "bill": "HB175",
  "title": "Disabled Veteran Property Tax Exemption",
  "description": "Allows surviving spouse...",
  "status": "passed",
  "category": "tax",
  "statusText": "Passed Legislature",
  "sponsors": "Rep. Smith, Sen. Jones",
  "link": "https://legiscan.com/LA/bill/HB175/2026",
  "moaaPriority": false
}
```

## Local Development & Testing

### Option 1: Docker Compose (full stack)

```bash
cd infra
docker compose up --build
# Backend: http://localhost:4000
# Frontend: http://localhost:5173
```

Then access the MOAA dashboard at http://localhost:8000:

```bash
cd moaa-dashboard
# Option A: Python
python3 -m http.server 8000

# Option B: Node/npm
npx http-server -p 8000
```

**Note**: Update API_CONFIG.baseUrl in api.js to `http://localhost:4000` for local testing, or set up a proxy.

### Option 2: Just test the MOAA dashboard locally

```bash
cd moaa-dashboard
python3 -m http.server 8000
# Open http://localhost:8000
```

The dashboard will use fallback sample data if the API is unreachable (check browser console for `[moaa-legi]` logs).

## Production Deployment to moaa-legi.com

### Prerequisites

- ✅ Backend running on DigitalOcean (167.172.158.216:4000)
- ✅ PostgreSQL database with bills_db (or equivalent)
- ✅ Daily LegiScan ingest job running (via GitHub Actions workflow)
- ✅ Domain moaa-legi.com pointing to your DigitalOcean droplet

### Step 1: Deploy Backend (if not already running)

The backend should already be running on your DigitalOcean droplet. If you need to redeploy:

```bash
# SSH into droplet
ssh root@167.172.158.216

# Pull latest code
cd /path/to/legislative-dashboard
git pull origin main

# Install dependencies
npm install --prefix backend

# Build backend (if using TypeScript)
npm run build --prefix backend

# Restart service (adjust based on your service manager)
systemctl restart moaa-backend  # or pm2 restart, or your setup
```

### Step 2: Deploy Dashboard Files

Copy the moaa-dashboard folder to your web server:

```bash
# If using Nginx on the same droplet:
scp -r moaa-dashboard/* root@167.172.158.216:/var/www/moaa-dashboard/

# Or clone the entire repo and link:
# ssh root@167.172.158.216
# cd /var/www
# git clone <your-repo>
# ln -s legislative-dashboard/moaa-dashboard moaa
```

### Step 3: Configure Web Server (Nginx)

Add to `/etc/nginx/sites-available/moaa-legi.com`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name moaa-legi.com www.moaa-legi.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name moaa-legi.com www.moaa-legi.com;

    ssl_certificate /etc/letsencrypt/live/moaa-legi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moaa-legi.com/privkey.pem;

    # Static files (dashboard)
    root /var/www/moaa-dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart Nginx:

```bash
ln -s /etc/nginx/sites-available/moaa-legi.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 4: Verify Deployment

```bash
# Check backend is running
curl http://localhost:4000/api/health
# Should return: {"status": "ok"}

# Check bills endpoint
curl http://localhost:4000/api/bills | jq '.count'
# Should return a number > 0

# Check dashboard is accessible
curl https://moaa-legi.com/ | head -20
# Should show HTML starting with <!DOCTYPE html>

# Check API is accessible from browser origin
curl -H "Origin: https://moaa-legi.com" \
     -H "Access-Control-Request-Method: GET" \
     -i http://localhost:4000/api/bills
# Should include Access-Control-Allow-Origin header
```

## Troubleshooting

### Dashboard shows sample data instead of live bills

Check the browser console (F12 → Console tab) for `[moaa-legi]` log messages:

```javascript
// If you see this, the API is unreachable:
// "[moaa-legi] Failed to fetch live bill data:"

// If you see this, it worked:
// "[moaa-legi] Loaded 42 bills from live API (25 federal, 17 state)."
```

**Common issues:**
1. **CORS error**: Backend not configured to allow moaa-legi.com origin
   - Check backend/src/index.ts cors() config includes the domain
   
2. **404 on /api/bills**: Endpoint may not be deployed
   - Ensure backend/src/api.ts has the new endpoint
   - Restart backend after code changes

3. **API timeout**: Backend may not have bills ingested yet
   - Run `gh workflow run daily-ingest.yml` to trigger ingest
   - Or check PostgreSQL has data: `SELECT COUNT(*) FROM bills WHERE source='federal';`

### Bills showing wrong categories

Categories are inferred from `subjects` and `title`/`summary` text using regex patterns in `inferCategory()`.

To set categories manually:
1. **In backend**: Add `category` field to Bill model and store it
2. **In database**: Update the bills table with categories
3. **In dashboard**: Use `raw.category` directly in `normalizeBill()`

### Bills showing wrong status

Status is parsed from `status` text field using `parseStatusText()`. Check these keywords are working:

- **Passed**: "Passed", "Signed", "Enacted", "Approved"
- **Failed**: "Failed", "Vetoed", "Dead", "Rejected"
- **Pending**: Everything else

Add more patterns if your backend uses different status text.

## Feature Flags & Customization

### MOAA Priority Flag

By default, `moaaPriority` is always `false`. To use it:

1. **Option A**: Store `moaa_priority` in the database and set it during ingest
2. **Option B**: Use a curated list in the dashboard:
   ```javascript
   // In dashboard.js or api.js
   const moaaPriorityIds = ['louisiana-HB175', 'louisiana-HB402', ...];
   // Then in normalizeBill():
   moaaPriority: moaaPriorityIds.includes(raw.id) || raw.moaa_priority || false,
   ```

### Filtering by Scope

The dashboard supports three scope views:
- **All Bills** (federal + louisiana)
- **Federal** (Congress only)
- **Louisiana** (state legislature only)

This is enabled by the `scope` field in the normalized data. No additional config needed.

## Next Steps

1. ✅ **Local testing**: Verify dashboard loads bills from backend on localhost
2. ✅ **Deploy backend**: Ensure API is running on moaa-legi.com
3. ✅ **Deploy dashboard**: Copy files to web server
4. ✅ **Configure Nginx**: Set up static + API proxy
5. **Test live**: Visit https://moaa-legi.com and verify bills load
6. **Set up monitoring**: Configure uptime alerts, error logging
7. **Set up email alerts** (future): Implement subscriber notifications for priority bills

## API Reference

### GET /api/bills

Returns all tracked bills from both federal and Louisiana sources.

**Response**:
```json
{
  "bills": [
    {
      "id": "louisiana-HB175",
      "source": "louisiana",
      "scope": "louisiana",
      "title": "...",
      "summary": "...",
      "status": "Passed Legislature",
      "subjects": ["tax", "veterans"],
      "sponsors": ["Rep. Smith"],
      "billUrl": "https://..."
    }
  ],
  "count": 42,
  "federal": 25,
  "louisiana": 17
}
```

### GET /api/federal

Federal bills only.

### GET /api/louisiana

Louisiana bills only.

### GET /api/bills/:id

Fetch single bill by ID.

### POST /api/ingest/daily (internal)

Trigger daily ingest from LegiScan. Requires `X-Ingest-Token` header.

---

**Questions?** Check the main README.md in this directory, or look at git history for context on bill categorization and MOAA priority logic.
