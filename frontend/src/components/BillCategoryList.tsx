import { Link } from 'react-router-dom';
import type { Bill } from '../types';

interface BillCategoryListProps {
  bills: Bill[];
}

function categorizeStatus(status: string) {
  const normalized = status?.toLowerCase() ?? '';
  // Check failed FIRST to catch "rejected by a vote of X yeas and Y nays" before "yeas" matches passed
  if (/rejected|failed|vetoed|dismissed|withdrawn|died/.test(normalized)) {
    return 'failed';
  }
  if (/passed|enacted|approved|agreed|engrossed|effective|signed|became law/.test(normalized)) {
    return 'passed';
  }
  return 'pending';
}

function getMOAATagCategory(title: string, summary: string, subjects?: string[]): string {
  const text = `${title} ${summary} ${subjects?.join(' ') || ''}`.toLowerCase();

  // Exclude controversial/political issues entirely
  if (/abortion/i.test(text)) {
    return 'Other';
  }

  // Primary mechanism-based categorization (what government function does it change?)
  // Check most specific patterns FIRST before general ones

  // Tax & Property — MUST check before Veterans Benefits because "benefit" matches both
  // tax exemptions, deductions, property transfers, homestead (NOT academic credit or general "home" references)
  if (/\b(tax|exemption|deduction|homestead|property transfer|mortgage)\b/i.test(text) && !/va\s|veteran.*benefit|credit.*toward|academic/i.test(text)) {
    return 'Tax & Property';
  }

  // Veterans Benefits — direct VA/state benefit programs: disability, compensation, pension, health, grants
  // Check before Armed Forces to catch VA-specific benefits
  if (/title\s*38|disabilit|combat.*related|va benefit|veteran benefit|health record|mental health|suicide prevention|grant fund|va care|va health|va medical|claim|compensation|pension|expand.*benefit|improve.*benefit|improve.*care|presumption|service.?connection|covid|vaccine|military sexual trauma|sexual trauma|reproductive|doula/i.test(text)) {
    return 'Veterans Benefits';
  }

  // Legal & Justice — courts, guardianship, criminal justice, mentor programs, stolen valor (check before Armed Forces to catch crime bills)
  if (/(court|guardianship|crime|justice|mentor|stolen valor|legal|probate)/i.test(text)) {
    return 'Legal & Justice';
  }

  // Employment — hiring, civil service preference, job categories, work positions (check before Education to catch school guardian jobs)
  if (/(employment|hire|hiring|civil service|preference point|job|career|position|warden|guardian|school)/i.test(text) && /(employment|hire|hiring|job|career|position|work|guardian)/.test(text)) {
    return 'Employment';
  }

  // Education — schools, staffing, education benefits (NOT VA training programs)
  if (/\b(school|tuition|gi bill|apprentice|educator|teacher|instructor|student loan|education benefit)\b/.test(text) && !/va\s|veteran.*health/.test(text)) {
    return 'Education';
  }

  // Armed Forces & Security — active duty, National Guard, installations, national security, military recognitions, memorials
  if (/(active duty|national guard|installation|national security|commendation|decoration|medal|honor|recogni|memorial|military service|military base|foreign adversaries)/i.test(text)) {
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

function stripParentheses(text: string): string {
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanStatus(status: string): string {
  return status
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 120) + (status.length > 120 ? '...' : '');
}

function isCommemorativeResolution(bill: Bill): boolean {
  const billNum = bill.billNumber?.toUpperCase() || '';
  const text = `${bill.title} ${bill.summary}`.toLowerCase();

  // Exclude resolutions (HR/SR/HCR/SCR) that are ceremonial/commemorative
  if (/(HR|SR|HCR|SCR)\d+/.test(billNum)) {
    if (text.match(/(designat|honor|commend|recogn|memorial|tribute|apprec|day|week|congratulat|expressing|resolving|concurrent resolution|house resolution|senate resolution|condolen)/i)) {
      return true;
    }
  }

  return false;
}

function extractBillNumber(billNumber: string): string {
  // Extract just the number (e.g., "123" from "HB123" or "SB123")
  const match = billNumber?.match(/\d+/);
  return match ? match[0] : '';
}

function groupSimilarBills(bills: Bill[]): Array<Bill[]> {
  // Filter out commemorative resolutions first
  const substantiveBills = bills.filter(bill => !isCommemorativeResolution(bill));

  // Sort by last_action_date (newest first) to prioritize recent bills
  const sortedBills = [...substantiveBills].sort((a, b) => {
    const dateA = new Date(a.lastActionDate || 0).getTime();
    const dateB = new Date(b.lastActionDate || 0).getTime();
    return dateB - dateA;
  });

  const groups: Array<Bill[]> = [];
  const used = new Set<string>();

  for (const bill of sortedBills) {
    if (used.has(bill.id)) continue;

    const group = [bill];
    used.add(bill.id);
    const billNum = extractBillNumber(bill.billNumber || '');

    // Only group bills with the same bill number (e.g., HB123 and SB123 are companions)
    if (billNum && billNum.length > 0) {
      for (const other of sortedBills) {
        if (used.has(other.id)) continue;
        const otherNum = extractBillNumber(other.billNumber || '');

        if (billNum === otherNum && billNum.length > 0) {
          group.push(other);
          used.add(other.id);
        }
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
          <Link to={`/bills/${primaryBill.id}`}>{stripParentheses(primaryBill.summary)}</Link>
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
      <p className="bill-official-title"><strong>{stripParentheses(primaryBill.title)}</strong></p>
      <p>
        <strong>Status:</strong> {cleanStatus(primaryBill.status)}
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

  const billGroups = groupSimilarBills(bills);

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
