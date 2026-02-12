import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';

interface SearchResult {
  id: string;
  product: {
    name: string;
    gtin?: string;
    description?: string;
    category: string;
  };
  hospital: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  quantity: number;
  pricePerUnit: number;
  currency: string;
  baseUnit: string;
  expiryDate?: string;
  status: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    regulatoryClass: '',
    minPrice: '',
    maxPrice: ''
  });
  const navigate = useNavigate();

  // Load initial results on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        excludeMyListings: true
      };
      
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (filters.category) params.category = filters.category;
      if (filters.manufacturer) params.manufacturer = filters.manufacturer;
      if (filters.regulatoryClass) params.regulatoryClass = filters.regulatoryClass;
      if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
      
      console.log('Searching with params:', params);
      
      const response = await searchAPI.search(params);
      
      console.log('Search response:', response.data);
      
      setResults(response.data.data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (listingId: string) => {
    console.log('Navigating to checkout page:', listingId);
    navigate(`/app/checkout/${listingId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>🔍 Search Marketplace</h1>
        <p>Find medical supplies from other hospitals</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search by product name, GTIN, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              background: loading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}
          >
            {loading ? '🔄 Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <input
            type="text"
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <input
            type="number"
            placeholder="Min Price (CHF)"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <input
            type="number"
            placeholder="Max Price (CHF)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '1rem'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <p>Searching marketplace...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <h3>No listings found</h3>
          <p>Try adjusting your search criteria or check back later</p>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <strong style={{ color: '#0369a1' }}>
              Found {results.length} listing{results.length !== 1 ? 's' : ''}
            </strong>
          </div>

          <div style={{ 
            display: 'grid', 
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
          }}>
            {results.map((result) => (
              <div
                key={result.id}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Info */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    color: '#0f172a',
                    fontSize: '1.125rem',
                    fontWeight: 700
                  }}>
                    {result.product?.name || 'Unknown Product'}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}>
                    <span className="badge badge-info">
                      {result.product?.category || 'General'}
                    </span>
                    {result.product?.gtin && (
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        background: '#f1f5f9',
                        color: '#64748b',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {result.product.gtin}
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}>
                    {result.product?.description || 'Medical Supply'}
                  </p>
                </div>

                {/* Hospital Info */}
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    Seller
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: '#0f172a',
                    fontSize: '0.875rem'
                  }}>
                    {result.hospital?.name || 'Unknown Hospital'}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b'
                  }}>
                    📍 {result.hospital?.city || 'Unknown'}, {result.hospital?.country || 'Unknown'}
                  </div>
                </div>

                {/* Price & Quantity */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>
                      Price per unit
                    </div>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700,
                      color: '#0ea5e9'
                    }}>
                      {result.pricePerUnit.toFixed(2)} {result.currency}
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>
                      Available
                    </div>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700,
                      color: '#10b981'
                    }}>
                      {result.quantity} {result.baseUnit || 'units'}
                    </div>
                  </div>
                </div>

                {/* Expiry Date */}
                {result.expiryDate && (
                  <div style={{
                    padding: '0.5rem',
                    background: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#78350f',
                    marginBottom: '1rem'
                  }}>
                    📅 Expires: {formatDate(result.expiryDate)}
                  </div>
                )}

                {/* Reserve Button */}
                <button
                  onClick={() => handleReserve(result.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  🛒 Reserve Product
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
