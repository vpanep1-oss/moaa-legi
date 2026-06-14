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

  if (/armed forces|military|national security|defense|national defense|homeland security/.test(text)) {
    return 'Armed Forces & Security';
  }
  if (/education|training|student|school|university|college|learning|va training/.test(text)) {
    return 'Education';
  }
  if (/disability|compensation|pension|va benefits|veterans benefits|health|medical|survivor|dependent/.test(text)) {
    return 'Veterans Benefits';
  }
  if (/tax|property|financial|income|deduction|exemption|money/.test(text)) {
    return 'Tax & Property';
  }

  return 'Veterans Benefits';
}

function isMOAAPriority(title: string, summary: string, subjects?: string[]): boolean {
  const text = `${title} ${summary} ${subjects?.join(' ') || ''}`.toLowerCase();
  return /disability|compensation|pension|benefits|va benefits|health|medical/.test(text);
}

function truncateText(text: string, maxWords: number = 15): string {
  const words = text.split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...';
  }
  return text;
}

const TAG_COLORS: Record<string, string> = {
  'Armed Forces & Security': '#2563eb',
  'Education': '#8b5cf6',
  'Veterans Benefits': '#10b981',
  'Tax & Property': '#f59e0b',
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
          <Link to={`/bills/${bill.id}`}>{truncateText(bill.summary, 15)}</Link>
        </h3>
        <div className="bill-badges">
          <span className={`bill-badge bill-badge-${bill.source}`}>{bill.source}</span>
          <span className={`bill-badge bill-status-${statusCategory}`}>
            {statusCategory === 'passed' ? '✓ Passed' : statusCategory === 'failed' ? '✗ Failed' : '⧗ Pending'}
          </span>
          <span className="bill-badge bill-badge-moaa-tag" style={{ backgroundColor: `${TAG_COLORS[moaaTag]}20`, color: TAG_COLORS[moaaTag] }}>
            {moaaTag}
          </span>
        </div>
      </div>
      <p className="bill-official-title"><strong>{bill.title}</strong></p>
      <p>
        <strong>Status:</strong> {bill.status}
      </p>
      {bill.subjects && bill.subjects.length > 0 && (
        <p>
          <strong>Topics:</strong> {bill.subjects.join(', ')}
        </p>
      )}
      {bill.sponsors && bill.sponsors.length > 0 && (
        <p>
          <strong>Sponsors:</strong> {bill.sponsors.slice(0, 3).join(', ')}{bill.sponsors.length > 3 ? '...' : ''}
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
