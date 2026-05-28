import { useEffect } from 'react';
import DashboardPage from './components/dashboard/DashboardPage';
import { applyTheme, readStoredTheme } from './components/dashboard/DashboardHeader';

export default function App() {
  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  return <DashboardPage />;
}
