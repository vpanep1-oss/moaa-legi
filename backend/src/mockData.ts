import type { Bill } from './models/bill.ts';

export const sampleFederalBills: Bill[] = [
  {
    id: 'federal-HR1234',
    source: 'federal',
    title: 'Veterans Education Benefits Improvement Act',
    summary: 'Improves education benefits for veterans and their families by expanding eligibility and simplifying claims.',
    status: 'Introduced in House',
    introducedDate: '2025-03-12',
    lastActionDate: '2025-04-01',
    subjects: ['veterans', 'education', 'benefits'],
    sponsors: ['Rep. Smith'],
    billUrl: 'https://www.congress.gov/bill/118th-congress/house-bill/1234'
  },
  {
    id: 'federal-SB5678',
    source: 'federal',
    title: 'Military Surviving Spouse Support Act',
    summary: 'Provides additional housing and housing assistance for military surviving spouses following service member death.',
    status: 'Passed House',
    introducedDate: '2025-02-10',
    lastActionDate: '2025-05-05',
    subjects: ['military', 'surviving spouse', 'housing'],
    sponsors: ['Sen. Jones'],
    billUrl: 'https://www.congress.gov/bill/118th-congress/senate-bill/5678'
  },
  {
    id: 'federal-HR9101',
    source: 'federal',
    title: 'National Guard Readiness and Family Support Act',
    summary: 'Strengthens National Guard readiness through improved family support and healthcare access.',
    status: 'Failed in Committee',
    introducedDate: '2025-01-20',
    lastActionDate: '2025-03-30',
    subjects: ['national guard', 'family support', 'healthcare'],
    sponsors: ['Rep. Lee'],
    billUrl: 'https://www.congress.gov/bill/118th-congress/house-bill/9101'
  }
];

export const sampleLouisianaBills: Bill[] = [
  {
    id: 'louisiana-101',
    source: 'louisiana',
    title: 'Louisiana Veterans Care Access Act',
    summary: 'Improves access to VA services for Louisiana veterans and veteran dependents statewide.',
    status: 'Pending in Senate',
    introducedDate: '2025-02-15',
    lastActionDate: '2025-04-02',
    subjects: ['veterans affairs', 'dependents', 'healthcare'],
    sponsors: ['Sen. Martin'],
    billUrl: 'https://legiscan.com/LA/bill/SB101/2025'
  },
  {
    id: 'louisiana-202',
    source: 'louisiana',
    title: 'Guard Family Support Program',
    summary: 'Creates a State Guard family support program for military spouses and dependents during deployment.',
    status: 'Passed Legislature',
    introducedDate: '2025-03-01',
    lastActionDate: '2025-05-10',
    subjects: ['national guard', 'military dependents', 'family support'],
    sponsors: ['Rep. Carter'],
    billUrl: 'https://legiscan.com/LA/bill/HB202/2025'
  },
  {
    id: 'louisiana-303',
    source: 'louisiana',
    title: 'Retired Military Tax Relief',
    summary: 'Provides additional tax relief to retired military personnel residing in Louisiana.',
    status: 'Failed Committee',
    introducedDate: '2025-01-30',
    lastActionDate: '2025-03-18',
    subjects: ['retired military', 'tax relief'],
    sponsors: ['Sen. Dupre'],
    billUrl: 'https://legiscan.com/LA/bill/SB303/2025'
  }
];
