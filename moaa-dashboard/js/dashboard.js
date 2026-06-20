// ── SAMPLE / FALLBACK BILL DATA ─────────────────────────────────────────────
// Used if the live API (js/api.js -> fetchBillsFromAPI) is unreachable,
// or while you're still wiring up the backend connection in VS Code.
// scope: "federal" | "louisiana"
// status: "passed" | "failed" | "pending"
// category: "education" | "employment" | "tax" | "benefits" | "legal" | "military" | "other"

let BILLS = [
  {
    scope: "federal", bill: "S.RES.252", title: 'A resolution designating June 12, 2025, as "Women Veterans Appreciation Day."',
    description: 'A resolution designating June 12, 2025, as "Women Veterans Appreciation Day."',
    status: "passed", category: "military", moaaPriority: false,
    statusText: "Resolution agreed to in Senate without amendment and with a preamble by Unanimous Consent. (text: 6/12/2025 CR S3393)",
    sponsors: "Marsha Blackburn, Cory Booker, John Boozman, Susan Collins, Jacky Rosen, Jeanne Shaheen",
    link: "https://www.congress.gov/bill/119th-congress/senate-resolution/252"
  },
  {
    scope: "louisiana", bill: "HB 175", title: "Disabled Veteran Property Tax Exemption — Surviving Spouse Transfer",
    description: "Allows the surviving spouse of a disabled veteran to make a one-time transfer of the homestead tax exemption to another property.",
    status: "passed", category: "tax", moaaPriority: true,
    statusText: "Passed both chambers — heading to Nov. 3, 2026 ballot as constitutional amendment.",
    sponsors: "Rep. (TBD)",
    link: "https://www.legis.la.gov/legis/BillInfo.aspx?i=250094"
  },
  {
    scope: "louisiana", bill: "HB 402", title: "Tax Cut for Seniors and Veterans Act",
    description: "Provides an extra $12,500 state income tax deduction for veterans with a VA service-connected disability rating of 50% or more, and for residents aged 65 and older.",
    status: "pending", category: "tax", moaaPriority: true,
    statusText: "Referred to House Ways and Means Committee.",
    sponsors: "Rep. Alonzo Knox (D-93)",
    link: "https://www.legis.la.gov/legis/BillSearch.aspx"
  },
  {
    scope: "louisiana", bill: "HB 609", title: "Free Health Records for Veterans Seeking VA Disability Benefits",
    description: "Exempts fees for health records when veterans request them for the purpose of disability benefits administered by the U.S. or Louisiana Department of Veterans Affairs.",
    status: "pending", category: "benefits", moaaPriority: true,
    statusText: "Referred to House Health and Welfare Committee.",
    sponsors: "Rep. Chassion",
    link: "https://www.legis.la.gov/Legis/ViewDocument.aspx?d=1446028"
  },
  {
    scope: "louisiana", bill: "HB 682", title: "Veterans as School Resource Officers",
    description: "Allows military veterans to serve as school resource officers to help address shortages in school safety personnel.",
    status: "pending", category: "education", moaaPriority: false,
    statusText: "Advanced to full House from committee.",
    sponsors: "Rep. Kellee Dickerson",
    link: "https://www.legis.la.gov/legis/BillSearch.aspx"
  },
  {
    scope: "louisiana", bill: "SB 208", title: "Major Richard Star Act — Combat-Wounded Medically Retired Veterans",
    description: "Provides benefits for combat-wounded, medically retired veterans, mirroring the federal Major Richard Star Act.",
    status: "pending", category: "benefits", moaaPriority: true,
    statusText: "Referred to Senate Veterans Affairs Committee.",
    sponsors: "Sen. (TBD)",
    link: "https://legiscan.com/LA/bill/SB208/2026"
  },
  {
    scope: "louisiana", bill: "HB 157", title: "Foreign Adversary Property Near Military Installations",
    description: "Restricts foreign adversaries from acquiring or owning property near Louisiana military installations.",
    status: "pending", category: "military", moaaPriority: true,
    statusText: "Advanced from committee — on Senate floor calendar.",
    sponsors: "Rep./Sen. (TBD)",
    link: "https://legiscan.com/LA/search?q=foreign+adversary+military+installation&session=2466"
  },
  {
    scope: "federal", bill: "H.R.1968", title: "Major Richard Star Act",
    description: "To amend title 10, United States Code, to provide that all medically retired veterans are entitled to concurrent receipt of retirement pay and disability compensation.",
    status: "failed", category: "benefits", moaaPriority: true,
    statusText: "Referred to House Armed Services Committee — no further action this Congress.",
    sponsors: "Gus Bilirakis, Chrissy Houlahan",
    link: "https://www.congress.gov/bill/119th-congress/house-bill/1968"
  },
];

// ── STATE ────────────────────────────────────────────────────────────────────
let currentScope = "all";
let statusFilter = null;

const CATEGORY_LABELS = {
  education: "Education", employment: "Employment", tax: "Tax & Property",
  benefits: "Veterans Benefits", legal: "Legal & Justice",
  military: "Armed Forces & Security", property: "Property", housing: "Housing", other: "Other"
};

const RANK_COLORS = {
  education: "#6d4ca6", employment: "#1f7a8c", tax: "#b3791e",
  benefits: "#1f8a5a", legal: "#b03a4e", military: "#1d5499",
  property: "#2a8f8f", housing: "#2a8f8f", other: "#5a6478"
};

// ── INIT ─────────────────────────────────────────────────────────────────────
// Tries the live moaa-legi.com API first; falls back to the sample BILLS
// array above if the API isn't reachable yet (e.g. CORS not configured,
// endpoint not finalized, working offline in VS Code, etc.)
document.addEventListener('DOMContentLoaded', async () => {
  await loadBills();
  updateStats();
  render();
});

async function loadBills() {
  const liveData = await fetchBillsFromAPI(); // defined in js/api.js
  if (liveData && liveData.length > 0) {
    BILLS = liveData;
    console.info(`[moaa-legi] Loaded ${BILLS.length} bills from live API.`);
  } else {
    console.warn('[moaa-legi] Live API unavailable — using sample/fallback data.');
  }
}

function setScope(scope, el) {
  currentScope = scope;
  document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  updateStats();
  render();
}

function toggleStatusFilter(key, el) {
  if (statusFilter === key) {
    statusFilter = null;
    el.classList.remove('active');
  } else {
    statusFilter = key;
    document.querySelectorAll('.stat-card[data-key]').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
  renderChips();
  render();
}

function clearStatusFilter() {
  statusFilter = null;
  document.querySelectorAll('.stat-card[data-key]').forEach(c => c.classList.remove('active'));
  renderChips();
  render();
}

function renderChips() {
  const container = document.getElementById('activeChips');
  if (!statusFilter) { container.innerHTML = ''; return; }
  const labels = { passed: '✓ Passed', failed: '✕ Failed', pending: '◐ Pending' };
  container.innerHTML = `<div class="active-filter-chip">
    Status: ${labels[statusFilter]}
    <button onclick="clearStatusFilter()">✕</button>
  </div>`;
}

function scopedBills() {
  return BILLS.filter(b => currentScope === 'all' || b.scope === currentScope);
}

function updateStats() {
  const list = scopedBills();
  const total = list.length;
  const passed = list.filter(b => b.status === 'passed').length;
  const failed = list.filter(b => b.status === 'failed').length;
  const pending = list.filter(b => b.status === 'pending').length;
  const resolved = passed + failed;
  const rate = resolved > 0 ? Math.round((passed / resolved) * 100) : 0;

  document.getElementById('totalNum').textContent = total;
  document.getElementById('statPassed').textContent = passed;
  document.getElementById('statFailed').textContent = failed;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statRate').innerHTML = `${rate}%<span class="pct">of resolved</span>`;

  setBar('barPassed', total ? (passed/total*100) : 0);
  setBar('barFailed', total ? (failed/total*100) : 0);
  setBar('barPending', total ? (pending/total*100) : 0);
  setBar('barRate', rate);
}

function setBar(id, pct) {
  requestAnimationFrame(() => {
    document.getElementById(id).style.width = Math.max(pct, 2) + '%';
  });
}

function render() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const category = document.getElementById('categorySelect').value;

  let list = scopedBills().filter(b => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (category !== 'all' && b.category !== category) return false;
    if (search && !b.title.toLowerCase().includes(search) &&
        !b.description.toLowerCase().includes(search) &&
        !b.bill.toLowerCase().includes(search)) return false;
    return true;
  });

  document.getElementById('resultsCount').innerHTML =
    `Showing <strong>${list.length}</strong> of <strong>${scopedBills().length}</strong> bills`;

  const grid = document.getElementById('billGrid');
  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="icon">📋</div>
      <h3>No bills match your filters</h3>
      <p>Try a different search term, category, or clear the status filter.</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map((b, i) => {
    const statusBadgeClass = `badge-status-${b.status}`;
    const statusLabel = b.status === 'passed' ? '✓ Passed' : b.status === 'failed' ? '✕ Failed' : '◐ Pending';
    const catClass = `badge-cat-${b.category}`;
    const rankColor = RANK_COLORS[b.category] || '#c9a23f';

    return `<div class="bill-card" style="--rank-color:${rankColor}; animation-delay:${(i%12)*0.03}s">
      <div class="bill-card-head">
        <div class="bill-title">${b.title}</div>
        <div class="badge-group">
          <span class="badge badge-scope">${b.scope === 'federal' ? 'Federal' : 'Louisiana'}</span>
          <span class="badge ${statusBadgeClass}">${statusLabel}</span>
          <span class="badge ${catClass}">${CATEGORY_LABELS[b.category] || b.category}</span>
        </div>
      </div>
      <div class="bill-desc">${b.description}</div>
      <div class="bill-footer">
        <a class="bill-link" href="${b.link}" target="_blank">External bill link ↗</a>
        ${b.moaaPriority ? '<span class="moaa-flag">⭐ MOAA Priority</span>' : ''}
      </div>
    </div>`;
  }).join('');
}
