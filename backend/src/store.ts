import type { Bill } from './models/bill.ts';

export const federalBillStore: Bill[] = [];
export const louisianaBillStore: Bill[] = [];

export function updateFederalBills(bills: Bill[]) {
  federalBillStore.length = 0;
  federalBillStore.push(...bills);
}

export function updateLouisianaBills(bills: Bill[]) {
  louisianaBillStore.length = 0;
  louisianaBillStore.push(...bills);
}

export function findBillById(id: string) {
  return federalBillStore.find((bill) => bill.id === id) ?? louisianaBillStore.find((bill) => bill.id === id) ?? null;
}
