export interface Bill {
  id: string;
  source: 'federal' | 'louisiana';
  title: string;
  summary: string;
  status: string;
  statusCode?: number; // LegiScan numeric status (1-6)
  introducedDate?: string;
  lastActionDate?: string;
  subjects: string[];
  sponsors: string[];
  billUrl?: string;
  changeHash?: string; // LegiScan change_hash for tracking updates
}
