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

  if (text.match(/education|gi bill|tuition|school|training|apprentice/i)) return 'Education';
  if (text.match(/housing|home|mortgage|rent|homeless/i)) return 'Housing';
  if (text.match(/job|employment|hire|civil service|veteran preference/i)) return 'Employment';
  if (text.match(/surviving spouse|widow|dependent|family|child benefit/i)) return 'Surviving Spouse/Dependents';
  if (text.match(/caregiver|care provider|respite/i)) return 'Caregivers';
  if (text.match(/mental health|ptsd|suicide|counseling|wellness/i)) return 'Mental Health & Wellness';
  if (text.match(/tax|deduction|credit|financial/i)) return 'Tax & Financial';
  if (text.match(/memorial|recognition|honor|naming|tribute/i)) return 'Memorials & Recognition';
  if (text.match(/health|medical|disability|va|clinic|hospital|healthcare/i)) return 'Benefits & Compensation';
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
  const response = await axios.get(queryUrl);

  if (response.data.alert) {
    console.error(`LegiScan API error for state ${state}:`, response.data.alert);
    return { bills: [], queryUrl, totalEntries: 0, matchedEntries: 0 };
  }

  const billEntries = extractBillEntries(response.data);

  console.log(`LegiScan search for state ${state}: found ${billEntries.length} bills`);

  return {
    bills: billEntries,
    rawResponse: response.data,
    queryUrl,
    totalEntries: billEntries.length,
    matchedEntries: billEntries.length
  };
}

async function buildBillList(state: string, normalize: (bill: any) => any): Promise<FetchResult> {
  const searchResults = await fetchMasterList(state);
  if (!searchResults.queryUrl) {
    return searchResults;
  }

  const detailedBills = await Promise.allSettled(
    searchResults.bills.slice(0, 200).map((entry) => {
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
