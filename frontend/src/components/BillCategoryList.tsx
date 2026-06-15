import { Link } from 'react-router-dom';
import type { Bill } from '../types';

interface BillCategoryListProps {
  bills: Bill[];
}

function categorizeStatus(status: string) {
  const normalized = status?.toLowerCase() ?? '';
  if (/passed|enacted|approved|agreed|engrossed|effective|signed|yeas|became law/.test(normalized)) {
    return 'passed';
  }
  if (/rejected|failed|vetoed|dismissed|withdrawn|died|nays/.test(normalized)) {
    return 'failed';
  }
  return 'pending';
}

function getMOAATagCategory(title: string, summary: string, subjects?: string[]): string {
  const text = `${title} ${summary} ${subjects?.join(' ') || ''}`.toLowerCase();

  // Primary mechanism-based categorization (what government function does it change?)
  // Check most specific patterns FIRST before general ones

  // Veterans Benefits — direct VA/state benefit programs: disability, compensation, pension, health, grants
  // Check FIRST - catches bills about improving/expanding benefits, VA health, claims, etc.
  if (/\b(disability compensation|va benefit|veteran benefit|health record|suicide prevention|grant fund|va care|va health|va medical|claim|benefit|compensation|pension|disability benefit|expand.*benefit|improve.*benefit|presumption|service.?connection|covid|vaccine)\b/.test(text)) {
    return 'Veterans Benefits';
  }

  // Education — schools, staffing, education benefits (NOT VA training programs)
  if (/\b(school|tuition|gi bill|apprentice|educator|teacher|instructor|student loan|education benefit)\b/.test(text) && !/va\s|veteran.*health/.test(text)) {
    return 'Education';
  }

  // Employment — hiring, civil service preference, job categories
  if (/\b(employment|hire|hiring|civil service|preference point|job|career|position|warden)\b/.test(text)) {
    return 'Employment';
  }

  // Tax & Property — tax exemptions, deductions, property transfers, homestead (NOT general "home" references)
  if (/\b(tax|exemption|deduction|credit|homestead|property transfer|mortgage)\b/.test(text) && !/va\s|veteran.*benefit/.test(text)) {
    return 'Tax & Property';
  }

  // Legal & Justice — courts, guardianship, criminal justice, mentor programs, stolen valor
  if (/\b(court|guardianship|guardian|criminal|justice|mentor|stolen valor|legal|probate)\b/.test(text)) {
    return 'Legal & Justice';
  }

  // Armed Forces & Security — active duty, National Guard, installations, national security, military recognitions, memorials
  if (/\b(active duty|national guard|installation|national security|commendation|decoration|medal|honor|recogni|memorial|military service)\b/.test(text)) {
    return 'Armed Forces & Security';
  }

  // Default to Veterans Benefits for anything else veteran-related
  if (/\bveteran|va\b/.test(text)) {
    return 'Veterans Benefits';
  }

  // Other — commemorative, naming, etc.
  return 'Other';
}

function isMOAAPriority(title: string, summary: string, subjects?: string[]): boolean {
  const text = `${title} ${summary} ${subjects?.join(' ') || ''}`.toLowerCase();
  return /disability|compensation|pension|benefits|va benefits|health|medical/.test(text);
}

function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Simple similarity: common words / total words
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));

  const common = [...words1].filter(w => words2.has(w)).length;
  const total = Math.max(words1.size, words2.size);

  return total > 0 ? common / total : 0;
}

function groupSimilarBills(bills: Bill[], threshold: number = 0.7): Array<Bill[]> {
  const groups: Array<Bill[]> = [];
  const used = new Set<string>();

  for (const bill of bills) {
    if (used.has(bill.id)) continue;

    const group = [bill];
    used.add(bill.id);

    for (const other of bills) {
      if (used.has(other.id)) continue;

      const similarity = calculateSimilarity(bill.summary, other.summary);
      if (similarity >= threshold) {
        group.push(other);
        used.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

const TAG_COLORS: Record<string, string> = {
  'Education': '#8b5cf6',
  'Employment': '#06b6d4',
  'Tax & Property': '#f59e0b',
  'Veterans Benefits': '#10b981',
  'Legal & Justice': '#ec4899',
  'Armed Forces & Security': '#2563eb',
  'Other': '#6b7280',
};

function BillCard({ bills }: { bills: Bill[] }) {
  const primaryBill = bills[0];
  const statusCategory = categorizeStatus(primaryBill.status);
  const source = primaryBill.source?.toLowerCase() || 'federal';
  const moaaTag = getMOAATagCategory(primaryBill.title, primaryBill.summary, primaryBill.subjects);
  const isPriority = isMOAAPriority(primaryBill.title, primaryBill.summary, primaryBill.subjects);
  const tagColor = TAG_COLORS[moaaTag];

  return (
    <li key={primaryBill.id} className="bill-item" data-source={source} style={{ borderLeftColor: tagColor }}>
      <div className="bill-item-header">
        <h3>
          <Link to={`/bills/${primaryBill.id}`}>{primaryBill.summary}</Link>
        </h3>
        <div className="bill-badges">
          <span className={`bill-badge bill-badge-${primaryBill.source}`}>{primaryBill.source}</span>
          <span className={`bill-badge bill-status-${statusCategory}`}>
            {statusCategory === 'passed' ? '✓ Passed' : statusCategory === 'failed' ? '✗ Failed' : '⧗ Pending'}
          </span>
          <span className="bill-badge bill-badge-moaa-tag" style={{ backgroundColor: `${TAG_COLORS[moaaTag]}20`, color: TAG_COLORS[moaaTag] }}>
            {toTitleCase(moaaTag)}
          </span>
          {bills.length > 1 && (
            <span className="bill-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
              +{bills.length - 1} similar
            </span>
          )}
        </div>
      </div>
      <p className="bill-official-title"><strong>{primaryBill.title}</strong></p>
      <p>
        <strong>Status:</strong> {primaryBill.status}
      </p>
      {primaryBill.subjects && primaryBill.subjects.length > 0 && (
        <p>
          <strong>Topics:</strong> {primaryBill.subjects.map(s => toTitleCase(s)).join(', ')}
        </p>
      )}
      {primaryBill.sponsors && primaryBill.sponsors.length > 0 && (
        <p>
          <strong>Sponsors:</strong> {primaryBill.sponsors.slice(0, 3).join(', ')}
        </p>
      )}
      <div className="bill-item-footer">
        <div className="bill-links">
          {bills.map(bill => (
            <a key={bill.id} href={bill.billUrl} target="_blank" rel="noreferrer">
              {bill.billNumber || `${bill.source.toUpperCase()} Bill`}
            </a>
          ))}
        </div>
        {isPriority && (
          <span className="moaa-priority-badge">
            ★ MOAA PRIORITY
          </span>
        )}
      </div>
    </li>
  );
}

export default function BillCategoryList({ bills }: BillCategoryListProps) {
  if (!bills.length) {
    return <p>No bills found yet. Run the daily ingest or configure API keys.</p>;
  }

  const billGroups = groupSimilarBills(bills, 0.75);

  return (
    <div className="bill-category-list">
      <div className="category-bills-grid">
        {billGroups.map((group) => (
          <BillCard key={group[0].id} bills={group} />
        ))}
      </div>
    </div>
  );
}
