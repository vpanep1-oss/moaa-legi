import { Route, Routes, Link } from 'react-router-dom';
import FederalDashboard from './pages/FederalDashboard';
import LouisianaDashboard from './pages/LouisianaDashboard';
import BillDetail from './pages/BillDetail';

export default function App() {
  return (
    <div className="app-container">
      <header>
        <h1>LCOC MOAA Legislation Dashboard</h1>
        <nav>
          <Link to="/federal">Federal</Link>
          {' | '}
          <Link to="/louisiana">Louisiana</Link>
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
