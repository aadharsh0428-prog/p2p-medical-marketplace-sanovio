import { prisma } from '../utils/db';
import { rankByRelevance } from '../utils/similarity';
import { SearchFilters } from '../types';

export async function searchListings(filters: SearchFilters) {
  const where: any = {
    status: 'ACTIVE',
    availableQuantity: { gt: 0 }
  };

  // Exclude expired listings by default
  if (filters.excludeExpired !== false) {
    where.OR = [{ expiryDate: null }, { expiryDate: { gte: new Date() } }];
  }

  // Price filter
  if (filters.maxPrice) {
    where.pricePerUnit = { lte: filters.maxPrice };
  }

  // Quantity filter
  if (filters.minQuantity) {
    where.availableQuantity = { gte: filters.minQuantity };
  }

  // Exclude my hospital's listings (if hospitalId provided)
  if (filters.excludeHospitalId) {
    where.sellerId = { not: filters.excludeHospitalId };
  }

  // Canonical product filters (manufacturer, category, regulatory - keep these)
  const canonicalWhere: any = {};
  if (filters.manufacturer) {
    canonicalWhere.manufacturer = { contains: filters.manufacturer, mode: 'insensitive' };
  }
  if (filters.category) {
    canonicalWhere.category = { contains: filters.category, mode: 'insensitive' };
  }
  if (filters.regulatoryClass) {
    canonicalWhere.regulatoryClass = filters.regulatoryClass;
  }

  // ✅ REMOVED query filtering from database - do it in rankByRelevance instead
  // This allows multi-word "Umbilical Gloves" to match separate products

  if (Object.keys(canonicalWhere).length > 0) {
    where.canonicalProduct = canonicalWhere;
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      canonicalProduct: true,
      seller: { select: { id: true, name: true, city: true, country: true } }
    },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  // If no query, return all results
  if (!filters.query) {
    return listings;
  }

  // ✅ Rank ALL listings by relevance (multi-word support)
  const ranked = rankByRelevance(
    filters.query,
    listings.map(l => ({ 
      ...l, 
      canonicalName: l.canonicalProduct.canonicalName,
      manufacturer: l.canonicalProduct.manufacturer,
      category: l.canonicalProduct.category
    }))
  );

  // Return top 50 with any relevance score
  return ranked.filter(l => l.relevanceScore > 0).slice(0, 50);
}

export async function getListingDetails(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      canonicalProduct: true,
      seller: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          city: true, 
          country: true, 
          verified: true 
        } 
      }
    }
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  return listing;
}

export async function getAvailableQuantity(listingId: string): Promise<number> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { availableQuantity: true }
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }

  const reservations = await prisma.reservation.aggregate({
    where: { 
      listingId, 
      status: 'PENDING' 
    },
    _sum: { quantity: true }
  });

  const reserved = reservations._sum.quantity || 0;
  return Math.max(0, listing.availableQuantity - reserved);
}
