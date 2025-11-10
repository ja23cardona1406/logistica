import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScannerPage from './pages/ScannerPage';
import ProcessPage from './pages/ProcessPage';
import BestPracticesPage from './pages/BestPracticesPage';
import AssistantPage from './pages/AssistantPage';
import AdminAlertsPage from './pages/AdminAlertsPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => (
  <>
    <Toaster position="top-right" />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="processes" element={<DashboardPage />} />
        <Route path="processes/:processId" element={<ProcessPage />} />
        <Route path="best-practices" element={<BestPracticesPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="admin/alerts" element={<AdminAlertsPage />} />
        <Route path="profile" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </>
);

export default App;
