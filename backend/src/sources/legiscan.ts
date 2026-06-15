import axios from 'axios';
import { legislationKeywords } from '../keywords.js';

const LOUISIANA_STATE = 'LA';
const FEDERAL_STATE = 'US';
const API_BASE = 'https://api.legiscan.com/';

function getApiKey() {
  return process.env.LEGISCAN_API_KEY ?? '';
}

type FetchResult = {
  bills: any[];
  rawResponse?: any;
  queryUrl: string;
  totalEntries: number;
  matchedEntries: number;
};

function findMeaningfulAction(history: any[], completed: number) {
  if (!history || history.length === 0) {
    return 'Introduced';
  }

  if (completed === 1) {
    for (let i = history.length - 1; i >= 0; i--) {
      const action = history[i].action || '';
      if (/effective|passed|signed|enacted/i.test(action)) {
        return action;
      }
    }
    return history[history.length - 1].action || 'Passed';
  }

  for (let i = history.length - 1; i >= 0; i--) {
    const action = history[i].action || '';
    if (/failed|rejected|vetoed|dismissed|withdrawn|died/i.test(action)) {
      return action;
    }
  }

  return history[history.length - 1].action || 'Introduced';
}

function normalizeFederalBill(bill: any) {
  const statusAction = findMeaningfulAction(bill.history, bill.completed);
  const subjects = bill.subjects
    ? Array.isArray(bill.subjects)
      ? bill.subjects.map((s: any) => (typeof s === 'string' ? s : s.subject_name || String(s)))
      : []
    : [];
  const sponsors = bill.sponsors
    ? Array.isArray(bill.sponsors)
      ? bill.sponsors.map((s: any) => (typeof s === 'string' ? s : s.name || String(s)))
      : bill.sponsor_name
      ? [bill.sponsor_name]
      : []
    : bill.sponsor_name
    ? [bill.sponsor_name]
    : [];

  return {
    id: `federal-${bill.bill_id || bill.id}`,
    source: 'federal' as const,
    title: bill.title || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: statusAction,
    introducedDate: bill.introduced_date || bill.date || bill.session_year || undefined,
    lastActionDate: bill.last_action_date || bill.date || undefined,
    subjects,
    sponsors,
    billUrl: bill.url || bill.document_url || '',
    category: detectCategory(bill),
    billNumber: bill.bill_number || ''
  };
}

function normalizeLouisianaBill(bill: any) {
  const statusAction = findMeaningfulAction(bill.history, bill.completed);
  const subjects = bill.subjects
    ? Array.isArray(bill.subjects)
      ? bill.subjects.map((s: any) => (typeof s === 'string' ? s : s.subject_name || String(s)))
      : []
    : [];
  const sponsors = bill.sponsors
    ? Array.isArray(bill.sponsors)
      ? bill.sponsors.map((s: any) => (typeof s === 'string' ? s : s.name || String(s)))
      : bill.sponsor_name
      ? [bill.sponsor_name]
      : []
    : bill.sponsor_name
    ? [bill.sponsor_name]
    : [];

  return {
    id: `louisiana-${bill.bill_id || bill.id}`,
    source: 'louisiana' as const,
    title: bill.title || bill.bill_number || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: statusAction,
    introducedDate: bill.introduced_date || bill.date || bill.session_year || undefined,
    lastActionDate: bill.last_action_date || bill.date || undefined,
    subjects,
    sponsors,
    billUrl: bill.url || bill.document_url || '',
    category: detectCategory(bill),
    billNumber: bill.bill_number || ''
  };
}

function isWithinOneYear(dateStr: string | undefined): boolean {
  if (!dateStr) return true;
  const billDate = new Date(dateStr);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff < 365;
}

function detectCategory(bill: any): string {
  const title = (bill.title || '').toLowerCase();
  const summary = (bill.summary || '').toLowerCase();
  const subjects = (bill.subjects || []).join(' ').toLowerCase();
  const text = `${title} ${summary} ${subjects}`;

  // Primary mechanism-based categorization (not just "who it affects")
  // Check most specific patterns FIRST before general ones

  // Veterans Benefits — direct VA/state benefit programs: disability, compensation, pension, health, grants
  // Check FIRST - catches bills about improving/expanding benefits, VA health, claims, etc.
  if (text.match(/\b(disability compensation|va benefit|veteran benefit|health record|suicide prevention|grant fund|va care|va health|va medical|claim|benefit|compensation|pension|disability benefit|expand.*benefit|improve.*benefit|presumption|service.?connection|covid|vaccine)\b/i)) {
    return 'Veterans Benefits';
  }

  // Education — schools, staffing, education benefits (NOT VA training programs)
  if (text.match(/\b(school|tuition|gi bill|apprentice|educator|teacher|instructor|student loan|education benefit)\b/i) && !text.match(/va\s|veteran.*health/i)) {
    return 'Education';
  }

  // Employment — hiring, civil service preference, job categories
  if (text.match(/\b(employment|hire|hiring|civil service|preference point|job|career|position|warden)\b/i)) {
    return 'Employment';
  }

  // Tax & Property — tax exemptions, deductions, property transfers, homestead (NOT general "home" references)
  if (text.match(/\b(tax|exemption|deduction|credit|homestead|property transfer|mortgage)\b/i) && !text.match(/va\s|veteran.*benefit/i)) {
    return 'Tax & Property';
  }

  // Legal & Justice — courts, guardianship, criminal justice, mentor programs, stolen valor
  if (text.match(/\b(court|guardianship|guardian|criminal|justice|mentor|stolen valor|legal|probate)\b/i)) {
    return 'Legal & Justice';
  }

  // Armed Forces & Security — active duty, National Guard, installations, national security, military recognitions, memorials
  if (text.match(/\b(active duty|national guard|installation|national security|commendation|decoration|medal|honor|recogni|memorial|military service)\b/i)) {
    return 'Armed Forces & Security';
  }

  // Default to Veterans Benefits for anything else veteran-related
  if (text.match(/\bveteran|va\b/i)) {
    return 'Veterans Benefits';
  }

  // Other — commemorative, naming, etc.
  return 'Other';
}

function isVeteranRelated(bill: any) {
  const title = (bill.title || '').toLowerCase();
  const summary = (bill.summary || '').toLowerCase();
  const textToSearch = `${title} ${summary}`;

  const excludeKeywords = ['appropriation', 'capital outlay', 'elections', 'consumer', 'surveillance', 'commission'];
  const isExcluded = excludeKeywords.some(keyword => textToSearch.includes(keyword));
  if (isExcluded) return false;

  if (!isWithinOneYear(bill.last_action_date)) return false;

  const hasVeteranKeyword = legislationKeywords.some((keyword: string) => textToSearch.includes(keyword));
  const titleHasKeyword = legislationKeywords.some((keyword: string) => title.includes(keyword));

  return hasVeteranKeyword && (titleHasKeyword || textToSearch.match(/veteran|military|service member|national guard/i));
}

function extractBillEntries(response: any) {
  const searchResult = response.searchresult || response.masterList || response.masterlist || response;
  if (!searchResult) {
    return [];
  }

  if (Array.isArray(searchResult)) {
    return searchResult;
  }

  return Object.values(searchResult)
    .filter((item) => item && typeof item === 'object' && 'bill_id' in item)
    .flatMap((item: any) => {
      if (Array.isArray(item)) {
        return item;
      }
      return item;
    });
}

async function fetchBillDetail(billId: number) {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(`${API_BASE}?key=${apiKey}&op=getBill&id=${billId}`);
    return response.data.bill ?? null;
  } catch (error) {
    console.warn(`Failed to fetch LegiScan bill ${billId}`, error);
    return null;
  }
}

async function fetchMasterList(state: string): Promise<FetchResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('LEGISCAN_API_KEY is not configured');
    return { bills: [], queryUrl: '', totalEntries: 0, matchedEntries: 0 };
  }

  const query = legislationKeywords.slice(0, 5).join(' OR ');
  const queryUrl = `${API_BASE}?key=${apiKey}&op=getSearch&state=${state}&query=${encodeURIComponent(query)}`;

  let allBills: any[] = [];
  let rawResponse: any = null;

  for (let page = 1; page <= 4; page++) {
    const pageUrl = `${queryUrl}&page=${page}`;
    try {
      const response = await axios.get(pageUrl);

      if (response.data.alert) {
        console.warn(`LegiScan API alert for state ${state} page ${page}:`, response.data.alert);
        break;
      }

      const billEntries = extractBillEntries(response.data);
      if (billEntries.length === 0) break;

      allBills = allBills.concat(billEntries);
      if (!rawResponse) rawResponse = response.data;

      console.log(`LegiScan page ${page} for state ${state}: found ${billEntries.length} bills`);
    } catch (error) {
      console.warn(`Error fetching page ${page} for state ${state}:`, error);
      break;
    }
  }

  return {
    bills: allBills,
    rawResponse,
    queryUrl,
    totalEntries: allBills.length,
    matchedEntries: allBills.length
  };
}

async function buildBillList(state: string, normalize: (bill: any) => any): Promise<FetchResult> {
  const searchResults = await fetchMasterList(state);
  if (!searchResults.queryUrl) {
    return searchResults;
  }

  const detailedBills = await Promise.allSettled(
    searchResults.bills.map((entry) => {
      const billId = Number(entry.bill_id || entry.id);
      return billId ? fetchBillDetail(billId) : Promise.resolve(null);
    })
  );

  const fulfilledBills = detailedBills
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => (result as PromiseFulfilledResult<any>).value);

  const veteranRelatedBills = fulfilledBills.filter(isVeteranRelated);

  const seenBillIds = new Set<string>();
  const dedupedBills = veteranRelatedBills.filter((bill) => {
    const billId = bill.bill_id || bill.id;
    if (seenBillIds.has(billId)) return false;
    seenBillIds.add(billId);
    return true;
  });

  const sortedBills = dedupedBills.sort((a, b) => {
    const dateA = new Date(a.last_action_date || 0).getTime();
    const dateB = new Date(b.last_action_date || 0).getTime();
    return dateB - dateA;
  });

  const bills = sortedBills.slice(0, 40).map(normalize);

  return {
    bills,
    rawResponse: searchResults.rawResponse,
    queryUrl: searchResults.queryUrl,
    totalEntries: searchResults.totalEntries,
    matchedEntries: dedupedBills.length
  };
}

export async function fetchFederalBills() {
  return buildBillList(FEDERAL_STATE, normalizeFederalBill);
}

export async function fetchLouisianaBills() {
  return buildBillList(LOUISIANA_STATE, normalizeLouisianaBill);
}
