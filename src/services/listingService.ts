import { prisma } from '../utils/db';
import { CreateListingInput } from '../types';

export async function createListing(sellerId: string, input: CreateListingInput) {
  const rawProduct = await prisma.rawProduct.findUnique({
    where: { id: input.rawProductId },
    include: { mapping: true }
  });

  if (!rawProduct) throw new Error('Raw product not found');
  if (!rawProduct.mapping) throw new Error('Product must be mapped first');
  if (rawProduct.hospitalId !== sellerId) throw new Error('Can only create listings for own products');

  return await prisma.listing.create({
    data: {
      sellerId,
      canonicalProductId: rawProduct.mapping.canonicalProductId,
      lotNumber: input.lotNumber || null,
      expiryDate: input.expiryDate || null,
      availableQuantity: input.availableQuantity,
      baseUnit: rawProduct.basismengeneinheit || 'Stück',
      pricePerUnit: input.pricePerUnit,
      currency: input.currency,
      status: 'DRAFT'
    },
    include: { canonicalProduct: true }
  });
}

export async function activateListing(listingId: string, sellerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (listing.sellerId !== sellerId) throw new Error('Can only activate own listings');
  if (listing.status !== 'DRAFT') throw new Error('Can only activate draft listings');
  if (listing.availableQuantity <= 0) throw new Error('Quantity must be > 0');
  if (listing.expiryDate && listing.expiryDate < new Date()) throw new Error('Cannot activate expired product');

  return await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'ACTIVE', activatedAt: new Date() }
  });
}

export async function updateListing(listingId: string, sellerId: string, updates: any) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (listing.sellerId !== sellerId) throw new Error('Can only update own listings');
  if (['SOLD', 'EXPIRED'].includes(listing.status)) throw new Error('Cannot update sold/expired listings');

  return await prisma.listing.update({ where: { id: listingId }, data: updates });
}

export async function getSellerListings(sellerId: string, filters?: { status?: string }) {
  const where: any = { sellerId };
  if (filters?.status) where.status = filters.status;

  return await prisma.listing.findMany({
    where,
    include: {
      canonicalProduct: true,
      _count: { select: { reservations: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function markExpiredListings() {
  const result = await prisma.listing.updateMany({
    where: { status: 'ACTIVE', expiryDate: { lt: new Date() } },
    data: { status: 'EXPIRED' }
  });
  return result.count;
}
