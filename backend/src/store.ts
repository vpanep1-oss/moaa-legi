import type { Bill } from './models/bill.ts';
import { loadFederalBills, loadLouisianaBills, saveFederalBills, saveLouisianaBills } from './fileStore.js';

export const federalBillStore: Bill[] = loadFederalBills();
export const louisianaBillStore: Bill[] = loadLouisianaBills();

export function updateFederalBills(bills: Bill[]) {
  federalBillStore.length = 0;
  federalBillStore.push(...bills);
  saveFederalBills(bills);
}

export function updateLouisianaBills(bills: Bill[]) {
  louisianaBillStore.length = 0;
  louisianaBillStore.push(...bills);
  saveLouisianaBills(bills);
}

export function findBillById(id: string) {
  return federalBillStore.find((bill) => bill.id === id) ?? louisianaBillStore.find((bill) => bill.id === id) ?? null;
}
