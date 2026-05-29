import axios from 'axios';

const PROPUBLICA_API_KEY = process.env.PROPUBLICA_API_KEY ?? '';
const BASE_URL = 'https://api.propublica.org/congress/v1';
const CURRENT_CONGRESS = '118';

function normalizeBill(bill: any) {
  return {
    id: `federal-${bill.bill_id}`,
    source: 'federal',
    title: bill.title || bill.short_title || bill.bill_id,
    summary: bill.summary || bill.latest_major_action || bill.latest_major_action || bill.title || '',
    status: bill.latest_major_action || 'Unknown',
    introducedDate: bill.introduced_date,
    lastActionDate: bill.latest_major_action_date,
    subjects: bill.subjects || [],
    sponsors: [bill.sponsor_name || bill.sponsor_title || 'Unknown sponsor'],
    billUrl: bill.congressdotgov_url || bill.govtrack_url || ''
  };
}

async function fetchIntroducedBills(chamber: string) {
  const response = await axios.get(`${BASE_URL}/${CURRENT_CONGRESS}/${chamber}/bills/introduced.json`, {
    headers: { 'X-API-Key': PROPUBLICA_API_KEY }
  });

  return response.data.results?.[0]?.bills ?? [];
}

export async function fetchFederalBills() {
  if (!PROPUBLICA_API_KEY) {
    console.warn('PROPUBLICA_API_KEY is not configured');
    return [];
  }

  const chambers = ['house', 'senate'];
  const bills: any[] = [];

  for (const chamber of chambers) {
    try {
      const chamberBills = await fetchIntroducedBills(chamber);
      bills.push(...chamberBills.map(normalizeBill));
    } catch (error) {
      console.warn(`Failed to fetch ${chamber} bills`, error);
    }
  }

  return bills;
}
