import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Create reservation
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { listingId, quantity } = req.body;
    const buyerId = req.user?.hospitalId;

    console.log('📦 Creating reservation:', { listingId, quantity, buyerId });

    if (!buyerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!listingId || !quantity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        product: true,
        hospital: true
      }
    });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.hospitalId === buyerId) {
      return res.status(400).json({ success: false, error: 'Cannot buy your own listing' });
    }

    if (quantity > listing.quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Not enough quantity. Available: ${listing.quantity}` 
      });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Listing is not available' });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        buyerId: buyerId,
        sellerId: listing.hospitalId,
        listingId: listingId,
        quantity: quantity,
        status: 'pending'
      },
      include: {
        listing: {
          include: {
            product: true
          }
        }
      }
    });

    console.log('✅ Reservation created:', reservation.id);

    res.json({ success: true, data: reservation });
  } catch (error: any) {
    console.error('❌ Reservation error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ Get my reservations
router.get('/', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { buyerId: hospitalId },
          { sellerId: hospitalId }
        ]
      },
      include: {
        listing: {
          include: {
            product: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: reservations });
  } catch (error: any) {
    console.error('❌ Get reservations error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ Confirm reservation (complete purchase)
router.post('/:id/confirm', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user?.hospitalId;

    console.log('✅ Confirming reservation:', id);

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            product: true
          }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    if (reservation.buyerId !== hospitalId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Reservation already processed' });
    }

    // ✅ Transaction: Update reservation, decrease seller inventory, add to buyer inventory
    const result = await prisma.$transaction(async (tx) => {
      // 1. Confirm reservation
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: { status: 'confirmed' }
      });

      // 2. Decrease seller's inventory
      await tx.listing.update({
        where: { id: reservation.listingId },
        data: {
          quantity: {
            decrement: reservation.quantity
          }
        }
      });

      // 3. Add to buyer's inventory (optional - create new listing for buyer)
      const newListing = await tx.listing.create({
        data: {
          hospitalId: hospitalId,
          productId: reservation.listing.productId,
          quantity: reservation.quantity,
          pricePerUnit: reservation.listing.pricePerUnit,
          status: 'available',
          expiryDate: reservation.listing.expiryDate
        }
      });

      return { updatedReservation, newListing };
    });

    console.log('✅ Reservation confirmed:', id);
    console.log('✅ Added to buyer inventory:', result.newListing.id);

    res.json({ 
      success: true, 
      data: result.updatedReservation,
      message: 'Purchase complete! Product added to your inventory.'
    });
  } catch (error: any) {
    console.error('❌ Confirm error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ✅ Cancel reservation
router.post('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user?.hospitalId;

    console.log('❌ Canceling reservation:', id);

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Only buyer or seller can cancel
    if (reservation.buyerId !== hospitalId && reservation.sellerId !== hospitalId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    console.log('✅ Reservation cancelled:', id);

    res.json({ success: true, data: updatedReservation });
  } catch (error: any) {
    console.error('❌ Cancel error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default router;
