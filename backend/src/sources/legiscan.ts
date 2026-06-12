import axios from 'axios';
import { legislationKeywords } from '../keywords.js';

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY ?? '';
const LOUISIANA_STATE = 'LA';
const FEDERAL_STATE = 'US';
const API_BASE = 'https://api.legiscan.com/';

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
    billUrl: bill.url || bill.document_url || ''
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
    billUrl: bill.url || bill.document_url || ''
  };
}

function containsKeywords(text: string) {
  const lower = text.toLowerCase();
  return legislationKeywords.some((keyword: string) => lower.includes(keyword));
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
    const response = await axios.get(`${API_BASE}?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`);
    return response.data.bill ?? null;
  } catch (error) {
    console.warn(`Failed to fetch LegiScan bill ${billId}`, error);
    return null;
  }
}

async function fetchMasterList(state: string): Promise<FetchResult> {
  if (!LEGISCAN_API_KEY) {
    console.warn('LEGISCAN_API_KEY is not configured');
    return { bills: [], queryUrl: '', totalEntries: 0, matchedEntries: 0 };
  }

  const query = legislationKeywords.slice(0, 5).join(' OR ');
  const queryUrl = `${API_BASE}?key=${LEGISCAN_API_KEY}&op=getSearch&state=${state}&query=${encodeURIComponent(query)}`;
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

  const details = await Promise.allSettled(
    searchResults.bills.slice(0, 20).map((entry) => {
      const billId = Number(entry.bill_id || entry.id);
      return billId ? fetchBillDetail(billId) : Promise.resolve(null);
    })
  );

  const bills = details
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => normalize((result as PromiseFulfilledResult<any>).value));

  return {
    bills,
    rawResponse: searchResults.rawResponse,
    queryUrl: searchResults.queryUrl,
    totalEntries: searchResults.totalEntries,
    matchedEntries: bills.length
  };
}

export async function fetchFederalBills() {
  return buildBillList(FEDERAL_STATE, normalizeFederalBill);
}

export async function fetchLouisianaBills() {
  return buildBillList(LOUISIANA_STATE, normalizeLouisianaBill);
}
