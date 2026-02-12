import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AppShell = lazy(() => import('./pages/AppShell'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f8fafc'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
            <p style={{ color: '#64748b', fontSize: '1.125rem' }}>Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/app" element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="checkout/:listingId" element={<CheckoutPage />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
