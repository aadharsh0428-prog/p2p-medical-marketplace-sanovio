import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET /api/search - Search marketplace listings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      query, 
      category, 
      manufacturer,
      minPrice, 
      maxPrice, 
      regulatoryClass,
      excludeMyListings 
    } = req.query;
    
    const hospitalId = req.user?.hospitalId;

    console.log('🔍 Search request:', { 
      query, 
      category, 
      manufacturer, 
      hospitalId,
      excludeMyListings 
    });

    // Build where clause
    const where: any = {
      status: 'available'
    };

    // Exclude own listings (default: true)
    if (excludeMyListings !== 'false' && hospitalId) {
      where.hospitalId = { not: hospitalId };
      console.log('   Excluding own listings for hospital:', hospitalId);
    }

    // ✅ OR search logic (ANY keyword matches)
    if (query && typeof query === 'string' && query.trim().length > 0) {
      const searchTerm = query.trim();
      
      // Split search into keywords
      const keywords = searchTerm.split(/\s+/).filter(k => k.length > 0);
      
      console.log('   Search keywords:', keywords);
      
      // Build OR conditions for all keywords across all fields
      const orConditions = [];
      
      for (const keyword of keywords) {
        // Each keyword can match name, description, or GTIN
        orConditions.push(
          { 
            name: { 
              contains: keyword, 
              mode: 'insensitive' 
            } 
          },
          { 
            description: { 
              contains: keyword, 
              mode: 'insensitive' 
            } 
          },
          {
            gtin: {
              contains: keyword
            }
          }
        );
      }
      
      where.product = {
        OR: orConditions
      };
      
      console.log(`   Using OR logic: matching ANY of ${keywords.length} keyword(s)`);
    }

    // Filter by category
    if (category && typeof category === 'string') {
      where.product = {
        ...where.product,
        category: category
      };
      console.log('   Filter by category:', category);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.pricePerUnit = {};
      if (minPrice) {
        where.pricePerUnit.gte = parseFloat(minPrice as string);
        console.log('   Min price:', minPrice);
      }
      if (maxPrice) {
        where.pricePerUnit.lte = parseFloat(maxPrice as string);
        console.log('   Max price:', maxPrice);
      }
    }

    console.log('   Final where clause:', JSON.stringify(where, null, 2));

    // Execute search
    const listings = await prisma.listing.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            gtin: true,
            description: true,
            category: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            country: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    console.log(`✅ Found ${listings.length} listings`);

    // Transform data to match frontend expectations
    const transformedListings = listings.map(listing => ({
      id: listing.id,
      product: {
        name: listing.product.name,
        gtin: listing.product.gtin,
        description: listing.product.description,
        category: listing.product.category
      },
      hospital: {
        id: listing.hospital.id,
        name: listing.hospital.name,
        city: listing.hospital.address.split(',')[0]?.trim() || 'Unknown',
        country: listing.hospital.country
      },
      quantity: listing.quantity,
      pricePerUnit: listing.pricePerUnit,
      currency: 'CHF',
      baseUnit: 'unit',
      expiryDate: listing.expiryDate?.toISOString(),
      status: listing.status
    }));

    res.json({ 
      success: true, 
      data: transformedListings,
      count: transformedListings.length 
    });
  } catch (error: any) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET /api/search/filters - Get available filter options
router.get('/filters', async (req: AuthRequest, res) => {
  try {
    console.log('🔍 Fetching filter options...');

    // Get unique categories from products with available listings
    const categories = await prisma.product.findMany({
      where: {
        listings: {
          some: {
            status: 'available'
          }
        }
      },
      select: { category: true },
      distinct: ['category']
    });

    const filterData = {
      categories: categories.map(c => c.category).filter(Boolean).sort(),
      manufacturers: [],
      regulatoryClasses: []
    };

    console.log('✅ Filter options:', {
      categories: filterData.categories.length
    });

    res.json({
      success: true,
      data: filterData
    });
  } catch (error: any) {
    console.error('❌ Filters error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load filters',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET /api/search/listing/:listingId - Get listing details
router.get('/listing/:listingId', async (req: AuthRequest, res) => {
  try {
    const { listingId } = req.params;
    
    console.log('🔍 Fetching listing details:', listingId);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            gtin: true,
            description: true,
            category: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            country: true,
            email: true
          }
        }
      }
    });

    if (!listing) {
      console.log('❌ Listing not found:', listingId);
      return res.status(404).json({ 
        success: false, 
        error: 'Listing not found' 
      });
    }

    // Don't show inactive listings unless it's the owner
    if (listing.status !== 'available' && listing.hospitalId !== req.user?.hospitalId) {
      console.log('❌ Listing not active:', listingId);
      return res.status(404).json({ 
        success: false, 
        error: 'Listing not available' 
      });
    }

    console.log('✅ Listing found:', listing.product.name);

    // Transform to match frontend expectations
    const transformedListing = {
      id: listing.id,
      product: {
        name: listing.product.name,
        gtin: listing.product.gtin,
        description: listing.product.description,
        category: listing.product.category
      },
      hospital: {
        id: listing.hospital.id,
        name: listing.hospital.name,
        city: listing.hospital.address.split(',')[0]?.trim() || 'Unknown',
        country: listing.hospital.country,
        email: listing.hospital.email
      },
      quantity: listing.quantity,
      pricePerUnit: listing.pricePerUnit,
      currency: 'CHF',
      baseUnit: 'unit',
      expiryDate: listing.expiryDate?.toISOString(),
      status: listing.status
    };

    res.json({ 
      success: true, 
      data: transformedListing 
    });
  } catch (error: any) {
    console.error('❌ Get listing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load listing details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
