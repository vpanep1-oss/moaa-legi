import { Link } from 'react-router-dom';
import type { Bill } from '../types';

interface BillListProps {
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

export default function BillList({ bills }: BillListProps) {
  if (!bills.length) {
    return <p>No bills found yet. Run the daily ingest or configure API keys.</p>;
  }

  return (
    <div className="bill-list">
      <ul>
        {bills.map((bill) => {
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
                  <strong>Topics:</strong>{' '}
                  {Array.isArray(bill.subjects)
                    ? bill.subjects
                        .map((s) => (typeof s === 'string' ? s : s.subject_name || s))
                        .join(', ')
                    : bill.subjects}
                </p>
              )}
              {bill.sponsors && bill.sponsors.length > 0 && (
                <p>
                  <strong>Sponsors:</strong>{' '}
                  {bill.sponsors
                    .map((s) => (typeof s === 'string' ? s : s.name || s))
                    .join(', ')}
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
        })}
      </ul>
    </div>
  );
}
