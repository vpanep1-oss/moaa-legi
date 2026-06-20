import axios from 'axios';
import { legislationKeywords } from '../keywords.js';

const LOUISIANA_STATE = 'LA';
const FEDERAL_STATE = 'US';
const API_BASE = 'https://api.legiscan.com/';

// In-memory cache of bills we already have (maps bill_id -> changeHash)
// In production, this should be in the database
let billChangeHashCache: { [billId: string]: string } = {};

function getApiKey() {
  return process.env.LEGISCAN_API_KEY ?? '';
}

type Bill = {
  id: string;
  source: 'federal' | 'louisiana';
  title: string;
  summary: string;
  status: string;
  statusCode?: number;
  introducedDate?: string;
  lastActionDate?: string;
  subjects: string[];
  sponsors: string[];
  billUrl?: string;
  changeHash?: string;
  billNumber?: string;
  category?: string;
};

type FetchResult = {
  bills: Bill[];
  queryUrl?: string;
  totalFetched?: number;
  totalUpdated?: number;
};

/**
 * Parse LegiScan numeric status codes to readable text
 * 1 = Introduced, 2 = Engrossed, 3 = Enrolled, 4 = Passed, 5 = Vetoed, 6 = Failed
 */
function parseStatusCode(code: number): string {
  const mapping: { [key: number]: string } = {
    1: 'Introduced',
    2: 'Engrossed',
    3: 'Enrolled',
    4: 'Passed',
    5: 'Vetoed',
    6: 'Failed'
  };
  return mapping[code] || `Status ${code}`;
}

/**
 * Fetch all bills from a state using getMasterList
 * Returns just the list with bill_id, status, and change_hash
 */
async function fetchMasterList(state: string): Promise<any[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('LEGISCAN_API_KEY is not configured');
    return [];
  }

  try {
    const url = `${API_BASE}?key=${apiKey}&op=getMasterList&state=${state}`;
    console.log(`Fetching master list for state: ${state}`);
    const response = await axios.get(url, { timeout: 15000 });

    if (response.data.alert) {
      console.warn(`LegiScan alert for ${state}:`, response.data.alert);
      return [];
    }

    const masterList = response.data.masterlist;
    if (!Array.isArray(masterList)) {
      console.warn(`No bills found in master list for ${state}`);
      return [];
    }

    console.log(`Master list for ${state}: ${masterList.length} bills available`);
    return masterList;
  } catch (error) {
    console.error(`Error fetching master list for ${state}:`, error);
    return [];
  }
}

/**
 * Fetch detailed bill information from LegiScan
 * Returns full bill object with status, sponsors, history, etc.
 */
async function fetchBillDetail(billId: number): Promise<any | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const url = `${API_BASE}?key=${apiKey}&op=getBill&id=${billId}`;
    const response = await axios.get(url, { timeout: 15000 });

    if (response.data.alert) {
      console.warn(`LegiScan alert for bill ${billId}:`, response.data.alert);
      return null;
    }

    return response.data.bill;
  } catch (error) {
    console.error(`Error fetching bill detail for ${billId}:`, error);
    return null;
  }
}

/**
 * Check if a bill is veteran-related based on title/description
 */
function isVeteranRelated(bill: any): boolean {
  const title = (bill.title || '').toLowerCase();
  const summary = (bill.summary || bill.description || '').toLowerCase();
  const subjects = Array.isArray(bill.subjects)
    ? bill.subjects.map((s: any) => (typeof s === 'string' ? s : s.subject_name || '')).join(' ').toLowerCase()
    : '';

  const text = `${title} ${summary} ${subjects}`;

  // Exclude non-relevant bills
  const excludeKeywords = ['appropriation', 'capital outlay', 'consumer', 'surveillance', 'omnibus'];
  if (excludeKeywords.some((keyword) => text.includes(keyword))) return false;

  // Must match veteran-related keywords
  return legislationKeywords.some((keyword: string) => text.includes(keyword.toLowerCase())) &&
    /veteran|military|service member|national guard|armed force/i.test(text);
}

/**
 * Categorize a bill based on its content
 */
function detectCategory(bill: any): string {
  const title = (bill.title || '').toLowerCase();
  const summary = (bill.summary || bill.description || '').toLowerCase();
  const subjects = Array.isArray(bill.subjects)
    ? bill.subjects.map((s: any) => (typeof s === 'string' ? s : s.subject_name || '')).join(' ').toLowerCase()
    : '';
  const text = `${title} ${summary} ${subjects}`;

  // Abort on controversial topics
  if (text.match(/abortion/i)) return 'Other';

  if (text.match(/\b(tax|exemption|deduction|homestead|property transfer|mortgage)\b/i)) return 'Tax & Property';
  if (text.match(/title\s*38|disabilit|combat.*related|va benefit|health record|mental health|suicide|grant|compensation|pension|presumption|service.?connection/i))
    return 'Veterans Benefits';
  if (text.match(/(court|guardianship|crime|justice|mentor|stolen valor|legal|probate)/i)) return 'Legal & Justice';
  if (text.match(/(hire|hiring|civil service|preference|job|career|position|work|warden|guardian)/i) && text.match(/(employment|job|work)/i))
    return 'Employment';
  if (text.match(/\b(school|tuition|gi bill|apprentice|educator|teacher|student|education)\b/i)) return 'Education';
  if (text.match(/(active duty|national guard|installation|national security|commendation|decoration|medal|memorial|military|armed force|foreign|adversary)/i))
    return 'Armed Forces & Security';
  if (text.match(/\bveteran|va\b/i)) return 'Veterans Benefits';

  return 'Other';
}

/**
 * Normalize a bill from LegiScan getBill response
 */
function normalizeBill(bill: any, state: 'federal' | 'louisiana', changeHash: string): Bill {
  const sponsors = bill.sponsors
    ? Array.isArray(bill.sponsors)
      ? bill.sponsors.map((s: any) => (typeof s === 'string' ? s : s.name || s.fullname || '').trim()).filter((s: string) => s)
      : []
    : [];

  const subjects = bill.subjects
    ? Array.isArray(bill.subjects)
      ? bill.subjects.map((s: any) => (typeof s === 'string' ? s : s.subject_name || '').trim()).filter((s: string) => s)
      : []
    : [];

  const statusCode = bill.status ? parseInt(bill.status, 10) : 1;
  const statusText = parseStatusCode(statusCode);

  return {
    id: `${state}-${bill.bill_number}`,
    source: state,
    title: bill.title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || '',
    status: statusText,
    statusCode,
    introducedDate: bill.introduced_date,
    lastActionDate: bill.last_action_date,
    subjects,
    sponsors,
    billUrl: bill.url || '',
    changeHash,
    billNumber: bill.bill_number,
    category: detectCategory(bill)
  };
}

/**
 * Main sync function: use getMasterList to find changes, then getBill for details
 */
async function syncBillsForState(state: 'federal' | 'louisiana'): Promise<Bill[]> {
  const stateCode = state === 'federal' ? FEDERAL_STATE : LOUISIANA_STATE;
  const masterList = await fetchMasterList(stateCode);

  if (masterList.length === 0) {
    console.warn(`No bills in master list for ${stateCode}`);
    return [];
  }

  const updatedBills: Bill[] = [];
  let skipped = 0;

  for (const masterEntry of masterList) {
    const billId = masterEntry.bill_id || masterEntry.id;
    const changeHash = masterEntry.change_hash;

    // Skip if we already have this version
    if (billChangeHashCache[billId] === changeHash) {
      skipped++;
      continue;
    }

    // Fetch full details
    const billDetail = await fetchBillDetail(billId);
    if (!billDetail) continue;

    // Check if veteran-related
    if (!isVeteranRelated(billDetail)) continue;

    // Normalize and store
    const normalized = normalizeBill(billDetail, state, changeHash);
    updatedBills.push(normalized);

    // Update cache
    billChangeHashCache[billId] = changeHash;

    // Rate limiting: small delay between getBill calls (LegiScan recommends throttling)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`${state}: fetched ${updatedBills.length} updated bills, skipped ${skipped} unchanged`);
  return updatedBills;
}

export async function fetchFederalBills(): Promise<FetchResult> {
  const bills = await syncBillsForState('federal');
  return {
    bills,
    totalFetched: bills.length,
    totalUpdated: bills.length
  };
}

export async function fetchLouisianaBills(): Promise<FetchResult> {
  const bills = await syncBillsForState('louisiana');
  return {
    bills,
    totalFetched: bills.length,
    totalUpdated: bills.length
  };
}
