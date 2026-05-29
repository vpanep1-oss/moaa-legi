export interface Bill {
  id: string;
  source: 'federal' | 'louisiana';
  title: string;
  summary: string;
  status: string;
  introducedDate?: string;
  lastActionDate?: string;
  subjects: string[];
  sponsors: string[];
  billUrl?: string;
}
