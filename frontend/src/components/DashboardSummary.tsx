import type { Bill } from '../types';

interface DashboardSummaryProps {
  bills: Bill[];
  onStatusFilter?: (status: 'passed' | 'failed' | 'pending' | null) => void;
  selectedStatus?: string | null;
}

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

export default function DashboardSummary({ bills, onStatusFilter, selectedStatus }: DashboardSummaryProps) {
  const passed = bills.filter((b) => categorizeStatus(b.status) === 'passed').length;
  const failed = bills.filter((b) => categorizeStatus(b.status) === 'failed').length;
  const pending = bills.filter((b) => categorizeStatus(b.status) === 'pending').length;
  const total = bills.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const MetricCard = ({ label, count, status, onClick }: { label: string; count: number; status: string; onClick?: () => void }) => (
    <div
      className={`metric-card metric-${status} ${selectedStatus === status ? 'selected' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <h3>{label}</h3>
      <p>{count}</p>
      <div className="progress-bar">
        <div className={`progress-fill progress-${status}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
      </div>
    </div>
  );

  return (
    <section className="dashboard-summary">
      <div className="summary-header">
        <div>
          <h2>Bill Summary</h2>
          <p className="summary-subtitle">Click any status to filter</p>
        </div>
        <div className="total-badge">{total}</div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Passed"
          count={passed}
          status="passed"
          onClick={() => onStatusFilter?.(selectedStatus === 'passed' ? null : 'passed')}
        />
        <MetricCard
          label="Failed"
          count={failed}
          status="failed"
          onClick={() => onStatusFilter?.(selectedStatus === 'failed' ? null : 'failed')}
        />
        <MetricCard
          label="Pending"
          count={pending}
          status="pending"
          onClick={() => onStatusFilter?.(selectedStatus === 'pending' ? null : 'pending')}
        />
        <div className="metric-card metric-rate">
          <h3>Pass Rate</h3>
          <p>{passRate}%</p>
          <div className="progress-bar">
            <div className="progress-fill progress-passed" style={{ width: `${passRate}%` }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
