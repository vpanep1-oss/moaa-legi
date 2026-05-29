import type { Bill } from '../types';

interface BillTimelineProps {
  bill: Bill;
}

function formatDate(date?: string) {
  if (!date) return 'Unknown';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BillTimeline({ bill }: BillTimelineProps) {
  const points = [
    { label: 'Introduced', date: bill.introducedDate },
    { label: 'Last action', date: bill.lastActionDate }
  ].filter((point) => point.date);

  if (!points.length) {
    return null;
  }

  return (
    <section className="bill-timeline">
      <h3>Bill timeline</h3>
      <ul>
        {points.map((point) => (
          <li key={point.label}>
            <strong>{point.label}:</strong> {formatDate(point.date)}
          </li>
        ))}
      </ul>
    </section>
  );
}
