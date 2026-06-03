import axios from 'axios';
import { legislationKeywords } from '../keywords.js';

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY ?? '';
const LOUISIANA_STATE_ID = 41;
const FEDERAL_STATE_ID = 0;
const API_BASE = 'https://api.legiscan.com/';

type FetchResult = {
  bills: any[];
  rawResponse?: any;
  queryUrl: string;
  totalEntries: number;
  matchedEntries: number;
};

function normalizeFederalBill(bill: any) {
  return {
    id: `federal-${bill.bill_id || bill.id}`,
    source: 'federal' as const,
    title: bill.title || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: bill.status || bill.last_action || 'Unknown',
    introducedDate: bill.introduced_date || bill.date || bill.session_year || undefined,
    lastActionDate: bill.last_action_date || bill.date || undefined,
    subjects: bill.subjects || bill.title?.split(' ') || [],
    sponsors: bill.sponsor_name ? [bill.sponsor_name] : bill.sponsors || [],
    billUrl: bill.url || bill.document_url || ''
  };
}

function normalizeLouisianaBill(bill: any) {
  return {
    id: `louisiana-${bill.bill_id || bill.id}`,
    source: 'louisiana' as const,
    title: bill.title || bill.bill_number || bill.short_title || bill.description || 'Unknown bill',
    summary: bill.summary || bill.description || bill.action || '',
    status: bill.status || bill.last_action || 'Unknown',
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

async function fetchBillDetail(billId: number) {
  try {
    const response = await axios.get(`${API_BASE}?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`);
    return response.data.bill ?? null;
  } catch (error) {
    console.warn(`Failed to fetch LegiScan bill ${billId}`, error);
    return null;
  }
}

async function fetchMasterList(stateId: number): Promise<FetchResult> {
  if (!LEGISCAN_API_KEY) {
    console.warn('LEGISCAN_API_KEY is not configured');
    return { bills: [], queryUrl: '', totalEntries: 0, matchedEntries: 0 };
  }

  const queryUrl = `${API_BASE}?key=${LEGISCAN_API_KEY}&op=getMasterList&state=${stateId}`;
  const response = await axios.get(queryUrl);
  const billEntries = extractBillEntries(response.data);

  console.log(`LegiScan getMasterList for state ${stateId}:`, {
    url: queryUrl.replace(LEGISCAN_API_KEY, 'REDACTED'),
    entriesFound: billEntries.length,
    responseKeys: Object.keys(response.data)
  });

  return {
    bills: billEntries,
    rawResponse: response.data,
    queryUrl,
    totalEntries: billEntries.length,
    matchedEntries: 0
  };
}

async function buildBillList(stateId: number, normalize: (bill: any) => any): Promise<FetchResult> {
  const masterList = await fetchMasterList(stateId);
  if (!masterList.queryUrl) {
    return masterList;
  }

  const matchingEntries = masterList.bills.filter((entry) => {
    const title = entry.title || entry.bill_number || entry.short_title || entry.description || '';
    const summary = entry.summary || entry.description || '';
    return containsKeywords(`${title} ${summary}`);
  });

  const details = await Promise.allSettled(
    matchingEntries.slice(0, 50).map((entry) => {
      const billId = Number(entry.bill_id || entry.id || entry.bill_id);
      return billId ? fetchBillDetail(billId) : Promise.resolve(null);
    })
  );

  const bills = details
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => normalize((result as PromiseFulfilledResult<any>).value));

  return {
    bills,
    rawResponse: masterList.rawResponse,
    queryUrl: masterList.queryUrl,
    totalEntries: masterList.totalEntries,
    matchedEntries: matchingEntries.length
  };
}

export async function fetchFederalBills() {
  return buildBillList(FEDERAL_STATE_ID, normalizeFederalBill);
}

export async function fetchLouisianaBills() {
  return buildBillList(LOUISIANA_STATE_ID, normalizeLouisianaBill);
}
