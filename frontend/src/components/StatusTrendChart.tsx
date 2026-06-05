import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Bill } from '../types';

interface TrendPoint {
  period: string;
  passed: number;
  failed: number;
  pending: number;
}

const FAILED_REGEX = /rejected|failed|vetoed|dismissed|withdrawn|died/i;
const PASSED_REGEX = /passed|enacted|approved|agreed|engrossed|effective|signed|became law/i;

function categorizeStatus(status: string) {
  if (FAILED_REGEX.test(status)) return 'failed';
  if (PASSED_REGEX.test(status)) return 'passed';
  return 'pending';
}

function monthLabel(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function buildTrendData(bills: Bill[]): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();

  bills.forEach((bill) => {
    const date = bill.introducedDate || bill.lastActionDate;
    const label = date ? monthLabel(date) : 'Unknown';
    const category = categorizeStatus(bill.status);
    const bucket = buckets.get(label) ?? { period: label, passed: 0, failed: 0, pending: 0 };
    bucket[category] += 1;
    buckets.set(label, bucket);
  });

  return [...buckets.values()].sort((a, b) => {
    const [aMonth, aYear] = a.period.split(' ');
    const [bMonth, bYear] = b.period.split(' ');
    const aDate = new Date(`${aMonth} 1, ${aYear}`);
    const bDate = new Date(`${bMonth} 1, ${bYear}`);
    return aDate.getTime() - bDate.getTime();
  });
}

interface StatusTrendChartProps {
  bills: Bill[];
}

export default function StatusTrendChart({ bills }: StatusTrendChartProps) {
  const data = buildTrendData(bills);

  if (!bills.length) {
    return <p>No trend data available yet.</p>;
  }

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Bill status trend</h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="passed" stackId="a" fill="#4caf50" />
            <Bar dataKey="failed" stackId="a" fill="#f44336" />
            <Bar dataKey="pending" stackId="a" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
