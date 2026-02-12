import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthRequest extends express.Request {
  user?: { hospitalId: string; name: string; email: string };
}

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    console.log('📊 Loading dashboard for hospital:', hospitalId);

    // 1. Get all listings for this hospital
    const myListings = await prisma.listing.findMany({
      where: { hospitalId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${myListings.length} listings`);

    // 2. Calculate expiring items
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringItems = myListings.filter(
      listing => listing.expiryDate && listing.expiryDate <= ninetyDaysFromNow
    );
    
    const criticalExpiringItems = myListings.filter(
      listing => listing.expiryDate && listing.expiryDate <= thirtyDaysFromNow
    );

    // 3. Get reservations (as buyer) - FIXED: only select fields that exist
    const reservationsBuyer = await prisma.reservation.findMany({
      where: { 
        buyerId: hospitalId,
        status: { in: ['pending', 'confirmed'] }
      },
      include: {
        listing: {
          include: {
            product: true,
            hospital: { 
              select: { 
                name: true,
                address: true  // ✅ Changed from city
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Get reservations (as seller) - FIXED: only select fields that exist
    const reservationsSeller = await prisma.reservation.findMany({
      where: { 
        sellerId: hospitalId,
        status: { in: ['pending', 'confirmed'] }
      },
      include: {
        listing: {
          include: {
            product: true
          }
        },
        buyer: { 
          select: { 
            name: true,
            address: true  // ✅ Changed from city
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pendingReservations = reservationsSeller.filter(r => r.status === 'pending');

    // 5. Calculate metrics
    const activeListings = myListings.filter(l => l.status === 'available').length;
    const soldItems = myListings.filter(l => l.status === 'sold').length;

    // 6. Calculate revenue/spending
    const confirmedSales = reservationsSeller.filter(r => r.status === 'confirmed');
    const totalRevenue = confirmedSales.reduce(
      (sum, res) => sum + (res.quantity * res.listing.pricePerUnit),
      0
    );

    const confirmedPurchases = reservationsBuyer.filter(r => r.status === 'confirmed');
    const totalSpending = confirmedPurchases.reduce(
      (sum, res) => sum + (res.quantity * res.listing.pricePerUnit),
      0
    );

    // 7. Format response
    res.json({
      success: true,
      data: {
        hospital: req.user?.name || 'Hospital',
        
        metrics: {
          totalListings: myListings.length,
          draftListings: 0,
          activeListings,
          soldItems,
          pendingReview: 0,
          ordersPlaced: reservationsBuyer.length,
          ordersReceived: reservationsSeller.length,
          pendingReservations: pendingReservations.length,
          expiringItems: expiringItems.length,
          criticalExpiringItems: criticalExpiringItems.length,
          totalRevenue,
          totalSpending,
          currency: 'CHF'
        },
        
        myListings: myListings.map(listing => ({
          id: listing.id,
          canonicalProduct: {
            canonicalName: listing.product.name,
            manufacturer: 'Unknown',
            category: listing.product.category,
            regulatoryClass: 'I'
          },
          availableQuantity: listing.quantity,
          pricePerUnit: listing.pricePerUnit,
          currency: 'CHF',
          expiryDate: listing.expiryDate,
          lotNumber: null,
          status: listing.status,
          createdAt: listing.createdAt,
          expiryStatus: listing.expiryDate ? (
            listing.expiryDate <= thirtyDaysFromNow ? 'critical' :
            listing.expiryDate <= ninetyDaysFromNow ? 'warning' : 'ok'
          ) : null,
          daysUntilExpiry: listing.expiryDate ? 
            Math.floor((listing.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
            null
        })),
        
        attentionNeeded: {
          pendingReservations,
          criticalExpiringItems: myListings.filter(
            listing => listing.expiryDate && listing.expiryDate <= thirtyDaysFromNow
          )
        },
        
        ordersPlaced: reservationsBuyer.map(r => ({
          ...r,
          seller: {
            name: r.listing.hospital.name,
            city: r.listing.hospital.address  // ✅ Map address to city for frontend
          }
        })),
        
        ordersReceived: reservationsSeller.map(r => ({
          ...r,
          buyer: {
            name: r.buyer.name,
            city: r.buyer.address  // ✅ Map address to city for frontend
          }
        }))
      }
    });

    console.log('✅ Dashboard data sent successfully');

  } catch (error: any) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;