// API configuration - hardcoded to ngrok HTTPS tunnel
// This bypasses the GitHub Actions BACKEND_URL variable
const API_URL = 'https://garland-quake-chill.ngrok-free.dev';

export function getFederalBillsUrl() {
  return `${API_URL}/api/federal`;
}

export function getLouisianaBillsUrl() {
  return `${API_URL}/api/louisiana`;
}

export function getBillUrl(id: string) {
  return `${API_URL}/api/bills/${id}`;
}
