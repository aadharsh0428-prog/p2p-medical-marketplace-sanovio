import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingAPI } from '../services/api';
import RecommendationsWidget from '../components/RecommendationsWidget';

interface Listing {
  id: string;
  product: {
    name: string;
    gtin?: string;
    category: string;
  };
  quantity: number;
  pricePerUnit: number;
  status: string;
  expiryDate?: string;
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  draftListings: number;
  expiringListings: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    draftListings: 0,
    expiringListings: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'draft' | 'active' | 'all'>('draft');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await listingAPI.getMyListings();
      const allListings = response.data.data || [];
      
      setListings(allListings);
      
      // Calculate stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      setStats({
        totalListings: allListings.length,
        activeListings: allListings.filter((l: Listing) => l.status === 'available').length,
        draftListings: allListings.filter((l: Listing) => l.status === 'draft').length,
        expiringListings: allListings.filter((l: Listing) => {
          if (!l.expiryDate) return false;
          const expiryDate = new Date(l.expiryDate);
          return expiryDate > now && expiryDate < thirtyDaysFromNow;
        }).length
      });
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (listingId: string) => {
    if (!window.confirm('Activate this listing? It will become searchable in the marketplace.')) {
      return;
    }

    try {
      await listingAPI.activate(listingId);
      alert('✅ Listing activated!');
      loadDashboard(); // Reload
    } catch (error: any) {
      alert('❌ Failed to activate listing: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!window.confirm('Delete this listing permanently?')) {
      return;
    }

    try {
      await listingAPI.deleteListing(listingId);
      alert('✅ Listing deleted');
      loadDashboard(); // Reload
    } catch (error: any) {
      alert('❌ Failed to delete listing: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const filteredListings = listings.filter(listing => {
    if (activeTab === 'draft') return listing.status === 'draft';
    if (activeTab === 'active') return listing.status === 'available';
    return true; // all
  });

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header with Upload Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📊 Dashboard - {localStorage.getItem('hospitalName')}</h1>
          <p>Manage your inventory and track marketplace activity</p>
        </div>
        
        <button
          onClick={() => navigate('/app/upload')}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
          }}
        >
          📤 Upload Products
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>
            {stats.totalListings}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Listings</div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '2px solid #10b981',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {stats.activeListings}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Active Listings</div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.draftListings}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Under Review</div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {stats.expiringListings}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Expiring Soon</div>
        </div>
      </div>

      {/* 🎯 AI RECOMMENDATIONS SECTION */}
      <div style={{ marginBottom: '2rem' }}>
        <RecommendationsWidget />
      </div>

      {/* Quick Actions */}
      {listings.length === 0 && (
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #bae6fd',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>
            Get Started
          </h3>
          <p style={{ color: '#0c4a6e', marginBottom: '1.5rem' }}>
            Upload your first inventory file to start trading in the marketplace
          </p>
          <button
            onClick={() => navigate('/app/upload')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}
          >
            📤 Upload Your Inventory
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('draft')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'draft' ? '#fef3c7' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'draft' ? '2px solid #f59e0b' : 'none',
            color: activeTab === 'draft' ? '#92400e' : '#64748b',
            fontWeight: activeTab === 'draft' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          ⏳ Under Review ({stats.draftListings})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'active' ? '#d1fae5' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid #10b981' : 'none',
            color: activeTab === 'active' ? '#065f46' : '#64748b',
            fontWeight: activeTab === 'active' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          ✅ Active ({stats.activeListings})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'all' ? '#dbeafe' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #0ea5e9' : 'none',
            color: activeTab === 'all' ? '#0c4a6e' : '#64748b',
            fontWeight: activeTab === 'all' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          📋 All ({stats.totalListings})
        </button>
      </div>

      {/* Listings Table */}
      {filteredListings.length === 0 ? (
        <div className="empty-state">
          <h3>No listings in this category</h3>
          <p>
            {activeTab === 'draft' && 'Upload inventory to create draft listings'}
            {activeTab === 'active' && 'Activate draft listings to make them searchable'}
            {activeTab === 'all' && 'Upload your inventory to get started'}
          </p>
          {activeTab !== 'active' && (
            <button
              onClick={() => navigate('/app/upload')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              📤 Upload Products
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {listing.product.name}
                      </div>
                      {listing.product.gtin && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          GTIN: {listing.product.gtin}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>
                      {listing.product.category}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                      {listing.quantity}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#0ea5e9', fontWeight: 600 }}>
                      {listing.pricePerUnit.toFixed(2)} CHF
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {listing.status === 'draft' ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          ⏳ Draft
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          ✅ Active
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {listing.status === 'draft' && (
                          <button
                            onClick={() => handleActivate(listing.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                          >
                            ✅ Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
