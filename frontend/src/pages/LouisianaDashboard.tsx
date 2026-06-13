import { useEffect, useState } from 'react';
import BillList from '../components/BillList';
import DashboardSummary from '../components/DashboardSummary';
import { getLouisianaBillsUrl } from '../utils/api';
import type { Bill } from '../types';

function categorizeStatus(status: string) {
  const normalized = status?.toLowerCase() ?? '';
  if (/rejected|failed|vetoed|dismissed|withdrawn|died|nays/.test(normalized)) {
    return 'failed';
  }
  if (/passed|enacted|approved|agreed|engrossed|effective|signed|yeas|became law/.test(normalized)) {
    return 'passed';
  }
  return 'pending';
}

export default function LouisianaDashboard() {
  const [data, setData] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(getLouisianaBillsUrl())
      .then((res) => res.json())
      .then((json) => setData(json.bills || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredBills = data.filter((bill) => {
    const matchesStatus = !selectedStatus || categorizeStatus(bill.status) === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <DashboardSummary
        bills={data}
        onStatusFilter={setSelectedStatus}
        selectedStatus={selectedStatus}
      />
      <section>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search bills by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {selectedStatus && (
          <div className="filter-tag">
            Filtering by <strong>{selectedStatus}</strong>
            <button onClick={() => setSelectedStatus(null)} className="clear-filter">
              ✕
            </button>
          </div>
        )}
      </section>
      {loading ? (
        <section>
          <p>Loading Louisiana bills...</p>
        </section>
      ) : (
        <BillList bills={filteredBills} />
      )}
    </>
  );
}
