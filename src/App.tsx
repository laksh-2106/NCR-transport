import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FleetPage from './pages/FleetPage';
import RoutesPage from './pages/RoutesPage';
import DriversPage from './pages/DriversPage';
import SchedulesPage from './pages/SchedulesPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import IncidentsPage from './pages/IncidentsPage';

function AppContent() {
  const { session, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading NCR Transport...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'fleet': return <FleetPage />;
      case 'routes': return <RoutesPage />;
      case 'drivers': return <DriversPage />;
      case 'schedules': return <SchedulesPage />;
      case 'trips': return <TripsPage />;
      case 'maintenance': return <MaintenancePage />;
      case 'fuel': return <FuelPage />;
      case 'incidents': return <IncidentsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
