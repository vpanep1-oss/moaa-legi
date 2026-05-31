import dotenv from 'dotenv';
import { fetchFederalBills, fetchLouisianaBills } from './sources/legiscan.js';
import { updateFederalBills, updateLouisianaBills } from './store.js';
import { sampleFederalBills, sampleLouisianaBills } from './mockData.js';

dotenv.config();

type IngestResult = {
  count: number;
  usedFallback: boolean;
  queryUrl?: string;
  totalEntries?: number;
  matchedEntries?: number;
  rawResponse?: any;
};

type DailyIngestSummary = {
  federal: IngestResult;
  louisiana: IngestResult;
};

export async function runDailyIngest(): Promise<DailyIngestSummary> {
  console.log('Starting daily ingest for federal and Louisiana legislation');

  const federalData = await fetchFederalBills();
  const federalResult: IngestResult = {
    count: 0,
    usedFallback: false,
    queryUrl: federalData.queryUrl,
    totalEntries: federalData.totalEntries,
    matchedEntries: federalData.matchedEntries,
    rawResponse: federalData.rawResponse
  };

  if (!federalData.bills.length) {
    console.warn('No federal bills fetched; using sample federal data fallback.');
    updateFederalBills(sampleFederalBills);
    federalResult.count = sampleFederalBills.length;
    federalResult.usedFallback = true;
    federalResult.rawResponse = null;
  } else {
    console.log(`Fetched ${federalData.bills.length} federal candidate bills`);
    updateFederalBills(federalData.bills);
    federalResult.count = federalData.bills.length;
  }

  const louisianaData = await fetchLouisianaBills();
  const louisianaResult: IngestResult = {
    count: 0,
    usedFallback: false,
    queryUrl: louisianaData.queryUrl,
    totalEntries: louisianaData.totalEntries,
    matchedEntries: louisianaData.matchedEntries,
    rawResponse: louisianaData.rawResponse
  };

  if (!louisianaData.bills.length) {
    console.warn('No Louisiana bills fetched; using sample Louisiana data fallback.');
    updateLouisianaBills(sampleLouisianaBills);
    louisianaResult.count = sampleLouisianaBills.length;
    louisianaResult.usedFallback = true;
    louisianaResult.rawResponse = null;
  } else {
    console.log(`Fetched ${louisianaData.bills.length} Louisiana candidate bills`);
    updateLouisianaBills(louisianaData.bills);
    louisianaResult.count = louisianaData.bills.length;
  }

  console.log('Ingest completed');

  return {
    federal: federalResult,
    louisiana: louisianaResult
  };
}
