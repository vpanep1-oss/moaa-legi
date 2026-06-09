const API_URL = 'https://moaa-legi.com';

export function getFederalBillsUrl() {
  return `${API_URL}/api/federal`;
}

export function getLouisianaBillsUrl() {
  return `${API_URL}/api/louisiana`;
}

export function getBillUrl(id: string) {
  return `${API_URL}/api/bills/${id}`;
}
