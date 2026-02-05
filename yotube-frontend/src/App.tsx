import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import AdminCompanies from './pages/AdminCompanies';
import LandingPage from './pages/LandingPage';
import AdminSettings from './pages/AdminSettings';
import PaymentPage from './pages/PaymentPage';
import AdminLogin from './pages/AdminLogin';
import { useAuth } from './context/AuthContext';
import { useAdminAuth } from './context/AdminAuthContext';

function AppShell() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/painel';

  return (
    <div className="min-h-screen bg-gray-50">
      {isDashboard && (
        <nav className="fixed top-0 right-0 p-4 z-50">
          <Link
            to="/settings"
            className="hidden md:inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Configurações
          </Link>
        </nav>
      )}

      <Routes>
        <Route
          path="/painel"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Auth />} />
        <Route path="/pagamento" element={<PaymentPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminDashboard />
            </RequireAdminAuth>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <RequireAdminAuth>
              <AdminCompanies />
            </RequireAdminAuth>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdminAuth>
              <AdminSettings />
            </RequireAdminAuth>
          }
        />
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdminAuth({ children }: { children: JSX.Element }) {
  const { token } = useAdminAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
}
