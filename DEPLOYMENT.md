# Deployment Guide

## GitHub Setup

1. Push code to GitHub:
```powershell
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/louc-moaa-legislation-dashboard
git push -u origin main
```

2. Enable GitHub Pages:
   - Go to repo → Settings → Pages
   - Select "Deploy from a branch"
   - Choose `gh-pages` branch
   - Save

3. Add GitHub Secrets:
   - Go to repo → Settings → Secrets and Variables → Actions
   - Add these secrets:
     - `BACKEND_URL` = Backend deployed URL
     - `RENDER_DEPLOY_URL` = Render deploy hook (after setup below)
     - `BACKEND_INGEST_URL` = Backend deployed URL (for daily ingest)
     - `INGEST_SECRET` = Your chosen secret token
     - `PROPUBLICA_API_KEY` = Get from https://www.propublica.org/datastore/api
     - `LEGISCAN_API_KEY` = Get from https://legiscan.com/legiscan-api

## Frontend: GitHub Pages (Automatic)

Frontend builds and deploys automatically on every push to `main` branch.

Access at: `https://YOUR_USERNAME.github.io/louc-moaa-legislation-dashboard/`

## Backend: Render.com Deployment

### 1. Create Render Account

- Sign up at https://render.com (free tier available)
- Connect your GitHub account

### 2. Create Web Service

1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name**: `louc-moaa-legislation-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free tier

### 3. Set Environment Variables

In Render service settings, add:
```
PORT=4000
RUN_INGEST_ON_START=false
PROPUBLICA_API_KEY=your_key
LEGISCAN_API_KEY=your_key
INGEST_SECRET=your_secret_token
NODE_ENV=production
```

### 4. Get Deploy Hook

1. In Render → Settings → Deploys
2. Copy the Deploy Hook URL
3. Add to GitHub secrets as `RENDER_DEPLOY_URL`

### 5. Update Backend URL Secret

Once deployed, your backend URL will be something like:
`https://louc-moaa-legislation-backend-xxxx.onrender.com`

Add to GitHub secrets:
- `BACKEND_URL` = Your Render service URL
- `BACKEND_INGEST_URL` = Your Render service URL

## Daily Ingest Schedule

The workflow runs automatically at 10 AM UTC daily via GitHub Actions.

To manually trigger:
1. Go to Actions tab
2. Click "Daily Ingest"
3. Click "Run workflow"

## Troubleshooting

### Frontend not loading data
- Check browser console for API errors
- Verify `BACKEND_URL` secret is set correctly
- Check that backend is running

### Backend failing to deploy
- Check Render logs for build errors
- Verify environment variables are set
- Ensure Node version is 20+

### Daily ingest not running
- Check GitHub Actions logs
- Verify `INGEST_SECRET` matches backend
- Verify `BACKEND_INGEST_URL` is correct
