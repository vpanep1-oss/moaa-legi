import { Route, Routes, Link, useLocation } from 'react-router-dom';
import FederalDashboard from './pages/FederalDashboard';
import LouisianaDashboard from './pages/LouisianaDashboard';
import BillDetail from './pages/BillDetail';

export default function App() {
  const location = useLocation();
  const isLouisiana = location.pathname === '/louisiana';
  const isFederal = location.pathname === '/' || location.pathname === '/federal';

  return (
    <div className="app-container">
      <header>
        <h1>⚓ LCOC MOAA Legislation Dashboard</h1>
        <nav>
          <Link to="/federal" className={isFederal ? 'active' : ''}>All Bills</Link>
          <Link to="/federal" className={isFederal ? 'active' : ''}>Federal</Link>
          <Link to="/louisiana" className={isLouisiana ? 'active' : ''}>Louisiana</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<FederalDashboard />} />
          <Route path="/federal" element={<FederalDashboard />} />
          <Route path="/louisiana" element={<LouisianaDashboard />} />
          <Route path="/bills/:id" element={<BillDetail />} />
        </Routes>
      </main>
    </div>
  );
}
