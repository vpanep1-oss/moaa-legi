import axios from 'axios';
import { legislationKeywords } from '../keywords.js';

const LEGISCAN_API_KEY = process.env.LEGISCAN_API_KEY ?? '';
const STATE_ID = 41; // Louisiana
const API_BASE = 'https://api.legiscan.com/';

function normalizeBill(bill: any) {
  return {
    id: `louisiana-${bill.bill_id || bill.id}`,
    source: 'louisiana',
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

export async function fetchLouisianaBills() {
  if (!LEGISCAN_API_KEY) {
    console.warn('LEGISCAN_API_KEY is not configured');
    return [];
  }

  const response = await axios.get(`${API_BASE}?key=${LEGISCAN_API_KEY}&op=getMasterList&state=${STATE_ID}`);
  const billEntries = extractBillEntries(response.data);
  if (!billEntries.length) {
    console.warn('No Louisiana master list bills found');
    return [];
  }

  const matchingEntries = billEntries.filter((entry) => {
    const title = entry.title || entry.bill_number || entry.short_title || entry.description || '';
    const summary = entry.summary || entry.description || '';
    return containsKeywords(`${title} ${summary}`);
  });

  if (!matchingEntries.length) {
    return [];
  }

  const details = await Promise.allSettled(
    matchingEntries.slice(0, 50).map((entry) => {
      const billId = Number(entry.bill_id || entry.id || entry.bill_id);
      return billId ? fetchBillDetail(billId) : Promise.resolve(null);
    })
  );

  return details
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => normalizeBill((result as PromiseFulfilledResult<any>).value));
}
