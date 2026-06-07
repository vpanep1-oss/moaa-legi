const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getFederalBillsUrl() {
  return `${API_URL}/api/federal`;
}

export function getLouisianaBillsUrl() {
  return `${API_URL}/api/louisiana`;
}

export function getBillUrl(id: string) {
  return `${API_URL}/api/bills/${id}`;
}
