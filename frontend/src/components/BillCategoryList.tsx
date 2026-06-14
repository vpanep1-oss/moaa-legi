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

  // Education — schools, staffing, education benefits/eligibility
  if (/\b(school|education|tuition|gi bill|training|apprentice|educator|teacher|instructor)\b/.test(text)) {
    return 'Education';
  }

  // Employment — hiring, civil service preference, job categories
  if (/\b(employment|hire|hiring|civil service|preference point|job|career|position|warden|officer)\b/.test(text)) {
    return 'Employment';
  }

  // Tax & Property — tax exemptions, deductions, property transfers, homestead
  if (/\b(tax|exemption|deduction|credit|homestead|property transfer|mortgage|home)\b/.test(text)) {
    return 'Tax & Property';
  }

  // Veterans Benefits — direct VA/state benefit programs: disability, compensation, pension, health, grants
  if (/\b(disability compensation|pension|va benefit|veteran benefit|health record|suicide prevention|grant fund|disability|compensation|va care|medical|clinic|hospital)\b/.test(text)) {
    return 'Veterans Benefits';
  }

  // Legal & Justice — courts, guardianship, criminal justice, mentor programs, stolen valor
  if (/\b(court|guardianship|guardian|criminal|justice|mentor|stolen valor|legal|probate)\b/.test(text)) {
    return 'Legal & Justice';
  }

  // Armed Forces & Security — active duty, National Guard, installations, national security, military recognitions
  if (/\b(armed force|military|national guard|active duty|installation|national security|commendation|decoration|medal|honor)\b/.test(text)) {
    return 'Armed Forces & Security';
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

const TAG_COLORS: Record<string, string> = {
  'Education': '#8b5cf6',
  'Employment': '#06b6d4',
  'Tax & Property': '#f59e0b',
  'Veterans Benefits': '#10b981',
  'Legal & Justice': '#ec4899',
  'Armed Forces & Security': '#2563eb',
  'Other': '#6b7280',
};

function BillCard({ bill }: { bill: Bill }) {
  const statusCategory = categorizeStatus(bill.status);
  const source = bill.source?.toLowerCase() || 'federal';
  const moaaTag = getMOAATagCategory(bill.title, bill.summary, bill.subjects);
  const isPriority = isMOAAPriority(bill.title, bill.summary, bill.subjects);
  const tagColor = TAG_COLORS[moaaTag];

  return (
    <li key={bill.id} className="bill-item" data-source={source} style={{ borderLeftColor: tagColor }}>
      <div className="bill-item-header">
        <h3>
          <Link to={`/bills/${bill.id}`}>{bill.summary}</Link>
        </h3>
        <div className="bill-badges">
          <span className={`bill-badge bill-badge-${bill.source}`}>{bill.source}</span>
          <span className={`bill-badge bill-status-${statusCategory}`}>
            {statusCategory === 'passed' ? '✓ Passed' : statusCategory === 'failed' ? '✗ Failed' : '⧗ Pending'}
          </span>
          <span className="bill-badge bill-badge-moaa-tag" style={{ backgroundColor: `${TAG_COLORS[moaaTag]}20`, color: TAG_COLORS[moaaTag] }}>
            {toTitleCase(moaaTag)}
          </span>
        </div>
      </div>
      <p className="bill-official-title"><strong>{bill.title}</strong></p>
      <p>
        <strong>Status:</strong> {bill.status}
      </p>
      {bill.subjects && bill.subjects.length > 0 && (
        <p>
          <strong>Topics:</strong> {bill.subjects.map(s => toTitleCase(s)).join(', ')}
        </p>
      )}
      {bill.sponsors && bill.sponsors.length > 0 && (
        <p>
          <strong>Sponsors:</strong> {bill.sponsors.slice(0, 3).join(', ')}
        </p>
      )}
      <div className="bill-item-footer">
        {bill.billUrl ? (
          <a href={bill.billUrl} target="_blank" rel="noreferrer">
            External bill link
          </a>
        ) : null}
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

  return (
    <div className="bill-category-list">
      <div className="category-bills-grid">
        {bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>
    </div>
  );
}
