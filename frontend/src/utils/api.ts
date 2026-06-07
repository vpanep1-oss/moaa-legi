// API configuration - uses VITE_API_URL environment variable (set by GitHub Actions)
// Temporary: hardcoded to HTTP for development until proper HTTPS certificate is set up
const API_URL = import.meta.env.VITE_API_URL || 'http://167.172.158.216';

export function getFederalBillsUrl() {
  return `${API_URL}/api/federal`;
}

export function getLouisianaBillsUrl() {
  return `${API_URL}/api/louisiana`;
}

export function getBillUrl(id: string) {
  return `${API_URL}/api/bills/${id}`;
}
