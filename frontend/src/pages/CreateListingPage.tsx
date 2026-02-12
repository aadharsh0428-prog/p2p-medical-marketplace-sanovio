import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, listingAPI } from '../services/api';

interface RawProduct {
  id: string;
  artikelbezeichnung: string;
  marke?: string;
  artikelnummer?: string;
  nettoZielpreis?: number;
  jahresmenge?: number;
  basismengeneinheit?: string;
  waehrung?: string;
  mappingStatus: string;
  mapping?: {
    canonicalProduct: {
      id: string;
      canonicalName: string;
      manufacturer?: string;
      category?: string;
      regulatoryClass?: string;
    };
  };
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [mappedProducts, setMappedProducts] = useState<RawProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<RawProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Listing form fields
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('CHF');
  const [expiryDate, setExpiryDate] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [baseUnit, setBaseUnit] = useState('Stück');

  useEffect(() => {
    loadMappedProducts();
  }, []);

  const loadMappedProducts = async () => {
    setLoadingProducts(true);
    try {
      const batchesResponse = await uploadAPI.getBatches();
      const batches = batchesResponse.data.data;

      // Get all mapped products from all batches
      const allMapped: RawProduct[] = [];
      
      for (const batch of batches) {
        const batchResponse = await uploadAPI.getBatch(batch.id);
        const products = batchResponse.data.data;
        const mapped = products.filter((p: RawProduct) => p.mappingStatus === 'MAPPED');
        allMapped.push(...mapped);
      }

      setMappedProducts(allMapped);
    } catch (err) {
      console.error('Failed to load products:', err);
      alert('Failed to load mapped products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSelect = (product: RawProduct) => {
    setSelectedProduct(product);
    // Pre-fill with product data
    setPrice(product.nettoZielpreis || 0);
    setCurrency(product.waehrung || 'CHF');
    setBaseUnit(product.basismengeneinheit || 'Stück');
    setQuantity(product.jahresmenge || 100);
    setLotNumber('');
    setExpiryDate('');
  };

  const createListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (!selectedProduct.mapping) {
      alert('Product must be mapped to canonical catalog');
      return;
    }

    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      // Create listing as DRAFT
      const listingResponse = await listingAPI.create({
        rawProductId: selectedProduct.id,
        availableQuantity: quantity,
        pricePerUnit: price,
        currency: currency,
        baseUnit: baseUnit,
        lotNumber: lotNumber || undefined,
        expiryDate: expiryDate || undefined
      });

      const listingId = listingResponse.data.data.id;

      // Activate listing immediately
      await listingAPI.activate(listingId);

      alert('✅ Listing created and activated successfully!');

      // Remove from list
      setMappedProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      
      // Reset form
      setSelectedProduct(null);
      setQuantity(100);
      setPrice(0);
      setExpiryDate('');
      setLotNumber('');

      // If no more products, redirect to dashboard
      if (mappedProducts.length === 1) {
        setTimeout(() => navigate('/app/dashboard'), 1000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create listing';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Loading mapped products...
        </div>
      </div>
    );
  }

  if (mappedProducts.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Create Marketplace Listings</h1>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          background: '#fef3c7',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>
            No Mapped Products Found
          </h2>
          <p style={{ color: '#78350f', marginBottom: '1.5rem' }}>
            To create listings, you need to:
          </p>
          <ol style={{
            textAlign: 'left',
            display: 'inline-block',
            lineHeight: '2',
            color: '#78350f'
          }}>
            <li>Upload an Excel file with your products</li>
            <li>Review and confirm product mappings</li>
            <li>Return here to create marketplace listings</li>
          </ol>
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={() => navigate('/app/upload')}
              style={{
                padding: '0.875rem 2rem',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📤 Go to Upload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Create Marketplace Listings</h1>
        <p>Convert your mapped products into active marketplace listings</p>
      </div>

      <div style={{
        padding: '1rem',
        background: '#e0f2fe',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <strong style={{ color: '#0369a1' }}>
          {mappedProducts.length} product{mappedProducts.length !== 1 ? 's' : ''} ready to list
        </strong>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Product List */}
        <div style={{ flex: 1 }}>
          <h2>Your Mapped Products</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {mappedProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
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
                <strong style={{ color: '#0f172a' }}>
                  {product.artikelbezeichnung}
                </strong>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                  {product.marke && <span>Brand: {product.marke} • </span>}
                  {product.artikelnummer && <span>SKU: {product.artikelnummer}</span>}
                </div>
                {product.mapping && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#059669',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#d1fae5',
                    borderRadius: '6px'
                  }}>
                    ✅ Mapped to: {product.mapping.canonicalProduct.canonicalName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Listing Form */}
        <div style={{ flex: 1 }}>
          <h2>Create Listing</h2>

          {!selectedProduct ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
              <p>Select a product to create a listing</p>
            </div>
          ) : (
            <form onSubmit={createListing}>
              <div style={{
                padding: '1rem',
                background: '#e0f2fe',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                  <strong>Product:</strong> {selectedProduct.artikelbezeichnung}
                </p>
                {selectedProduct.mapping && (
                  <p style={{ fontSize: '0.85rem', color: '#0369a1', margin: 0 }}>
                    <strong>Canonical:</strong> {selectedProduct.mapping.canonicalProduct.canonicalName}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Available Quantity *</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  required
                />
                <small>How many units do you want to sell?</small>
              </div>

              <div className="form-group">
                <label htmlFor="baseUnit">Unit *</label>
                <select
                  id="baseUnit"
                  value={baseUnit}
                  onChange={(e) => setBaseUnit(e.target.value)}
                  required
                >
                  <option value="Stück">Stück</option>
                  <option value="Box">Box</option>
                  <option value="Pack">Pack</option>
                  <option value="Set">Set</option>
                  <option value="Rolle">Rolle</option>
                  <option value="Dose">Dose</option>
                  <option value="Tuch">Tuch</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price per Unit *</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  required
                />
                <small>Price in {currency}</small>
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency *</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="CHF">CHF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date (Optional)</label>
                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <small>Leave blank if no expiry</small>
              </div>

              <div className="form-group">
                <label htmlFor="lotNumber">Lot Number (Optional)</label>
                <input
                  id="lotNumber"
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="e.g., LOT12345678"
                />
                <small>Batch/lot identification</small>
              </div>

              <div style={{
                padding: '1.25rem',
                background: '#d1fae5',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#065f46',
                  margin: 0
                }}>
                  Total Value: {(quantity * price).toFixed(2)} {currency}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#047857',
                  marginTop: '0.5rem',
                  marginBottom: 0
                }}>
                  {quantity} {baseUnit} × {price} {currency}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedProduct}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {loading ? 'Creating Listing...' : '✅ Create & Activate Listing'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/app/dashboard')}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'white',
                  color: '#0ea5e9',
                  border: '2px solid #0ea5e9',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.75rem'
                }}
              >
                📊 View Dashboard
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}