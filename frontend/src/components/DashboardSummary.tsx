import type { Bill } from '../types';

interface SummaryMetrics {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
}

function categorizeStatus(status: string) {
  const normalized = status?.toLowerCase() ?? '';
  if (/rejected|failed|vetoed|dismissed|withdrawn|died/.test(normalized)) {
    return 'failed';
  }
  if (/passed|enacted|approved|agreed|engrossed|effective|signed|became law/.test(normalized)) {
    return 'passed';
  }
  return 'pending';
}

function computeMetrics(bills: Bill[]): SummaryMetrics {
  const metrics = {
    total: bills.length,
    passed: 0,
    failed: 0,
    pending: 0,
    passRate: 0
  };

  bills.forEach((bill) => {
    const category = categorizeStatus(bill.status);
    if (category === 'passed') metrics.passed += 1;
    else if (category === 'failed') metrics.failed += 1;
    else metrics.pending += 1;
  });

  metrics.passRate = metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0;
  return metrics;
}

interface DashboardSummaryProps {
  bills: Bill[];
  title: string;
  subtitle: string;
}

export default function DashboardSummary({ bills, title, subtitle }: DashboardSummaryProps) {
  const { total, passed, failed, pending, passRate } = computeMetrics(bills);

  return (
    <section>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="summary-grid">
        <div className="metric-card">
          <h3>Total bills</h3>
          <p>{total}</p>
        </div>
        <div className="metric-card passed">
          <h3>Passed</h3>
          <p>{passed}</p>
        </div>
        <div className="metric-card failed">
          <h3>Failed</h3>
          <p>{failed}</p>
        </div>
        <div className="metric-card pending">
          <h3>Pending</h3>
          <p>{pending}</p>
        </div>
        <div className="metric-card rate">
          <h3>Pass rate</h3>
          <p>{passRate}%</p>
        </div>
      </div>
    </section>
  );
}
