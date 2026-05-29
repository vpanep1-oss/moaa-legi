import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Bill } from '../types';
import BillTimeline from '../components/BillTimeline';

export default function BillDetail() {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/bills/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Bill not found');
        }
        return res.json();
      })
      .then((json) => setBill(json.bill || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p>Loading bill details...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>
        <Link to="/">Return to dashboard</Link>
      </section>
    );
  }

  if (!bill) {
    return <p>No bill details available.</p>;
  }

  return (
    <article className="bill-detail-card">
      <header>
        <h2>{bill.title}</h2>
        <p className="bill-source">{bill.source}</p>
      </header>
      <div className="bill-meta-list">
        <div>
          <strong>Status:</strong>
          <span>{bill.status}</span>
        </div>
        <div>
          <strong>Introduced:</strong>
          <span>{bill.introducedDate ?? 'Unknown'}</span>
        </div>
        <div>
          <strong>Last action:</strong>
          <span>{bill.lastActionDate ?? 'Unknown'}</span>
        </div>
      </div>
      <section>
        <h3>Summary</h3>
        <p>{bill.summary}</p>
      </section>
      {bill.billUrl ? (
        <p>
          <a href={bill.billUrl} target="_blank" rel="noreferrer">
            View bill on external site
          </a>
        </p>
      ) : null}
      <BillTimeline bill={bill} />
      <Link to="/">Back to dashboard</Link>
    </article>
  );
}
