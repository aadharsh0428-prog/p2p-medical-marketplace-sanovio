import React, { useState } from 'react';
import { uploadAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);  // ✅ Prevent double-click
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStarted(false);  // Reset when new file selected
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Prevent multiple submissions
    if (loading || uploadStarted) {
      return;
    }

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Invalid file type. Please upload .xlsx, .xls, or .csv file');
      return;
    }

    setLoading(true);
    setUploadStarted(true);  // ✅ Mark as started

    try {
      const response = await uploadAPI.uploadProducts(file);
      const { count, autoMatched, needsReview, errors, warnings } = response.data.data;
      
      console.log('Upload response:', response.data);
      
      // ✅ Build detailed success message
      let message = `✅ Success! Processed ${count} product${count !== 1 ? 's' : ''}.\n\n`;
      
      if (autoMatched > 0) {
        message += `🎯 ${autoMatched} product${autoMatched !== 1 ? 's' : ''} auto-matched and created as DRAFT listings.\n\n`;
      }
      
      if (needsReview > 0) {
        message += `⚠️ ${needsReview} product${needsReview !== 1 ? 's' : ''} could not be auto-matched (no GTIN found in catalog).\n\n`;
      }
      
      if (warnings && warnings.length > 0) {
        message += `⚠️ ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}:\n`;
        warnings.slice(0, 5).forEach((w: string) => {
          message += `• ${w}\n`;
        });
        if (warnings.length > 5) {
          message += `... and ${warnings.length - 5} more warnings.\n`;
        }
        message += '\n';
      }
      
      if (errors && errors.length > 0) {
        message += `❌ ${errors.length} error${errors.length !== 1 ? 's' : ''}:\n`;
        errors.slice(0, 5).forEach((e: string) => {
          message += `• ${e}\n`;
        });
        if (errors.length > 5) {
          message += `... and ${errors.length - 5} more errors.\n`;
        }
        message += '\n';
        console.error('Upload errors:', errors);
      }
      
      message += '➡️ Go to Dashboard to review and activate your listings.';
      
      alert(message);
      
      // ✅ Navigate to dashboard
      navigate('/app/dashboard');
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Upload failed';
      alert(`Upload Error: ${errorMsg}`);
      console.error(error);
      setUploadStarted(false);  // ✅ Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Upload Hospital Inventory</h1>
        <p>Upload your ERP export (Excel/CSV) to create marketplace listings.</p>
      </div>

      <div className="search-container" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Excel File (.xlsx, .xls, .csv) *</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              required
              disabled={loading || uploadStarted}
            />
            {file && !uploadStarted && (
              <small style={{ color: '#10b981', marginTop: '0.5rem', display: 'block' }}>
                ✓ Selected: {file.name}
              </small>
            )}
            {uploadStarted && (
              <small style={{ color: '#f59e0b', marginTop: '0.5rem', display: 'block' }}>
                ⏳ Upload in progress... Please wait.
              </small>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || uploadStarted}
            style={{ 
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: (loading || uploadStarted) ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || uploadStarted) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || uploadStarted) ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            {loading || uploadStarted ? '⏳ Uploading & Processing...' : '📤 Upload & Create Listings'}
          </button>
        </form>

        {/* Validation info */}
        <div style={{
          marginTop: '2rem',
          padding: '1.25rem',
          background: '#fef3c7',
          borderRadius: '12px',
          border: '1px solid #fbbf24'
        }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400e', fontSize: '0.95rem' }}>
            ✅ Automatic Validation
          </h4>
          <ul style={{ 
            margin: 0,
            paddingLeft: '1.25rem',
            color: '#78350f',
            fontSize: '0.9rem',
            lineHeight: '1.7'
          }}>
            <li>Duplicate prevention (same file, same GTIN)</li>
            <li>Required fields check (name, price, quantity)</li>
            <li>Data format validation (numbers, dates, GTIN format)</li>
            <li>Business rules (positive prices, future expiry dates)</li>
            <li>Existing listing check (prevent duplicate GTINs)</li>
          </ul>
        </div>

        {/* How it works */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          background: '#f0f9ff',
          borderRadius: '12px',
          border: '1px solid #bae6fd'
        }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#0369a1', fontSize: '0.95rem' }}>
            📌 How Upload Works
          </h4>
          <ol style={{ 
            margin: 0,
            paddingLeft: '1.25rem',
            color: '#0c4a6e',
            fontSize: '0.9rem',
            lineHeight: '1.7'
          }}>
            <li><strong>Validate</strong> all rows (format, duplicates, business rules)</li>
            <li><strong>Match</strong> products by GTIN to catalog</li>
            <li><strong>Create</strong> DRAFT listings automatically for matched products</li>
            <li><strong>Review</strong> in Dashboard and activate listings</li>
            <li><strong>Searchable</strong> once activated!</li>
          </ol>
        </div>
      </div>

      <div style={{ 
        maxWidth: '700px', 
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#dbeafe',
        borderRadius: '12px',
        borderLeft: '4px solid #0ea5e9'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#0369a1', fontSize: '1.1rem' }}>
          📋 Required Excel Columns
        </h3>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          color: '#0c4a6e',
          fontSize: '0.95rem',
          lineHeight: '1.8'
        }}>
          <li>✅ <strong>Artikelbezeichnung</strong> (Product Name) - Required</li>
          <li>✅ <strong>GTIN</strong> or <strong>Artikelnummer</strong> - At least one required</li>
          <li>✅ <strong>Netto-Zielpreis</strong> (Price) - Required, must be &gt; 0</li>
          <li>✅ <strong>Menge</strong> (Quantity) - Required, must be &gt; 0</li>
          <li style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #bfdbfe' }}>
            🔶 <strong>Marke</strong>, <strong>MDR-Klasse</strong> (I, IIa, IIb, III), <strong>Währung</strong>, <strong>Verfallsdatum</strong>, <strong>Chargennummer</strong> - Optional
          </li>
        </ul>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#475569' }}>
          💡 <strong>Tip:</strong> Products with GTINs in our catalog are automatically matched. Invalid/expired dates are automatically skipped with warnings.
        </p>
      </div>
    </div>
  );
}
