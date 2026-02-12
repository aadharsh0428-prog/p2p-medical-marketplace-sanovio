// Frontend TypeScript Type Definitions

export interface RawProduct {
  id: string;
  artikelbezeichnung: string;
  marke?: string;
  artikelnummer?: string;
  gtin?: string;
  ean?: string;
  mdrKlasse?: string;
  nettoZielpreis?: number;
  waehrung?: string;
  mappingStatus: 'PENDING' | 'MAPPED' | 'NEEDS_REVIEW' | 'FAILED';
  mapping?: ProductMapping;
  createdAt: string;
}

export interface ProductMapping {
  id: string;
  canonicalProduct: CanonicalProduct;
  confidence: number;
  method: 'GTIN' | 'SKU' | 'SYNONYM' | 'SEMANTIC' | 'MANUAL';
  confirmedBySeller: boolean;
}

export interface CanonicalProduct {
  id: string;
  canonicalName: string;
  manufacturer?: string;
  category?: string;
  regulatoryClass?: string;
}

export interface MappingSuggestion {
  canonicalProductId: string;
  canonicalName: string;
  manufacturer?: string;
  confidence: number;
  method: string;
  matchedOn?: string;
}

export interface Listing {
  id: string;
  canonicalProduct: CanonicalProduct;
  availableQuantity: number;
  pricePerUnit: number;
  currency: string;
  expiryDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED';
  lotNumber?: string;
  baseUnit: string;
  seller: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  createdAt: string;
  activatedAt?: string;
}

export interface Reservation {
  id: string;
  listing: Listing;
  quantity: number;
  expiresAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

export interface SearchFilters {
  query?: string;
  manufacturer?: string;
  category?: string;
  regulatoryClass?: string;
  maxPrice?: number;
  minQuantity?: number;
  excludeExpired?: boolean;
}
