import dotenv from 'dotenv';
import { fetchFederalBills } from './sources/propublica.js';
import { fetchLouisianaBills } from './sources/legiscan.js';
import { updateFederalBills, updateLouisianaBills } from './store.js';
import { sampleFederalBills, sampleLouisianaBills } from './mockData.js';

dotenv.config();

export async function runDailyIngest() {
  console.log('Starting daily ingest for federal and Louisiana legislation');

  const federal = await fetchFederalBills();
  if (!federal.length) {
    console.warn('No federal bills fetched; using sample federal data fallback.');
    updateFederalBills(sampleFederalBills);
  } else {
    console.log(`Fetched ${federal.length} federal candidate bills`);
    updateFederalBills(federal);
  }

  const louisiana = await fetchLouisianaBills();
  if (!louisiana.length) {
    console.warn('No Louisiana bills fetched; using sample Louisiana data fallback.');
    updateLouisianaBills(sampleLouisianaBills);
  } else {
    console.log(`Fetched ${louisiana.length} Louisiana candidate bills`);
    updateLouisianaBills(louisiana as any);
  }

  console.log('Ingest completed');
}
