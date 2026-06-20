# Project Cleanup Analysis

## Current Production Setup

**Live Site:** https://moaa-legi.com/

### Active Components (NEEDED ✓)

1. **Backend API** (Node.js + TypeScript)
   - Location: `backend/src`
   - Deployment: DigitalOcean droplet (167.172.158.216:4000)
   - Purpose: LegiScan ingest, bill storage, API endpoints
   - Status: ✅ Active and working

2. **MOAA Dashboard** (Static HTML/CSS/JS)
   - Location: `moaa-dashboard/`
   - Deployment: DigitalOcean Nginx
   - Purpose: Public UI for bill tracking
   - Status: ✅ Live at moaa-legi.com

3. **GitHub Actions Workflows**
   - `daily-ingest.yml` - Triggers ingest at 10 AM UTC daily ✅ NEEDED
   - `deploy-backend.yml` - Auto-deploys backend to DigitalOcean ✅ NEEDED
   - `ci.yml` - Runs linting/tests ✅ NICE TO HAVE

4. **Services**
   - DigitalOcean droplet ✅ NEEDED
   - GitHub repo ✅ NEEDED
   - LegiScan API ✅ NEEDED (quota resets July 1)
   - PM2 (process manager) ✅ NEEDED

---

## Unused Components (Can be Removed)

### 1. **React Frontend** (`frontend/` folder)
- Status: ❌ NOT USED
- Reason: Replaced by static `moaa-dashboard/`
- Action: **DELETE entire folder** and its workflow
- Files to remove:
  - `frontend/` directory
  - `.github/workflows/deploy-frontend.yml`

### 2. **DEPLOYMENT.md** (Root level)
- Status: ❌ OUTDATED
- References: Render.com, GitHub Pages (not our setup)
- Action: **DELETE and replace with accurate deployment guide**

### 3. **Unused Backend Code**

#### `backend/src/db.ts`
- Status: ❌ NOT USED
- Reason: Using file-based storage instead of PostgreSQL
- Action: **DELETE**

#### `backend/src/keywords.ts`
- Status: ⚠️ MINIMAL USE
- Current usage: Filtering for veteran-related bills
- Recommendation: Keep (small file, functional)

#### Old GitHub Actions
- `deploy-frontend.yml` - DELETE (frontend not used)

### 4. **README Files That Are Outdated**
- `backend/README.md` - Generic, doesn't match actual setup
- `infra/README.md` - Docker Compose setup (rarely used)

---

## Accounts/Services Analysis

### Services You Need to Keep

| Service | Purpose | Status | Action |
|---------|---------|--------|--------|
| **DigitalOcean** | Hosting backend + dashboard | Active | ✅ KEEP |
| **GitHub** | Code repository | Active | ✅ KEEP |
| **LegiScan API** | Bill data source | Quota exhausted (resets July 1) | ✅ KEEP |

### Accounts You Don't Need

| Service | Reason | Action |
|---------|--------|--------|
| **Render.com** | We use DigitalOcean, not Render | DELETE if you created it |
| **Heroku** | We use DigitalOcean, not Heroku | DELETE if you created it |
| **GitHub Pages** | We serve from Nginx, not GitHub Pages | No action (just don't use it) |

---

## Recommended Cleanup Steps

### Phase 1: Remove Unused Code
```bash
# Delete frontend (not used)
rm -r frontend/

# Delete deploy-frontend workflow (not used)
rm .github/workflows/deploy-frontend.yml

# Delete outdated DEPLOYMENT.md
rm DEPLOYMENT.md

# Delete unused database code
rm backend/src/db.ts
```

### Phase 2: Clean Up Workflows
- Keep: `daily-ingest.yml` and `deploy-backend.yml`
- Delete: `deploy-frontend.yml`

### Phase 3: Update Documentation
- Update root `README.md` to reflect actual deployment (DigitalOcean, not Render/GitHub Pages)
- Keep `moaa-dashboard/DEPLOYMENT.md` (accurate)
- Update `infra/README.md` to note it's optional for local dev

---

## File Structure After Cleanup

```
legislative-dashboard/
├── backend/                    # Node.js API
│   └── src/                   # TypeScript source
│       ├── api.ts             # ✅ KEEP
│       ├── ingest.ts          # ✅ KEEP
│       ├── fileStore.ts       # ✅ KEEP
│       ├── store.ts           # ✅ KEEP
│       ├── keywords.ts        # ✅ KEEP
│       ├── sources/
│       │   └── legiscan.ts    # ✅ KEEP
│       ├── models/
│       │   └── bill.ts        # ✅ KEEP
│       ├── mockData.ts        # ✅ KEEP
│       └── index.ts           # ✅ KEEP
│
├── moaa-dashboard/            # Static website (LIVE)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── README.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # ✅ KEEP (nice to have)
│       ├── daily-ingest.yml   # ✅ KEEP (essential)
│       └── deploy-backend.yml # ✅ KEEP (essential)
│
├── infra/                      # Optional local dev setup
├── README.md                   # ✅ UPDATE
└── moaa-dashboard/DEPLOYMENT.md # ✅ ALREADY GOOD
```

---

## Environment Variables to Keep

On **DigitalOcean** (`/home/moaa-legi/backend/.env`):
```
LEGISCAN_API_KEY=a3c518677d97b97a35679c6df451ca9d
```

On **GitHub Secrets**:
```
DEPLOY_KEY          # SSH key for DigitalOcean
INGEST_SECRET       # Token for daily ingest endpoint
```

---

## Notes for July 1st

When LegiScan quota resets:
1. Ingest will automatically work again
2. No code changes needed
3. Real bills will populate the dashboard
4. Daily GitHub Actions workflow will resume normal operation
