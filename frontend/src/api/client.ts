const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchFederalBills() {
  const response = await fetch(BASE_URL + '/api/federal');
  return response.json();
}

export async function fetchLouisianaBills() {
  const response = await fetch(BASE_URL + '/api/louisiana');
  return response.json();
}

export async function fetchBillDetail(id: string) {
  const response = await fetch(BASE_URL + `/api/bills/${id}`);
  return response.json();
}
