// API configuration - uses ngrok HTTPS tunnel for frontend access
const API_URL = import.meta.env.VITE_API_URL || 'https://garland-quake-chill.ngrok-free.dev';

export function getFederalBillsUrl() {
  return `${API_URL}/api/federal`;
}

export function getLouisianaBillsUrl() {
  return `${API_URL}/api/louisiana`;
}

export function getBillUrl(id: string) {
  return `${API_URL}/api/bills/${id}`;
}
