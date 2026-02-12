import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadAPI, mappingAPI } from '../services/api';

interface RawProduct {
  id: string;
  artikelbezeichnung: string;
  marke?: string;
  artikelnummer?: string;
  gtin?: string;
  nettoZielpreis?: number;
  jahresmenge?: number;
  basismengeneinheit?: string;
  waehrung?: string;
  mappingStatus: string;
  mapping?: {
    id: string;
    confidence: number;
    method: string;
    confirmedBySeller: boolean;
    canonicalProduct: {
      id: string;
      canonicalName: string;
      manufacturer?: string;
      category?: string;
      regulatoryClass?: string;
    };
  };
}

interface MappingSuggestion {
  canonicalProductId: string;
  canonicalName: string;
  manufacturer?: string;
  confidence: number;
  method: string;
  matchedOn: string;
}

export default function MappingReviewPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<RawProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<RawProduct | null>(null);
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  const loadBatch = async () => {
    setLoading(true);
    try {
      const response = await uploadAPI.getBatch(batchId!);
      setProducts(response.data.data);
    } catch (err) {
      alert('Failed to load batch products');
      console.error(err);
      navigate('/app/upload');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (product: RawProduct) => {
    setSelectedProduct(product);
    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const response = await mappingAPI.getSuggestions(product.id);
      setSuggestions(response.data.data);
    } catch (err) {
      alert('Failed to load mapping suggestions');
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const acceptMapping = async (suggestion: MappingSuggestion) => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      await mappingAPI.createMapping({
        rawProductId: selectedProduct.id,
        canonicalProductId: suggestion.canonicalProductId,
        confidence: suggestion.confidence,
        method: suggestion.method
      });

      alert('✅ Mapping confirmed!');
      await loadBatch();
      setSelectedProduct(null);
      setSuggestions([]);
    } catch (err) {
      alert('Failed to save mapping');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const pending = products.filter(p => p.mappingStatus === 'PENDING');
  const needsReview = products.filter(p => p.mappingStatus === 'NEEDS_REVIEW');
  const mapped = products.filter(p => p.mappingStatus === 'MAPPED');
  const failed = products.filter(p => p.mappingStatus === 'FAILED');

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Loading products...
        </div>
      </div>
    );
  }

  const allMapped = mapped.length === products.length;
  const canProceed = mapped.length > 0;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Review Product Mappings</h1>
        <p>Confirm automatic mappings and create marketplace listings</p>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          background: '#d1fae5',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#065f46' }}>
            {mapped.length}
          </div>
          <div style={{ color: '#047857', fontSize: '0.9rem' }}>✅ Mapped</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#92400e' }}>
            {needsReview.length}
          </div>
          <div style={{ color: '#b45309', fontSize: '0.9rem' }}>⚠️ Needs Review</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#e0e7ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3730a3' }}>
            {pending.length}
          </div>
          <div style={{ color: '#4f46e5', fontSize: '0.9rem' }}>⏳ Pending</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#991b1b' }}>
            {failed.length}
          </div>
          <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>❌ Failed</div>
        </div>
      </div>

      {/* Continue Button */}
      {canProceed && (
        <div style={{
          padding: '1.5rem',
          background: '#d1fae5',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#065f46' }}>
            {allMapped ? '🎉 All products mapped!' : `✅ ${mapped.length} product${mapped.length !== 1 ? 's' : ''} ready`}
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#047857' }}>
            {allMapped 
              ? 'Proceed to create marketplace listings'
              : `You can proceed with ${mapped.length} mapped product${mapped.length !== 1 ? 's' : ''}, or review remaining products first`
            }
          </p>
          <button
            onClick={() => navigate('/app/create-listing')}
            style={{
              padding: '0.875rem 2rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            📋 Create Listings ({mapped.length})
          </button>
        </div>
      )}

      {/* Products to Review */}
      {(needsReview.length > 0 || pending.length > 0 || failed.length > 0) && (
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Product List */}
          <div style={{ flex: 1 }}>
            <h2>Products Needing Attention</h2>
            
            {[...needsReview, ...pending, ...failed].map(product => (
              <div
                key={product.id}
                onClick={() => loadSuggestions(product)}
                style={{
                  padding: '1rem',
                  margin: '0.5rem 0',
                  border: selectedProduct?.id === product.id ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedProduct?.id === product.id ? '#e0f2fe' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                      {product.artikelbezeichnung}
                    </strong>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                      {product.marke && <span>Brand: {product.marke} • </span>}
                      {product.artikelnummer && <span>SKU: {product.artikelnummer}</span>}
                      {product.gtin && <span> • GTIN: {product.gtin}</span>}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: product.mappingStatus === 'NEEDS_REVIEW' ? '#fef3c7' : 
                               product.mappingStatus === 'PENDING' ? '#e0e7ff' : '#fee2e2',
                    color: product.mappingStatus === 'NEEDS_REVIEW' ? '#92400e' : 
                           product.mappingStatus === 'PENDING' ? '#3730a3' : '#991b1b'
                  }}>
                    {product.mappingStatus === 'NEEDS_REVIEW' ? '⚠️ Review' : 
                     product.mappingStatus === 'PENDING' ? '⏳ Pending' : '❌ Failed'}
                  </span>
                </div>
                
                {product.mapping && product.mappingStatus === 'NEEDS_REVIEW' && (
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#f59e0b', 
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: '#fffbeb',
                    borderRadius: '6px'
                  }}>
                    <strong>Suggested:</strong> {product.mapping.canonicalProduct.canonicalName}
                    <br />
                    <strong>Confidence:</strong> {(product.mapping.confidence * 100).toFixed(0)}% - Please confirm
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggestions Panel */}
          <div style={{ flex: 1 }}>
            {selectedProduct ? (
              <>
                <h2>Mapping Suggestions</h2>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedProduct.artikelbezeichnung}
                  </strong>
                  {selectedProduct.marke && (
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Brand: {selectedProduct.marke}
                    </div>
                  )}
                </div>

                {loadingSuggestions ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading suggestions...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
                    <p style={{ color: '#991b1b', margin: 0 }}>
                      No matching products found in catalog.
                    </p>
                    <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      This product may need to be added to the canonical catalog first.
                    </p>
                  </div>
                ) : (
                  suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        margin: '0.75rem 0',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white'
                      }}
                    >
                      <h3 style={{ 
                        color: '#0f172a', 
                        marginBottom: '0.75rem',
                        fontSize: '1rem'
                      }}>
                        {suggestion.canonicalName}
                      </h3>
                      
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#64748b',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <strong>Manufacturer:</strong><br />
                          {suggestion.manufacturer || 'N/A'}
                        </div>
                        <div>
                          <strong>Method:</strong><br />
                          {suggestion.method}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <strong style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          Confidence:
                        </strong>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          background: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${suggestion.confidence * 100}%`,
                            height: '100%',
                            background: suggestion.confidence >= 0.8 ? '#10b981' :
                                       suggestion.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <span style={{ 
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: suggestion.confidence >= 0.8 ? '#065f46' :
                                 suggestion.confidence >= 0.6 ? '#92400e' : '#991b1b'
                        }}>
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: '#94a3b8',
                        margin: '0 0 1rem 0',
                        fontStyle: 'italic'
                      }}>
                        {suggestion.matchedOn}
                      </p>

                      <button
                        onClick={() => acceptMapping(suggestion)}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: saving ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {saving ? 'Saving...' : '✅ Accept This Mapping'}
                      </button>
                    </div>
                  ))
                )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
                <p>Select a product to view mapping suggestions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Mapped State */}
      {allMapped && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#f0fdf4',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#065f46', marginBottom: '0.5rem' }}>
            All Products Mapped!
          </h2>
          <p style={{ color: '#047857', fontSize: '1.1rem' }}>
            Ready to create {mapped.length} marketplace listing{mapped.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}