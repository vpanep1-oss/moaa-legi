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

  // Primary mechanism-based categorization (what government function does it change?)
  // Check most specific patterns FIRST before general ones

  // Veterans Benefits — direct VA/state benefit programs: disability, compensation, pension, health, grants
  // Check FIRST - catches bills about improving/expanding benefits, VA health, claims, etc.
  // Exclude political/social issues like abortion
  if (!/abortion/i.test(text) && /title\s*38|disabilit|combat.*related|va benefit|veteran benefit|health record|suicide prevention|grant fund|va care|va health|va medical|claim|benefit|compensation|pension|expand.*benefit|improve.*benefit|improve.*care|presumption|service.?connection|covid|vaccine|military sexual trauma|sexual trauma|reproductive.*assist/i.test(text)) {
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

  // Tax & Property — tax exemptions, deductions, property transfers, homestead (NOT general "home" references)
  if (/\b(tax|exemption|deduction|credit|homestead|property transfer|mortgage)\b/.test(text) && !/va\s|veteran.*benefit/.test(text)) {
    return 'Tax & Property';
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

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Check for topic-based matches (e.g., title 38, military sexual trauma)
  const hasTitle38Both = /title\s*38|38\s*u\.?s\.?c/.test(s1) && /title\s*38|38\s*u\.?s\.?c/.test(s2);
  const hasMSTBoth = /military sexual trauma|sexual trauma/.test(s1) && /military sexual trauma|sexual trauma/.test(s2);
  const hasVeteransBenefitsBoth = /veteran.*benefit|benefit.*veteran|va.*benefit|disability.*compensation/.test(s1) &&
                                   /veteran.*benefit|benefit.*veteran|va.*benefit|disability.*compensation/.test(s2);
  const hasMilitaryPropertyBoth = /(military base|military installation)/.test(s1) && /(military base|military installation)/.test(s2) &&
                                   /(property|expropriate|expropriation)/.test(s1) && /(property|expropriate|expropriation)/.test(s2);
  const hasVACareImprovementBoth = /(improve.*care|availability.*care)/.test(s1) && /(improve.*care|availability.*care)/.test(s2) &&
                                    /(veteran|defense|va)/.test(s1) && /(veteran|defense|va)/.test(s2);

  if ((hasTitle38Both && hasMSTBoth) || (hasTitle38Both && hasVeteransBenefitsBoth) || hasMilitaryPropertyBoth || hasVACareImprovementBoth) {
    return 0.75;
  }

  // Simple similarity: common words / total words
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));

  const common = [...words1].filter(w => words2.has(w)).length;
  const total = Math.max(words1.size, words2.size);

  return total > 0 ? common / total : 0;
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

function groupSimilarBills(bills: Bill[], threshold: number = 0.7): Array<Bill[]> {
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
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const bill of sortedBills) {
    if (used.has(bill.id)) continue;

    const group = [bill];
    used.add(bill.id);
    const billNum = extractBillNumber(bill.billNumber || '');

    for (const other of sortedBills) {
      if (used.has(other.id)) continue;
      const otherNum = extractBillNumber(other.billNumber || '');

      // Match 1: Same bill number (HB123 and SB123 are companions)
      if (billNum && billNum === otherNum && billNum.length > 0) {
        group.push(other);
        used.add(other.id);
        continue;
      }

      // Match 2: High summary similarity
      const similarity = calculateSimilarity(bill.summary, other.summary);
      if (similarity >= threshold) {
        // Filter stale: if other bill is >6 months older and primary is newer, skip it
        const otherDate = new Date(other.lastActionDate || 0);
        if (otherDate < sixMonthsAgo && group[0].lastActionDate) {
          const primaryDate = new Date(group[0].lastActionDate);
          if (primaryDate > sixMonthsAgo) {
            // Skip stale bill when we have a newer one
            continue;
          }
        }

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

  const billGroups = groupSimilarBills(bills, 0.6);

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
