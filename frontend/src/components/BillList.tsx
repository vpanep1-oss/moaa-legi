import { Link } from 'react-router-dom';
import type { Bill } from '../types';

interface BillListProps {
  bills: Bill[];
}

export default function BillList({ bills }: BillListProps) {
  if (!bills.length) {
    return <p>No bills found yet. Run the daily ingest or configure API keys.</p>;
  }

  return (
    <div className="bill-list">
      <ul>
        {bills.map((bill) => (
          <li key={bill.id} className="bill-item">
            <h3>
              <Link to={`/bills/${bill.id}`}>{bill.title}</Link>
            </h3>
            <p>{bill.summary}</p>
            <p>
              <strong>Status:</strong> {bill.status}
            </p>
            <p>
              <strong>Last action:</strong> {bill.lastActionDate ?? 'Unknown'}
            </p>
            {bill.billUrl ? (
              <p>
                <a href={bill.billUrl} target="_blank" rel="noreferrer">
                  External bill link
                </a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
