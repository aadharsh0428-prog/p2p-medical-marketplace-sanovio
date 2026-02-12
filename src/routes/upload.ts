import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ✅ VALIDATION HELPERS
const cleanString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseFloat_ = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
};

const parseInt_ = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(String(value).replace(/[^\d]/g, ''));
  return isNaN(parsed) ? null : parsed;
};

// ✅ VALIDATION FUNCTIONS
const validateGTIN = (gtin: string): boolean => {
  if (!gtin) return false;
  const cleaned = gtin.replace(/\s/g, '');
  return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleaned);
};

const validatePrice = (price: number | null): { valid: boolean; error?: string } => {
  if (price === null || price === undefined) {
    return { valid: false, error: 'Price is required' };
  }
  if (price <= 0) {
    return { valid: false, error: 'Price must be greater than 0' };
  }
  if (price > 1000000) {
    return { valid: false, error: 'Price seems unreasonably high (>1M)' };
  }
  return { valid: true };
};

const validateQuantity = (quantity: number | null): { valid: boolean; error?: string } => {
  if (quantity === null || quantity === undefined) {
    return { valid: false, error: 'Quantity is required' };
  }
  if (quantity <= 0) {
    return { valid: false, error: 'Quantity must be greater than 0' };
  }
  if (quantity > 1000000) {
    return { valid: false, error: 'Quantity seems unreasonably high (>1M)' };
  }
  if (!Number.isInteger(quantity)) {
    return { valid: false, error: 'Quantity must be a whole number' };
  }
  return { valid: true };
};

const validateExpiryDate = (date: Date | null): { valid: boolean; error?: string } => {
  if (!date) return { valid: true };
  
  const now = new Date();
  if (date < now) {
    return { valid: false, error: 'Expiry date is in the past' };
  }
  
  const tenYearsFromNow = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
  if (date > tenYearsFromNow) {
    return { valid: false, error: 'Expiry date is too far in future (>10 years)' };
  }
  
  return { valid: true };
};

// ✅ UPLOAD ENDPOINT
router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const file = req.file;

    console.log('\n📤 Upload request received');
    console.log('Hospital:', req.user?.name);
    console.log('File:', file?.originalname);

    if (!hospitalId) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated. Please login first.' 
      });
    }

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Parse Excel
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse Excel file. Ensure it is valid .xlsx/.xls/.csv format.'
      });
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Excel file has no sheets'
      });
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Parsed ${data.length} rows`);

    if (data.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Excel file is empty' 
      });
    }

    if (data.length > 1000) {
      return res.status(400).json({
        success: false,
        error: `Maximum 1000 products per upload. Your file has ${data.length} rows.`
      });
    }

    // ✅ FIXED: Check for duplicate file (use 'filename' not 'fileName')
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentBatch = await prisma.uploadBatch.findFirst({
      where: {
        hospitalId: hospitalId,
        filename: file.originalname,  // ✅ Changed from fileName
        uploadDate: { gte: fiveMinutesAgo }  // ✅ Changed from createdAt
      }
    });

    if (recentBatch) {
      return res.status(409).json({
        success: false,
        error: 'This file was already uploaded in the last 5 minutes. Please wait or rename the file.',
        batchId: recentBatch.id
      });
    }

    // ✅ FIXED: Create UploadBatch with correct field names
    const batch = await prisma.uploadBatch.create({
      data: {
        hospitalId,
        filename: file.originalname,  // ✅ Changed from fileName
        rowsProcessed: data.length,   // ✅ Changed from totalRows
        rowsSuccess: 0,               // ✅ Changed from successCount
        rowsFailed: 0                 // ✅ Changed from errorCount
      }
    });

    console.log(`📦 Created batch: ${batch.id}\n`);

    const createdListings = [];
    const errors = [];
    const warnings = [];
    const seenGTINs = new Set<string>();

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2;

      try {
        // Extract fields
        const name = cleanString(
          row.Artikelbezeichnung || row.artikelbezeichnung || row.name || row.productName
        );
        
        const gtin = cleanString(row.GTIN || row.gtin || row.ean || row.EAN) || null;
        const category = cleanString(row.Kategorie || row.category) || 'General';
        const price = parseFloat_(row['Netto-Zielpreis'] || row.nettoZielpreis || row.price);
        const quantity = parseInt_(row.Menge || row.menge || row.quantity);
        
        let expiryDate: Date | null = null;
        if (row.Verfallsdatum || row.expiryDate) {
          try {
            expiryDate = new Date(row.Verfallsdatum || row.expiryDate);
            if (isNaN(expiryDate.getTime())) {
              expiryDate = null;
            }
          } catch (e) {
            expiryDate = null;
          }
        }

        // Validate required fields
        if (!name || name.length === 0) {
          errors.push(`Row ${rowNum}: Missing product name`);
          continue;
        }

        const priceValidation = validatePrice(price);
        if (!priceValidation.valid) {
          errors.push(`Row ${rowNum}: ${priceValidation.error}`);
          continue;
        }

        const quantityValidation = validateQuantity(quantity);
        if (!quantityValidation.valid) {
          errors.push(`Row ${rowNum}: ${quantityValidation.error}`);
          continue;
        }

        if (gtin && !validateGTIN(gtin)) {
          warnings.push(`Row ${rowNum}: GTIN format may be invalid`);
        }

        const expiryValidation = validateExpiryDate(expiryDate);
        if (!expiryValidation.valid) {
          warnings.push(`Row ${rowNum}: ${expiryValidation.error}`);
          expiryDate = null;
        }

        // Check for duplicate GTIN in this batch
        if (gtin && seenGTINs.has(gtin)) {
          warnings.push(`Row ${rowNum}: Duplicate GTIN ${gtin} in this upload. Skipping.`);
          continue;
        }
        
        if (gtin) {
          seenGTINs.add(gtin);
        }

        console.log(`  ✅ Row ${rowNum}: ${name}`);

        // Find or create Product by GTIN
        let product = null;
        
        if (gtin) {
          product = await prisma.product.findUnique({
            where: { gtin: gtin }
          });
        }

        // If not found, create new product
        if (!product) {
          product = await prisma.product.create({
            data: {
              name,
              gtin: gtin || `NOGTIN-${Date.now()}-${i}`,
              description: category,
              category
            }
          });
        }

        // Create listing
        // ✅ CORRECT:
      const listing = await prisma.listing.create({
        data: {
          hospital: {
            connect: { id: hospitalId }  // ✅ Use connect instead of hospitalId
          },
          product: {
            connect: { id: product.id }  // ✅ Use connect instead of productId
          },
          quantity: quantity!,
          pricePerUnit: price!,
          expiryDate: expiryDate,
          status: 'draft'
        }
      });

        createdListings.push(listing);

      } catch (err) {
        const error = err as Error;
        console.error(`  ❌ Row ${rowNum}:`, error.message);
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    // Update batch
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: {
        rowsSuccess: createdListings.length,
        rowsFailed: errors.length
      }
    });

    console.log(`\n✅ Upload complete!`);
    console.log(`   Created: ${createdListings.length} listings`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}\n`);

    res.json({
      success: true,
      data: {
        batchId: batch.id,
        count: createdListings.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        warnings: warnings.length > 0 ? warnings.slice(0, 10) : undefined,
        message: `Successfully created ${createdListings.length} listing${createdListings.length !== 1 ? 's' : ''} from ${data.length} rows.`
      }
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ Upload error:', err);
    
    res.status(500).json({ 
      success: false,
      error: 'Server error during upload',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all batches
router.get('/batches', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const batches = await prisma.uploadBatch.findMany({
      where: { hospitalId },
      orderBy: { uploadDate: 'desc' }  // ✅ Changed from createdAt
    });

    res.json({ success: true, data: batches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products in a batch
router.get('/batches/:batchId', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const { batchId } = req.params;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const batch = await prisma.uploadBatch.findFirst({
      where: { 
        id: batchId,
        hospitalId
      }
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Your schema doesn't have rawProducts relation, so we can't fetch them
    // Return just the batch info
    res.json({ 
      success: true, 
      data: {
        batch,
        message: 'Products are converted to listings directly. Check dashboard for listings.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;