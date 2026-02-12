import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchAPI, reservationAPI } from '../services/api';

interface Listing {
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

export default function CheckoutPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reservationId, setReservationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (!reservationId) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('⏰ Reservation expired!');
          navigate('/app/search');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reservationId, navigate]);

  const loadListing = async () => {
    if (!listingId) {
      navigate('/app/search');
      return;
    }

    setLoading(true);
    try {
      const response = await searchAPI.getDetails(listingId);
      console.log('Listing loaded:', response.data);
      setListing(response.data.data);
    } catch (err: any) {
      console.error('Load listing error:', err);
      alert('Failed to load listing');
      navigate('/app/search');
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async () => {
    if (!listingId) return;

    if (quantity <= 0 || quantity > (listing?.quantity || 0)) {
      alert('Invalid quantity');
      return;
    }

    try {
      const response = await reservationAPI.create({
        listingId: listingId,
        quantity: quantity
      });

      setReservationId(response.data.data?.id || '');
      setTimeLeft(15 * 60);
      alert('✅ Reserved! You have 15 minutes to complete.');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Reservation failed';
      alert('❌ ' + errorMsg);
      console.error(err);
    }
  };

  const completeCheckout = async () => {
    if (!reservationId) return;

    try {
      await reservationAPI.confirmReservation(reservationId);
      alert('✅ Order completed successfully!');
      navigate('/app/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Checkout failed';
      alert('❌ ' + errorMsg);
      console.error(err);
    }
  };

  const cancelReservation = async () => {
    if (!reservationId) {
      navigate('/app/search');
      return;
    }

    if (!window.confirm('Cancel this reservation?')) return;

    try {
      await reservationAPI.cancelReservation(reservationId);
      navigate('/app/search');
    } catch (err: any) {
      console.error(err);
      navigate('/app/search');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Listing not found</h3>
          <button onClick={() => navigate('/app/search')}>← Back to Search</button>
        </div>
      </div>
    );
  }

  const total = quantity * listing.pricePerUnit;

  return (
    <div className="container">
      <div className="page-header">
        <h1>🛒 Checkout</h1>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#0f172a' }}>
          {listing.product?.name || 'Unknown Product'}
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gap: '0.75rem',
          color: '#475569',
          fontSize: '0.95rem'
        }}>
          {listing.product?.category && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Category:</strong> {listing.product.category}
            </p>
          )}
          
          {listing.product?.gtin && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>GTIN:</strong> {listing.product.gtin}
            </p>
          )}
          
          {listing.product?.description && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Description:</strong> {listing.product.description}
            </p>
          )}
          
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Seller:</strong> {listing.hospital?.name || 'Unknown'}
          </p>
          
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Location:</strong> {listing.hospital?.city}, {listing.hospital?.country}
          </p>
          
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Available:</strong> {listing.quantity} {listing.baseUnit || 'units'}
          </p>
          
          <p style={{ 
            margin: 0,
            fontSize: '1.1rem',
            color: '#0ea5e9',
            fontWeight: 600
          }}>
            <strong style={{ color: '#0f172a' }}>Price:</strong> {listing.pricePerUnit} {listing.currency}/{listing.baseUnit || 'unit'}
          </p>

          {listing.expiryDate && (
            <p style={{ 
              margin: 0,
              padding: '0.5rem',
              background: '#fef3c7',
              borderRadius: '6px',
              color: '#78350f'
            }}>
              <strong>📅 Expires:</strong> {new Date(listing.expiryDate).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
      </div>

      {!reservationId ? (
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem', 
          background: 'white', 
          border: '2px solid #0ea5e9', 
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(14, 165, 233, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Reserve Product</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#0f172a'
            }}>
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={listing.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '1rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Max: {listing.quantity} {listing.baseUnit || 'units'}
            </small>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: '#f0f9ff', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#0ea5e9',
              margin: 0
            }}>
              Total: {total.toFixed(2)} {listing.currency}
            </p>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#64748b',
              margin: '0.5rem 0 0 0'
            }}>
              {quantity} × {listing.pricePerUnit} {listing.currency}
            </p>
          </div>

          <button
            onClick={createReservation}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              marginBottom: '0.75rem',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.2s'
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
            🔒 Reserve (15 minute hold)
          </button>

          <button 
            onClick={() => navigate('/app/search')} 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: 'transparent', 
              color: '#64748b', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ← Back to Search
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ 
            padding: '1.5rem', 
            background: '#d1fae5', 
            border: '2px solid #10b981', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            textAlign: 'center' 
          }}>
            <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>✓ Reserved!</h3>
            <p style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: timeLeft < 300 ? '#ef4444' : '#f59e0b', 
              margin: '0.5rem 0' 
            }}>
              {formatTime(timeLeft)}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#065f46' }}>Time remaining</p>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            marginBottom: '1.5rem' 
          }}>
            <h4 style={{ marginBottom: '1rem', color: '#0f172a' }}>Order Summary</h4>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>Product:</strong> {listing.product?.name}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>Quantity:</strong> {quantity} {listing.baseUnit || 'units'}
            </p>
            <p style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#0ea5e9',
              marginTop: '1rem'
            }}>
              <strong>Total:</strong> {total.toFixed(2)} {listing.currency}
            </p>
          </div>

          <button 
            onClick={completeCheckout} 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              marginBottom: '0.75rem',
              fontSize: '1rem',
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
            ✅ Complete Payment
          </button>

          <button 
            onClick={cancelReservation} 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: '#fee2e2', 
              color: '#991b1b', 
              border: '1px solid #ef4444', 
              borderRadius: '8px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
          >
            ❌ Cancel Reservation
          </button>
        </div>
      )}
    </div>
  );
}
