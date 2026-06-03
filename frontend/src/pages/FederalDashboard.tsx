import { useEffect, useState } from 'react';
import BillList from '../components/BillList';
import DashboardSummary from '../components/DashboardSummary';
import StatusTrendChart from '../components/StatusTrendChart';
import type { Bill } from '../types';

export default function FederalDashboard() {
  const [data, setData] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://moaa-legi.onrender.com/api/federal')
      .then((res) => res.json())
      .then((json) => setData(json.bills || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <DashboardSummary
        bills={data}
        title="Federal Legislation"
        subtitle="Daily updated federal bills related to veterans and military topics."
      />
      {loading ? <p>Loading federal bills...</p> : <StatusTrendChart bills={data} />}
      {loading ? <p>Loading federal bills...</p> : <BillList bills={data} />}
    </section>
  );
}
