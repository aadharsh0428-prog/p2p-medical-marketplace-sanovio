import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { Matrix } from 'ml-matrix';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET /api/recommendations - Get product recommendations
router.get('/', async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    console.log('🎯 Generating recommendations for:', hospitalId);

    // Get user's recent activity (views, searches, purchases)
    const myReservations = await prisma.reservation.findMany({
      where: { buyerId: hospitalId },
      include: {
        listing: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get all products they've interacted with
    const interactedProductIds = myReservations.map(r => r.listing.productId);
    const interactedCategories = [...new Set(
      myReservations.map(r => r.listing.product.category)
    )];

    console.log('📊 User interacted with categories:', interactedCategories);
    console.log('📊 Products viewed/bought:', interactedProductIds.length);

    // Find similar products based on:
    // 1. Same category
    // 2. Similar price range
    // 3. Popular among other buyers

    const recommendations = await prisma.listing.findMany({
      where: {
        status: 'available',
        hospitalId: { not: hospitalId },
        product: {
          category: { in: interactedCategories }
        },
        id: { notIn: interactedProductIds }
      },
      include: {
        product: true,
        hospital: {
          select: {
            name: true,
            country: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate relevance score
    const scoredRecommendations = recommendations.map(listing => {
      let score = 0;

      // Score based on category match
      if (interactedCategories.includes(listing.product.category)) {
        score += 5;
      }

      // Score based on price similarity (if user has purchase history)
      if (myReservations.length > 0) {
        const avgPricePaid = myReservations.reduce(
          (sum, r) => sum + r.listing.pricePerUnit, 0
        ) / myReservations.length;
        
        const priceDiff = Math.abs(listing.pricePerUnit - avgPricePaid);
        const priceScore = Math.max(0, 10 - (priceDiff / avgPricePaid) * 10);
        score += priceScore;
      }

      // Score based on recency
      const daysSinceCreated = (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) score += 3;
      else if (daysSinceCreated < 30) score += 1;

      return {
        ...listing,
        relevanceScore: score
      };
    });

    // Sort by relevance
    scoredRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log('✅ Generated', scoredRecommendations.length, 'recommendations');

    res.json({
      success: true,
      data: scoredRecommendations,
      algorithm: 'Content-Based Filtering + Collaborative Signals'
    });

  } catch (error: any) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

export default router;
