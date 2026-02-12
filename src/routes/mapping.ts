import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Generate mapping suggestions for a raw product
router.get('/suggestions/:rawProductId', async (req: AuthRequest, res) => {
  try {
    const { rawProductId } = req.params;
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const rawProduct = await prisma.rawProduct.findFirst({
      where: { 
        id: rawProductId,
        uploadBatch: {
          hospitalId: hospitalId
        }
      }
    });

    if (!rawProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const suggestions = [];

    // Strategy 1: Match by GTIN (highest confidence)
    if (rawProduct.gtin) {
      const gtinMatch = await prisma.canonicalProduct.findFirst({
        where: { gtin: rawProduct.gtin }
      });

      if (gtinMatch) {
        suggestions.push({
          canonicalProductId: gtinMatch.id,
          canonicalName: gtinMatch.canonicalName,
          manufacturer: gtinMatch.manufacturer,
          confidence: 0.95,
          method: 'GTIN',
          matchedOn: `Matched on GTIN: ${rawProduct.gtin}`
        });
      }
    }

    // Strategy 2: Match by name + manufacturer (medium confidence)
    if (rawProduct.artikelbezeichnung && rawProduct.marke) {
      const nameMatches = await prisma.canonicalProduct.findMany({
        where: {
          AND: [
            {
              canonicalName: {
                contains: rawProduct.artikelbezeichnung.substring(0, 30),
                mode: 'insensitive'
              }
            },
            {
              manufacturer: {
                contains: rawProduct.marke,
                mode: 'insensitive'
              }
            }
          ]
        },
        take: 3
      });

      for (const match of nameMatches) {
        if (suggestions.find(s => s.canonicalProductId === match.id)) continue;

        suggestions.push({
          canonicalProductId: match.id,
          canonicalName: match.canonicalName,
          manufacturer: match.manufacturer,
          confidence: 0.75,
          method: 'SYNONYM',
          matchedOn: `Matched on name similarity`
        });
      }
    }

    // Strategy 3: Match by name only (lower confidence)
    if (suggestions.length === 0 && rawProduct.artikelbezeichnung) {
      const nameOnlyMatches = await prisma.canonicalProduct.findMany({
        where: {
          canonicalName: {
            contains: rawProduct.artikelbezeichnung.substring(0, 30),
            mode: 'insensitive'
          }
        },
        take: 5
      });

      for (const match of nameOnlyMatches) {
        suggestions.push({
          canonicalProductId: match.id,
          canonicalName: match.canonicalName,
          manufacturer: match.manufacturer,
          confidence: 0.50,
          method: 'SEMANTIC',
          matchedOn: `Matched on name only`
        });
      }
    }

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('Mapping suggestions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Quick approve pending product (create draft listing)
router.post('/quick-approve/:rawProductId', async (req: AuthRequest, res) => {
  try {
    const { rawProductId } = req.params;
    const { canonicalProductId } = req.body;
    const hospitalId = req.user?.hospitalId;

    console.log('Quick approve request:', { rawProductId, canonicalProductId, hospitalId });

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!canonicalProductId) {
      return res.status(400).json({ success: false, error: 'canonicalProductId is required' });
    }

    // Verify raw product belongs to this hospital
    const rawProduct = await prisma.rawProduct.findFirst({
      where: { 
        id: rawProductId,
        uploadBatch: {
          hospitalId: hospitalId
        }
      }
    });

    if (!rawProduct) {
      return res.status(403).json({ success: false, error: 'Unauthorized or product not found' });
    }

    // Check if canonical product exists
    const canonicalProduct = await prisma.canonicalProduct.findUnique({
      where: { id: canonicalProductId }
    });

    if (!canonicalProduct) {
      return res.status(404).json({ success: false, error: 'Canonical product not found' });
    }

    // Check if listing already exists for this canonical product
    const existingListing = await prisma.listing.findFirst({
      where: {
        hospitalId: hospitalId,
        canonicalProductId: canonicalProductId,
        status: { in: ['DRAFT', 'ACTIVE'] }
      }
    });

    if (existingListing) {
      return res.status(409).json({ 
        success: false, 
        error: 'You already have a listing for this product' 
      });
    }

    // Create DRAFT listing
    const listing = await prisma.listing.create({
      data: {
        hospitalId: hospitalId,
        canonicalProductId: canonicalProductId,
        availableQuantity: rawProduct.menge || 1,
        pricePerUnit: rawProduct.nettoZielpreis || 0,
        currency: rawProduct.waehrung || 'CHF',
        baseUnit: 'Stück',
        status: 'DRAFT',
        expiryDate: rawProduct.verfallsdatum,
        lotNumber: rawProduct.chargennummer
      }
    });

    // Update raw product status
    await prisma.rawProduct.update({
      where: { id: rawProductId },
      data: { 
        matchStatus: 'MATCHED',
        canonicalProductId: canonicalProductId
      }
    });

    console.log('✅ Quick approve successful:', listing.id);

    res.json({ 
      success: true, 
      data: { 
        listing,
        message: 'Product approved and draft listing created'
      } 
    });
  } catch (error: any) {
    console.error('Quick approve error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Reject/skip pending product
router.post('/reject/:rawProductId', async (req: AuthRequest, res) => {
  try {
    const { rawProductId } = req.params;
    const { reason } = req.body;
    const hospitalId = req.user?.hospitalId;

    console.log('Reject product request:', { rawProductId, reason, hospitalId });

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Verify raw product belongs to this hospital
    const rawProduct = await prisma.rawProduct.findFirst({
      where: { 
        id: rawProductId,
        uploadBatch: {
          hospitalId: hospitalId
        }
      }
    });

    if (!rawProduct) {
      return res.status(403).json({ success: false, error: 'Unauthorized or product not found' });
    }

    // Update raw product status to REJECTED
    await prisma.rawProduct.update({
      where: { id: rawProductId },
      data: { 
        matchStatus: 'ERROR',
        errorMessage: reason || 'Rejected by user - no suitable match found'
      }
    });

    console.log('✅ Product rejected:', rawProductId);

    res.json({ 
      success: true, 
      message: 'Product rejected successfully'
    });
  } catch (error: any) {
    console.error('Reject product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/confirm a mapping
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { rawProductId, canonicalProductId, confidence, method } = req.body;
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!rawProductId || !canonicalProductId || confidence === undefined || !method) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Security: Verify user owns this raw product
    const rawProduct = await prisma.rawProduct.findFirst({
      where: { 
        id: rawProductId,
        uploadBatch: {
          hospitalId: hospitalId
        }
      }
    });

    if (!rawProduct) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Update raw product with matched canonical product
    await prisma.rawProduct.update({
      where: { id: rawProductId },
      data: { 
        matchStatus: 'MATCHED',
        canonicalProductId: canonicalProductId
      }
    });

    // Create listing directly
    const listing = await prisma.listing.create({
      data: {
        hospitalId: hospitalId,
        canonicalProductId: canonicalProductId,
        availableQuantity: rawProduct.menge || 1,
        pricePerUnit: rawProduct.nettoZielpreis || 0,
        currency: rawProduct.waehrung || 'CHF',
        baseUnit: 'Stück',
        status: 'DRAFT',
        expiryDate: rawProduct.verfallsdatum,
        lotNumber: rawProduct.chargennummer
      }
    });

    res.json({ success: true, data: { listing, rawProduct } });
  } catch (error: any) {
    console.error('Create mapping error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-map entire batch (best effort)
router.post('/batch/:batchId/auto-map', async (req: AuthRequest, res) => {
  try {
    const { batchId } = req.params;
    const hospitalId = req.user?.hospitalId;

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

    const products = await prisma.rawProduct.findMany({
      where: { 
        uploadBatchId: batchId,
        matchStatus: 'PENDING'
      }
    });

    let mapped = 0;
    let needsReview = 0;
    let failed = 0;

    for (const product of products) {
      try {
        let bestMatch = null;
        let confidence = 0;

        // Try GTIN match first
        if (product.gtin) {
          const gtinMatch = await prisma.canonicalProduct.findFirst({
            where: { gtin: product.gtin }
          });

          if (gtinMatch) {
            bestMatch = gtinMatch;
            confidence = 0.95;
          }
        }

        // Try name + manufacturer
        if (!bestMatch && product.artikelbezeichnung && product.marke) {
          const nameMatch = await prisma.canonicalProduct.findFirst({
            where: {
              AND: [
                {
                  canonicalName: {
                    contains: product.artikelbezeichnung.substring(0, 30),
                    mode: 'insensitive'
                  }
                },
                {
                  manufacturer: {
                    contains: product.marke,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          });

          if (nameMatch) {
            bestMatch = nameMatch;
            confidence = 0.75;
          }
        }

        if (bestMatch) {
          // Update raw product with match
          await prisma.rawProduct.update({
            where: { id: product.id },
            data: { 
              matchStatus: confidence >= 0.9 ? 'MATCHED' : 'NEEDS_REVIEW',
              canonicalProductId: bestMatch.id
            }
          });

          // Auto-create listing for high confidence matches
          if (confidence >= 0.9) {
            await prisma.listing.create({
              data: {
                hospitalId: hospitalId,
                canonicalProductId: bestMatch.id,
                availableQuantity: product.menge || 1,
                pricePerUnit: product.nettoZielpreis || 0,
                currency: product.waehrung || 'CHF',
                baseUnit: 'Stück',
                status: 'DRAFT',
                expiryDate: product.verfallsdatum,
                lotNumber: product.chargennummer
              }
            });
            mapped++;
          } else {
            needsReview++;
          }
        } else {
          await prisma.rawProduct.update({
            where: { id: product.id },
            data: { 
              matchStatus: 'ERROR',
              errorMessage: 'No matching canonical product found'
            }
          });
          failed++;
        }
      } catch (err) {
        console.error(`Error mapping product ${product.id}:`, err);
        await prisma.rawProduct.update({
          where: { id: product.id },
          data: { 
            matchStatus: 'ERROR',
            errorMessage: err instanceof Error ? err.message : 'Unknown error'
          }
        });
        failed++;
      }
    }

    res.json({ 
      success: true, 
      data: { 
        mapped, 
        needsReview, 
        failed,
        message: `Auto-mapped ${mapped} products. ${needsReview} need review. ${failed} failed.`
      } 
    });
  } catch (error: any) {
    console.error('Auto-map error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
