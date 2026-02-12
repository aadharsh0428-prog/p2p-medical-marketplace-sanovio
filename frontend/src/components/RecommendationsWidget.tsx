import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsAPI } from '../services/api';

interface Recommendation {
  id: string;
  product: {
    name: string;
    gtin?: string;
    category: string;
  };
  hospital: {
    name: string;
    country: string;
  };
  quantity: number;
  pricePerUnit: number;
  relevanceScore: number;
  expiryDate?: string;
}

export default function RecommendationsWidget() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await recommendationsAPI.getRecommendations();
      setRecommendations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Loading recommendations...
        </p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '2px solid #bae6fd',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>
          No Recommendations Yet
        </h3>
        <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.875rem' }}>
          Start browsing and purchasing products to get personalized recommendations!
        </p>
      </div>
    );
  }

  const displayCount = expanded ? recommendations.length : 3;
  const displayedRecs = recommendations.slice(0, displayCount);

  return (
    <div style={{
      background: 'white',
      border: '2px solid #10b981',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        borderBottom: '1px solid #6ee7b7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <h3 style={{ 
            margin: 0, 
            color: '#065f46',
            fontSize: '1.125rem',
            fontWeight: 700
          }}>
            Recommended for You
          </h3>
        </div>
        <p style={{ 
          margin: '0.25rem 0 0 0', 
          color: '#047857',
          fontSize: '0.75rem'
        }}>
          AI-powered suggestions based on your activity
        </p>
      </div>

      {/* Recommendations List */}
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedRecs.map((rec, index) => (
            <div
              key={rec.id}
              onClick={() => navigate(`/app/checkout/${rec.id}`)}
              style={{
                padding: '1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
                e.currentTarget.style.borderColor = '#0ea5e9';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Relevance Badge */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: '#10b981',
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.625rem',
                fontWeight: 700
              }}>
                {Math.round(rec.relevanceScore * 10)}% match
              </div>

              {/* Product Info */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ 
                  fontWeight: 700, 
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  marginBottom: '0.25rem',
                  paddingRight: '3rem'
                }}>
                  {rec.product.name}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    background: '#ddd6fe',
                    color: '#5b21b6',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}>
                    {rec.product.category}
                  </span>
                  {rec.product.gtin && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      borderRadius: '10px',
                      fontSize: '0.7rem'
                    }}>
                      {rec.product.gtin}
                    </span>
                  )}
                </div>
              </div>

              {/* Seller & Price */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <div>📍 {rec.hospital.name}</div>
                  <div style={{ marginTop: '0.125rem' }}>
                    📦 {rec.quantity} units available
                  </div>
                </div>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#10b981'
                }}>
                  {rec.pricePerUnit.toFixed(2)} CHF
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {recommendations.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'transparent',
              border: '1px solid #10b981',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#d1fae5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {expanded 
              ? `▲ Show Less` 
              : `▼ Show All (${recommendations.length} recommendations)`
            }
          </button>
        )}
      </div>
    </div>
  );
}
