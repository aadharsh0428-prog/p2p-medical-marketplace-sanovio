import { prisma } from '../utils/db';
import { ReservationRequest } from '../types';

const RESERVATION_TIMEOUT_MINUTES = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || '15');

// CRITICAL: Anti-oversell logic with Serializable isolation
export async function createReservation(buyerId: string, request: ReservationRequest) {
  const { listingId, quantity } = request;
  if (quantity <= 0) throw new Error('Quantity must be > 0');

  return await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      include: { seller: true }
    });

    if (!listing) throw new Error('Listing not found');
    if (listing.sellerId === buyerId) throw new Error('Cannot purchase from own listing');
    if (listing.status !== 'ACTIVE') throw new Error(`Listing is ${listing.status}`);
    if (listing.expiryDate && listing.expiryDate < new Date()) throw new Error('Product expired');

    // Calculate available quantity accounting for active reservations
    const activeReservations = await tx.reservation.aggregate({
      where: { listingId, status: 'PENDING', expiresAt: { gt: new Date() } },
      _sum: { quantity: true }
    });

    const reservedQty = activeReservations._sum.quantity || 0;
    const availableQty = listing.availableQuantity - reservedQty;

    if (availableQty < quantity) {
      throw new Error(`Insufficient quantity. Available: ${availableQty}, Requested: ${quantity}`);
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TIMEOUT_MINUTES);

    const reservation = await tx.reservation.create({
      data: { listingId, buyerId, quantity, expiresAt, status: 'PENDING' },
      include: {
        listing: {
          include: {
            canonicalProduct: true,
            seller: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (reservedQty + quantity >= listing.availableQuantity) {
      await tx.listing.update({ where: { id: listingId }, data: { status: 'RESERVED' } });
    }

    return reservation;
  }, { isolationLevel: 'Serializable' });
}

export async function cancelReservation(reservationId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { listing: true }
    });
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.buyerId !== userId) throw new Error('Can only cancel own reservations');
    if (reservation.status !== 'PENDING') throw new Error('Can only cancel pending reservations');

    await tx.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } });

    if (reservation.listing.status === 'RESERVED') {
      const remaining = await tx.reservation.aggregate({
        where: { listingId: reservation.listingId, status: 'PENDING', id: { not: reservationId } },
        _sum: { quantity: true }
      });
      if ((remaining._sum.quantity || 0) < reservation.listing.availableQuantity) {
        await tx.listing.update({ where: { id: reservation.listingId }, data: { status: 'ACTIVE' } });
      }
    }
  });
}

export async function checkoutReservation(reservationId: string, paymentMethod: string = 'MOCK') {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { listing: true }
    });
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== 'PENDING') throw new Error('Reservation not pending');
    if (reservation.expiresAt < new Date()) {
      await tx.reservation.update({ where: { id: reservationId }, data: { status: 'EXPIRED' } });
      throw new Error('Reservation expired');
    }

    const subtotal = reservation.quantity * reservation.listing.pricePerUnit;
    const order = await tx.order.create({
      data: {
        buyerId: reservation.buyerId,
        reservationId: reservation.id,
        totalAmount: subtotal,
        currency: reservation.listing.currency,
        paymentMethod,
        paymentStatus: 'COMPLETED'
      }
    });

    await tx.orderItem.create({
      data: {
        orderId: order.id,
        listingId: reservation.listingId,
        quantity: reservation.quantity,
        pricePerUnit: reservation.listing.pricePerUnit,
        subtotal
      }
    });

    await tx.reservation.update({ where: { id: reservationId }, data: { status: 'CONFIRMED' } });

    const newQty = reservation.listing.availableQuantity - reservation.quantity;
    await tx.listing.update({
      where: { id: reservation.listingId },
      data: { availableQuantity: newQty, status: newQty === 0 ? 'SOLD' : 'ACTIVE' }
    });

    return order;
  });
}

export async function expireOldReservations() {
  const expired = await prisma.reservation.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    include: { listing: true }
  });

  for (const res of expired) {
    try {
      await cancelReservation(res.id, res.buyerId);
    } catch (err) {
      console.error(`Failed to expire reservation ${res.id}:`, err);
    }
  }
  return expired.length;
}

export async function getBuyerReservations(buyerId: string) {
  return await prisma.reservation.findMany({
    where: { buyerId },
    include: {
      listing: {
        include: {
          canonicalProduct: true,
          seller: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
