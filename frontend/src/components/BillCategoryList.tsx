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

const CATEGORY_ORDER = [
  'Education',
  'Housing',
  'Employment',
  'Surviving Spouse/Dependents',
  'Caregivers',
  'Mental Health & Wellness',
  'Tax & Financial',
  'Benefits & Compensation',
  'Memorials & Recognition',
  'Other',
];

const CATEGORY_ICONS: Record<string, string> = {
  'Education': '📚',
  'Housing': '🏠',
  'Employment': '💼',
  'Surviving Spouse/Dependents': '👨‍👩‍👧',
  'Caregivers': '🤝',
  'Mental Health & Wellness': '🧠',
  'Tax & Financial': '💰',
  'Benefits & Compensation': '🎖️',
  'Memorials & Recognition': '🏛️',
  'Other': '📋',
};

function BillCard({ bill }: { bill: Bill }) {
  const statusCategory = categorizeStatus(bill.status);

  return (
    <li key={bill.id} className="bill-item">
      <div className="bill-item-header">
        <h3>
          <Link to={`/bills/${bill.id}`}>{bill.title}</Link>
        </h3>
        <div className="bill-badges">
          <span className={`bill-badge bill-badge-${bill.source}`}>{bill.source}</span>
          <span className={`bill-badge bill-status-${statusCategory}`}>
            {statusCategory === 'passed' ? '✓ Passed' : statusCategory === 'failed' ? '✗ Failed' : '⧗ Pending'}
          </span>
          {bill.category && (
            <span className="bill-badge bill-badge-category">{bill.category}</span>
          )}
        </div>
      </div>
      <p>{bill.summary}</p>
      <p>
        <strong>Status:</strong> {bill.status}
      </p>
      {bill.introducedDate && (
        <p>
          <strong>Introduced:</strong> {new Date(bill.introducedDate).toLocaleDateString()}
        </p>
      )}
      {bill.subjects && bill.subjects.length > 0 && (
        <p>
          <strong>Topics:</strong> {bill.subjects.join(', ')}
        </p>
      )}
      {bill.sponsors && bill.sponsors.length > 0 && (
        <p>
          <strong>Sponsors:</strong> {bill.sponsors.join(', ')}
        </p>
      )}
      {bill.billUrl ? (
        <p>
          <a href={bill.billUrl} target="_blank" rel="noreferrer">
            External bill link
          </a>
        </p>
      ) : null}
    </li>
  );
}

export default function BillCategoryList({ bills }: BillCategoryListProps) {
  if (!bills.length) {
    return <p>No bills found yet. Run the daily ingest or configure API keys.</p>;
  }

  const billsByCategory = bills.reduce(
    (acc, bill) => {
      const category = bill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(bill);
      return acc;
    },
    {} as Record<string, Bill[]>
  );

  const sortedCategories = CATEGORY_ORDER.filter((cat) => billsByCategory[cat]);

  return (
    <div className="bill-category-list">
      {sortedCategories.map((category) => (
        <section key={category} className="category-section">
          <div className="category-header">
            <div className="category-icon">{CATEGORY_ICONS[category]}</div>
            <h3 className="category-title">{category}</h3>
            <div className="category-count">{billsByCategory[category].length}</div>
          </div>
          <div className="category-bills-grid">
            {billsByCategory[category].map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
