# Cleanup Action Checklist

## Files to Delete

### Local (in your repo)

- [ ] Delete entire `frontend/` folder
  ```bash
  rm -r frontend/
  ```

- [ ] Delete outdated root `DEPLOYMENT.md`
  ```bash
  rm DEPLOYMENT.md
  ```

- [ ] Delete unused workflow
  ```bash
  rm .github/workflows/deploy-frontend.yml
  ```

- [ ] Delete unused database code
  ```bash
  rm backend/src/db.ts
  ```

- [ ] Delete `backend/README.md` (generic, inaccurate)
  ```bash
  rm backend/README.md
  ```

### Commit and Push

```bash
git add -A
git commit -m "Clean up: remove frontend, unused code, and outdated docs

- Delete React frontend (replaced by static moaa-dashboard)
- Delete deploy-frontend.yml workflow (frontend not deployed)
- Delete outdated DEPLOYMENT.md (was Render/GitHub Pages focused)
- Delete unused db.ts (using file storage, not SQL)
- Delete generic backend README
- Update root README with accurate DigitalOcean + LegiScan setup
- Add PROJECT_CLEANUP.md and CLEANUP_TODO.md for reference

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
git push origin main
```

---

## Accounts to Cancel/Disable

### Check Your Accounts

- [ ] **Render.com** — If you created an account:
  - Log in at https://render.com
  - Delete the web service if one exists
  - Consider deleting account (we use DigitalOcean instead)

- [ ] **Heroku** — If you created an account:
  - Check https://dashboard.heroku.com
  - Delete any apps related to this project
  - Consider deleting account

- [ ] **GitHub Pages** — No action needed
  - We don't use it, just ignore it
  - Frontend is served from DigitalOcean Nginx instead

- [ ] **Verify DigitalOcean is active:**
  - Check droplet: 167.172.158.216
  - Should have moaa-legi running on PM2
  - Should have Nginx proxying requests

---

## Services You Need to Keep

✅ **DigitalOcean Droplet** (167.172.158.216)
- Cost: ~$5/month
- Essential: Backend API + Dashboard hosting
- Keep running

✅ **GitHub Repository**
- Essential: Code storage + CI/CD workflows
- Keep active

✅ **LegiScan API**
- Cost: Free tier (30,000 requests/month)
- Essential: Bill data source
- Keep: API key configured in backend/.env

✅ **PM2** (on droplet)
- Essential: Process manager for backend
- Already installed and configured

---

## Post-Cleanup Verification

After deleting files and pushing:

- [ ] Check GitHub Actions still works:
  - Go to repo → Actions tab
  - Should show only `ci.yml`, `daily-ingest.yml`, `deploy-backend.yml`
  - Should NOT show `deploy-frontend.yml`

- [ ] Verify dashboard still works:
  - Visit https://moaa-legi.com
  - Should still show 6 bills (sample data until July 1)
  - Nginx didn't change, so no deployment needed

- [ ] Test backend deployment workflow:
  - Make a small change to `backend/src/api.ts`
  - Push to main
  - Watch GitHub Actions run `deploy-backend.yml`
  - Should successfully deploy and restart PM2 on droplet

---

## What Was Actually Used

### In Production
1. **Backend API** (backend/src) ✅
2. **MOAA Dashboard** (moaa-dashboard/) ✅
3. **GitHub Actions Workflows** (3 of 4) ✅
4. **DigitalOcean Droplet** ✅
5. **LegiScan API** ✅

### NOT Used (Can Delete)
1. ❌ React Frontend (frontend/)
2. ❌ GitHub Pages deployment
3. ❌ Render.com
4. ❌ Heroku
5. ❌ PostgreSQL setup (we use file storage)
6. ❌ Outdated documentation

---

## Optional: Keep Locally

The following are optional but useful to keep:

- **infra/docker-compose.yml** — Good for local development if needed
- **backend/src/mockData.ts** — Fallback data for testing
- **moaa-dashboard/test-local.sh** — Testing script

---

## Notes

- **After cleanup, the project will be 50% smaller** (no frontend node_modules)
- **No functionality lost** — only unused code removed
- **Dashboard will keep working** — no changes to production code
- **Workflows simplified** — clear purpose, easy to maintain

---

## Summary

### Accounts Created (Check These)
1. Render.com? → DELETE if unused
2. Heroku? → DELETE if unused
3. DigitalOcean? → KEEP (droplet running)
4. LegiScan? → KEEP (API key active)
5. GitHub? → KEEP (repo + Actions)

### Essential Remaining Services
- DigitalOcean ($5/month)
- GitHub (free)
- LegiScan API (free, 30k/month quota)

### Total Project Size After Cleanup
- Before: ~250MB (with node_modules)
- After: ~125MB (frontend removed)
- GitHub storage saved: ~50MB
