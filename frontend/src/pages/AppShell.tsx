import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const hospitalName = localStorage.getItem('hospitalName') || 'Hospital Portal';

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/app/dashboard')}
          >
            <div style={{ fontSize: '2rem' }}>🏥</div>
            <div>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                P2P Medical Marketplace
              </h1>
            </div>
          </div>
          
          {/* Hospital Name & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: 0.9
              }}>
                {hospitalName}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          background: 'white',
          minHeight: 'calc(100vh - 76px)',
          borderRight: '1px solid #e2e8f0',
          padding: '2rem 0'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0 1rem'
          }}>
            <Link
              to="/app/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                color: isActive('dashboard') ? '#667eea' : '#64748b',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: isActive('dashboard') 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                  : 'transparent',
                border: isActive('dashboard') ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive('dashboard')) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('dashboard')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              Dashboard
            </Link>

            <Link
              to="/app/search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                color: isActive('search') ? '#667eea' : '#64748b',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: isActive('search') 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                  : 'transparent',
                border: isActive('search') ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive('search')) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('search')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🔍</span>
              Search Marketplace
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}>
          <React.Suspense fallback={
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <p style={{ color: '#64748b' }}>Loading...</p>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
