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

function normalizeFederalBill(bill: any) {
  const lastAction = bill.history?.[bill.history.length - 1]?.action || bill.last_action || 'Introduced';
  return {
    id: `federal-${bill.bill_id || bill.id}`,
    source: 'federal' as const,
    title: bill.title || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: lastAction,
    introducedDate: bill.introduced_date || bill.date || bill.session_year || undefined,
    lastActionDate: bill.last_action_date || bill.date || undefined,
    subjects: bill.subjects || bill.title?.split(' ') || [],
    sponsors: bill.sponsor_name ? [bill.sponsor_name] : bill.sponsors || [],
    billUrl: bill.url || bill.document_url || ''
  };
}

function normalizeLouisianaBill(bill: any) {
  const lastAction = bill.history?.[bill.history.length - 1]?.action || bill.last_action || 'Introduced';
  return {
    id: `louisiana-${bill.bill_id || bill.id}`,
    source: 'louisiana' as const,
    title: bill.title || bill.bill_number || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: lastAction,
    introducedDate: bill.introduced_date || bill.date || bill.session_year || undefined,
    lastActionDate: bill.last_action_date || bill.date || undefined,
    subjects: bill.subjects || bill.title?.split(' ') || [],
    sponsors: bill.sponsor_name ? [bill.sponsor_name] : bill.sponsors || [],
    billUrl: bill.url || bill.document_url || ''
  };
}

function containsKeywords(text: string) {
  const lower = text.toLowerCase();
  return legislationKeywords.some((keyword: string) => lower.includes(keyword));
}

function extractBillEntries(masterListResponse: any) {
  const masterList = masterListResponse.masterList ?? masterListResponse.masterlist ?? masterListResponse;
  if (!masterList) {
    return [];
  }

  if (Array.isArray(masterList)) {
    return masterList;
  }

  return Object.values(masterList).flatMap((item) => {
    if (Array.isArray(item)) {
      return item;
    }
    if (typeof item === 'object' && item !== null) {
      return Object.values(item);
    }
    return [];
  });
}

let loggedFederal = false;
let loggedLouisiana = false;

async function fetchBillDetail(billId: number) {
  try {
    const response = await axios.get(`${API_BASE}?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`);
    const bill = response.data.bill ?? null;

    if (bill && !loggedFederal && bill.state_id === 2) {
      console.log(`Federal bill ${billId} last action:`, bill.history?.[bill.history.length - 1]?.action);
      loggedFederal = true;
    }
    if (bill && !loggedLouisiana && bill.state_id === 18) {
      console.log(`Louisiana bill ${billId} status info:`, {
        status: bill.status,
        status_date: bill.status_date,
        progress: bill.progress,
        completed: bill.completed,
        last_history_action: bill.history?.[bill.history?.length - 1]?.action
      });
      loggedLouisiana = true;
    }
    return bill;
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
    searchResults.bills.slice(0, 50).map((entry) => {
      const billId = Number(entry.bill_id || entry.id || entry.bill_id);
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
    matchedEntries: searchResults.matchedEntries
  };
}

export async function fetchFederalBills() {
  return buildBillList(FEDERAL_STATE, normalizeFederalBill);
}

export async function fetchLouisianaBills() {
  return buildBillList(LOUISIANA_STATE, normalizeLouisianaBill);
}
