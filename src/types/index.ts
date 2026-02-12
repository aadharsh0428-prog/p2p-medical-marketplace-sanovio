export interface RawProductData {
  internalId?: string;
  artikelbezeichnung: string;
  marke?: string;
  artikelnummer?: string;
  jahresmenge?: number;
  bestellmengeneinheit?: string;
  basismengeneinheitenProBME?: number;
  basismengeneinheit?: string;
  gtin?: string;
  ean?: string;
  mdrKlasse?: string;
  nettoZielpreis?: number;
  waehrung?: string;
}

export interface MappingSuggestion {
  canonicalProductId: string;
  canonicalName: string;
  manufacturer?: string;
  confidence: number;
  method: 'GTIN' | 'SKU' | 'SYNONYM' | 'SEMANTIC';
  matchedOn?: string;
}

export interface CreateListingInput {
  rawProductId: string;
  lotNumber?: string;
  expiryDate?: Date;
  availableQuantity: number;
  pricePerUnit: number;
  currency: string;
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

export interface ReservationRequest {
  listingId: string;
  quantity: number;
}

export interface CheckoutRequest {
  reservationId: string;
  paymentMethod: string;
}
