# LCOC MOAA Legislation Dashboard

A veterans/military legislative tracker for the **Louisiana Council of
Chapters, Military Officers Association of America (LCOC MOAA)**. Tracks
both **federal** and **Louisiana state** bills affecting veterans, military
personnel, and surviving spouses.

Live site (target): **https://moaa-legi.com/**

---

## Project structure

```
moaa-dashboard/
├── index.html          ← page markup (loads css + js below)
├── css/
│   └── dashboard.css   ← all styling (MOAA navy/gold theme)
├── js/
│   ├── api.js           ← connects to the DigitalOcean backend / LegiScan ingest
│   └── dashboard.js      ← rendering, filtering, search, stat cards
└── README.md            ← you are here
```

## How it currently works

1. On page load, `js/dashboard.js` calls `fetchBillsFromAPI()` (defined in
   `js/api.js`), which tries to hit your DigitalOcean backend.
2. If that succeeds, the live bills replace the sample data and render.
3. If it fails (CORS issue, wrong endpoint, backend down, etc.), the
   dashboard silently falls back to a small hardcoded sample array in
   `dashboard.js` so the UI still works while you're wiring things up.
   Check the browser console for `[moaa-legi]` log lines — they'll tell
   you whether live data loaded or it fell back to samples.

## ⚠️ What needs your input — start here

The single biggest unknown right now is **what your DigitalOcean API
actually returns**. I don't have network access to `moaa-legi.com` from
this environment, so everything in `js/api.js` is a best-guess scaffold,
not a tested integration. To wire it up for real:

1. **Confirm the base URL and endpoint.**
   Open `js/api.js` → `API_CONFIG`. Update `baseUrl` and
   `endpoints.bills` to match your actual backend route
   (e.g. is it `https://moaa-legi.com/api/bills`, or does the API live
   on a subdomain like `https://api.moaa-legi.com/bills`?).

2. **Confirm the response shape.**
   In a terminal, run:
   ```bash
   curl https://moaa-legi.com/api/bills | json_pp
   ```
   (or whatever your real endpoint is) and look at the actual JSON keys
   your backend returns — they almost certainly differ from what's
   guessed in `normalizeBill()`. Update that function's field mappings
   to match (e.g. if your backend calls it `bill_id` instead of
   `bill_number`, fix the line that reads `raw.bill_number`).

3. **Confirm LegiScan status code mapping.**
   `mapLegiscanStatus()` assumes LegiScan's standard codes
   (1=Introduced, 2=Engrossed, 3=Enrolled, 4=Passed, 5=Vetoed,
   6=Failed). If your backend stores LegiScan's raw `status` integer,
   this should just work. If your backend already converts it to a
   string status, simplify this function to a direct pass-through.

4. **Decide on category logic.**
   LegiScan doesn't categorize bills into "Education / Employment /
   Tax / Benefits / Legal / Military / Other" — that taxonomy is yours.
   Either:
   - Store a `category` field yourself when bills are ingested into
     your DigitalOcean backend (recommended — keeps it consistent and
     queryable), or
   - Let `inferCategory()` in `api.js` keep guessing from keywords
     (works, but noisier — see the category logic discussion in chat
     history for the original reasoning behind each bucket).

5. **CORS.** If `moaa-legi.com` is the same origin serving this
   dashboard, you won't hit CORS issues. If the dashboard is hosted
   elsewhere (e.g. a separate static host) and calls the API
   cross-origin, your DigitalOcean backend needs to send
   `Access-Control-Allow-Origin` headers permitting the dashboard's
   domain.

## Running locally

No build step — it's plain HTML/CSS/JS. Easiest options:

```bash
# Option A: Python's built-in server
python3 -m http.server 8000
# then open http://localhost:8000

# Option B: VS Code's "Live Server" extension
# Right-click index.html → "Open with Live Server"
```

## MOAA Priority flag logic (for reference)

Bills are flagged `moaaPriority: true` based on direct, tangible impact
on veterans' benefits, pay, and disability compensation — used as a
proxy for likely MOAA legislative priorities. This was confirmed as the
intended logic; the board can override or expand it bill-by-bill by
setting `moaaPriority` in the data (either in your backend or in the
sample array).

## Category assignment logic (for reference)

Bills are categorized by their **primary mechanism** — what government
function or process the bill actually changes — not solely by who it
affects. E.g. a bill giving veterans hiring preference is categorized
as **Employment**, not generically as "Veterans," because employment is
the mechanism being changed. The seven categories in use:

- **Education** — schools, school staffing, education benefits/eligibility
- **Employment** — hiring, civil service preference points, job categories
- **Tax & Property** — tax exemptions, deductions, homestead transfers
- **Veterans Benefits** — VA/state benefit programs, disability comp, grants
- **Legal & Justice** — courts, guardianship, criminal justice, stolen valor
- **Armed Forces & Security** — active duty, installations, national security
- **Other** — commemorative designations, etc.

## Next steps / open items

- [ ] Confirm DigitalOcean API base URL + bill list endpoint
- [ ] Confirm actual JSON field names from backend → update `normalizeBill()`
- [ ] Decide where `category` and `moaaPriority` should live (backend vs. frontend override)
- [ ] Pull **official bill titles/digests** from LegiScan instead of hand-written summaries for anything published publicly (see chat history — current sample titles are Claude's plain-English paraphrases, not official legislative text)
- [ ] Set up email alert backend (signup UI exists in earlier dashboard version, not yet wired here)
- [ ] Deploy to moaa-legi.com (static hosting — Nginx on the same Droplet as the API, or a separate static host pointed at the domain)
