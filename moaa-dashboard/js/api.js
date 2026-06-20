// ─────────────────────────────────────────────────────────────────────────
// MOAA-LEGI API CONNECTOR
// Connects the dashboard to the DigitalOcean backend at moaa-legi.com
// which ingests US (federal) and LA (state) bills from LegiScan.
// ─────────────────────────────────────────────────────────────────────────

const API_CONFIG = {
  baseUrl: "https://moaa-legi.com",

  endpoints: {
    bills: "/api/bills",
    billById: "/api/bills/:id"
  },

  headers: {
    "Content-Type": "application/json"
  }
};

/**
 * Fetches all tracked bills from the backend API.
 */
async function fetchBillsFromAPI() {
  const url = API_CONFIG.baseUrl + API_CONFIG.endpoints.bills;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: API_CONFIG.headers
    });

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`);
    }

    const data = await res.json();

    // Backend returns { bills: [...], count: X, federal: X, louisiana: X }
    const rawBills = Array.isArray(data) ? data : (data.bills || data.data || []);

    if (rawBills.length === 0) {
      console.warn("[moaa-legi] API returned no bills");
      return null;
    }

    const normalized = rawBills.map(normalizeBill);
    console.info(`[moaa-legi] Loaded ${normalized.length} bills from live API (${data.federal || 0} federal, ${data.louisiana || 0} state).`);
    return normalized;

  } catch (err) {
    console.error("[moaa-legi] Failed to fetch live bill data:", err);
    return null;
  }
}

/**
 * Maps a bill from the backend API into the dashboard UI format.
 * Backend sends: { id, source, title, summary, status, subjects[], sponsors[], billUrl, ... }
 * Dashboard expects: { scope, bill, title, description, status, category, moaaPriority, statusText, sponsors, link }
 */
function normalizeBill(raw) {
  // Extract bill number from id (e.g., "federal-HR1234" → "HR1234")
  const billNumber = raw.id ? raw.id.split('-').pop() : "";

  return {
    scope: raw.scope || raw.source || "federal",

    bill: billNumber,

    title: raw.title || "",

    description: raw.summary || "",

    // Map status text to our three-bucket system
    status: parseStatusText(raw.status || ""),

    // Use category from backend if available, otherwise infer from text
    category: (raw.category && normalizeCategory(raw.category)) || inferCategory(raw),

    moaaPriority: raw.moaaPriority || false,

    // Use the full status text from backend
    statusText: raw.status || "",

    // Join sponsors array into comma-separated string
    sponsors: Array.isArray(raw.sponsors)
      ? raw.sponsors.filter(s => s).join(", ")
      : (raw.sponsors || ""),

    link: raw.billUrl || ""
  };
}

/**
 * Normalize category names from backend to dashboard format
 */
function normalizeCategory(cat) {
  if (!cat) return null;
  const normalized = cat.toLowerCase().replace(/\s+/g, '-');
  const mapping = {
    'education': 'education',
    'employment': 'employment',
    'tax-property': 'tax',
    'tax-&-property': 'tax',
    'veterans-benefits': 'benefits',
    'legal-justice': 'legal',
    'legal-&-justice': 'legal',
    'armed-forces-&-security': 'military',
    'armed-forces': 'military',
    'other': 'other'
  };
  return mapping[normalized] || null;
}

/**
 * Parse full status text into our simple status buckets.
 * Examples: "Introduced in House" → "pending", "Passed House" → "pending",
 *           "Passed Legislature" → "passed", "Failed Committee" → "failed"
 */
function parseStatusText(statusText) {
  const text = (statusText || "").toLowerCase();

  // Check for passed/signed states
  if (/passed|signed|enacted|approved/i.test(text) && !/veto/i.test(text)) {
    return "passed";
  }

  // Check for failed/vetoed states
  if (/failed|dead|vetoed|rejected|withdrawn/i.test(text)) {
    return "failed";
  }

  // Default to pending for anything else
  return "pending";
}


/**
 * Categorize bills based on subjects and title/summary text.
 * Priority: keywords in title/summary > subject tags > fallback to Veterans Benefits if subject=veterans
 */
function inferCategory(raw) {
  const subjects = (raw.subjects || []).join(" ").toLowerCase();
  const title = (raw.title || "").toLowerCase();
  const summary = (raw.summary || "").toLowerCase();
  const haystack = subjects + " " + title + " " + summary;

  // Check specific keywords first (highest priority)
  if (/tax|property|homestead|exemption|deduction/.test(haystack)) return "tax";
  if (/school|education|tops|student|tuition|university/.test(haystack)) return "education";
  if (/employ|hiring|civil service|job|occupation|preference|work as|work in/.test(haystack)) return "employment";
  if (/disability|benefit|grant|compensation|va \b|pension|retirement|medical/.test(haystack)) return "benefits";
  if (/court|guardian|legal|justice|criminal|judge|veteran status|stolen valor/.test(haystack)) return "legal";
  if (/military|national guard|armed forces|active duty|installation|defense|soldier|service member/.test(haystack)) return "military";

  // Fallback: if subject includes "veterans" but no other category matched, use Veterans Benefits
  if (/veteran/.test(subjects)) return "benefits";

  return "other";
}
