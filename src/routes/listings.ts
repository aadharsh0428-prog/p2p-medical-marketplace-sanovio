import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET /api/listings - Get my listings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const listings = await prisma.listing.findMany({
      where: { hospitalId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            gtin: true,
            description: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: listings });
  } catch (error: any) {
    console.error('❌ Get listings error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ PATCH /api/listings/:id/activate - Activate a draft listing
router.patch('/:id/activate', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user?.hospitalId;

    console.log('✅ Activating listing:', id);

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Check listing exists and belongs to hospital
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Update status to available
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { status: 'available' }
    });

    console.log('✅ Listing activated:', listing.product.name);

    res.json({ 
      success: true, 
      data: updatedListing,
      message: 'Listing activated successfully'
    });
  } catch (error: any) {
    console.error('❌ Activate listing error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ PATCH /api/listings/:id - Update listing
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user?.hospitalId;
    const { quantity, pricePerUnit, status } = req.body;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Check listing belongs to hospital
    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Update listing
    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (pricePerUnit !== undefined) updateData.pricePerUnit = pricePerUnit;
    if (status !== undefined) updateData.status = status;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: updatedListing });
  } catch (error: any) {
    console.error('❌ Update listing error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ DELETE /api/listings/:id - Delete listing
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Check listing belongs to hospital
    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Delete listing
    await prisma.listing.delete({
      where: { id }
    });

    console.log('✅ Listing deleted:', id);

    res.json({ success: true, message: 'Listing deleted' });
  } catch (error: any) {
    console.error('❌ Delete listing error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default router;
