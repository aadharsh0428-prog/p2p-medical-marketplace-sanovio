import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [emailOrHospitalId, setEmailOrHospitalId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with:', emailOrHospitalId);
      
      const response = await authAPI.login(emailOrHospitalId, password);
      
      console.log('📦 Login response:', response.data);
      
      // ✅ Handle response correctly
      const { token, hospital } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store authentication data
      localStorage.setItem('authToken', token);
      localStorage.setItem('hospitalId', hospital?.id || '');
      localStorage.setItem('hospitalName', hospital?.name || '');
      
      console.log('✅ Login successful:', {
        hospitalId: hospital?.id,
        hospitalName: hospital?.name
      });
      
      // Navigate to dashboard
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.error 
        || err.message 
        || 'Login failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Quick login function
  const quickLogin = (email: string) => {
    setEmailOrHospitalId(email);
    setPassword('hospital123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '3rem',
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏥</div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            P2P Medical Marketplace
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#64748b',
            fontSize: '0.95rem',
            fontWeight: 500
          }}>
            Secure platform for hospital-to-hospital trading
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              color: '#991b1b',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              ❌ {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#0f172a',
              fontSize: '0.875rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={emailOrHospitalId}
              onChange={(e) => setEmailOrHospitalId(e.target.value)}
              placeholder="e.g., info@inselspitalbern.ch"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#0f172a',
              fontSize: '0.875rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
              marginBottom: '1.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
            }}
          >
            {loading ? '🔄 Logging in...' : '🔐 Login'}
          </button>

          {/* Quick Login Buttons */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#64748b',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              Quick Login (Demo):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => quickLogin('info@inselspitalbern.ch')}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.5rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                🏥 Bern
              </button>
              <button
                type="button"
                onClick={() => quickLogin('info@chuvlausanne.ch')}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.5rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                🏥 Lausanne
              </button>
              <button
                type="button"
                onClick={() => quickLogin('info@universitatsspitalzurich.ch')}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.5rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                🏥 Zürich
              </button>
            </div>
          </div>

          {/* Demo Info */}
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '10px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ 
              fontWeight: 700, 
              color: '#78350f',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              🎯 Demo Access
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#92400e',
              lineHeight: 1.6
            }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>Email:</strong> <code style={{ 
                  background: 'rgba(255, 255, 255, 0.5)', 
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}>info@inselspitalbern.ch</code>
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>Password:</strong> <code style={{ 
                  background: 'rgba(255, 255, 255, 0.5)', 
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}>hospital123</code>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.8rem'
        }}>
          © 2026 P2P Medical Marketplace · Secure & Compliant
        </div>
      </div>
    </div>
  );
}