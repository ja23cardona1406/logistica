import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

// Layouts
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScannerPage from './pages/ScannerPage';
import ProcessPage from './pages/ProcessPage';
import BestPracticesPage from './pages/BestPracticesPage';
import AssistantPage from './pages/AssistantPage';
import AdminAlertsPage from './pages/AdminAlertsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SessionProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="processes" element={<DashboardPage />} />
              <Route path="processes/:processId" element={<ProcessPage />} />
              <Route path="best-practices" element={<BestPracticesPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              
              {/* Admin routes */}
              <Route path="admin/alerts" element={<AdminAlertsPage />} />
              <Route path="admin/users" element={<DashboardPage />} />
              <Route path="admin/process-management" element={<DashboardPage />} />
              
              {/* Profile route */}
              <Route path="profile" element={<DashboardPage />} />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;