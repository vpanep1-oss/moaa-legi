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
    count: federalData.bills.length,
    usedFallback: false,
    totalEntries: federalData.totalFetched,
    matchedEntries: federalData.totalUpdated
  };

  if (!federalData.bills.length) {
    console.warn('No federal bills fetched; using sample federal data fallback.');
    updateFederalBills(sampleFederalBills);
    federalResult.count = sampleFederalBills.length;
    federalResult.usedFallback = true;
  } else {
    console.log(`Fetched ${federalData.bills.length} federal bills with updated details`);
    updateFederalBills(federalData.bills);
  }

  const louisianaData = await fetchLouisianaBills();
  const louisianaResult: IngestResult = {
    count: louisianaData.bills.length,
    usedFallback: false,
    totalEntries: louisianaData.totalFetched,
    matchedEntries: louisianaData.totalUpdated
  };

  if (!louisianaData.bills.length) {
    console.warn('No Louisiana bills fetched; using sample Louisiana data fallback.');
    updateLouisianaBills(sampleLouisianaBills);
    louisianaResult.count = sampleLouisianaBills.length;
    louisianaResult.usedFallback = true;
  } else {
    console.log(`Fetched ${louisianaData.bills.length} Louisiana bills with updated details`);
    updateLouisianaBills(louisianaData.bills);
  }

  console.log('Ingest completed');

  return {
    federal: federalResult,
    louisiana: louisianaResult
  };
}
