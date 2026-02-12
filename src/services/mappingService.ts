import { prisma } from '../utils/db';
import { calculateSemanticSimilarity } from '../utils/similarity';
import { MappingSuggestion } from '../types';
import { MappingMethod } from '@prisma/client';

export async function generateMappingSuggestions(rawProductId: string): Promise<MappingSuggestion[]> {
  const rawProduct = await prisma.rawProduct.findUnique({ where: { id: rawProductId } });
  if (!rawProduct) throw new Error('Raw product not found');

  const suggestions: MappingSuggestion[] = [];

  // Deterministic: GTIN match (highest confidence)
  if (rawProduct.gtin) {
    const match = await prisma.canonicalProduct.findFirst({ where: { gtinCanonical: rawProduct.gtin } });
    if (match) {
      suggestions.push({
        canonicalProductId: match.id,
        canonicalName: match.canonicalName,
        manufacturer: match.manufacturer || undefined,
        confidence: 0.99,
        method: 'GTIN',
        matchedOn: 'GTIN: ' + rawProduct.gtin
      });
    }
  }

  if (suggestions.length > 0) return suggestions;

  // Semantic matching
  const canonicalProducts = await prisma.canonicalProduct.findMany({
    select: { id: true, canonicalName: true, manufacturer: true, regulatoryClass: true }
  });

  let candidates = canonicalProducts;
  if (rawProduct.marke) {
    const manufacturerMatches = canonicalProducts.filter(
      p => p.manufacturer?.toLowerCase().includes(rawProduct.marke!.toLowerCase())
    );
    if (manufacturerMatches.length > 0) candidates = manufacturerMatches;
  }

  const semanticMatches = candidates.map(product => {
    const similarity = calculateSemanticSimilarity(rawProduct.artikelbezeichnung, product.canonicalName);
    let adjustedSimilarity = similarity;
    if (rawProduct.mdrKlasse && product.regulatoryClass === rawProduct.mdrKlasse) {
      adjustedSimilarity = Math.min(1.0, similarity + 0.1);
    }
    return {
      canonicalProductId: product.id,
      canonicalName: product.canonicalName,
      manufacturer: product.manufacturer || undefined,
      confidence: adjustedSimilarity,
      method: 'SEMANTIC' as MappingMethod,
      matchedOn: `Similarity: ${Math.round(similarity * 100)}%`
    };
  });

  return semanticMatches.filter(m => m.confidence >= 0.5).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

export async function createMapping(
  rawProductId: string,
  canonicalProductId: string,
  confidence: number,
  method: MappingMethod,
  autoConfirm: boolean = false
) {
  let mappingStatus: 'MAPPED' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW';
  let confirmedBySeller = false;

  if (confidence >= 0.9 || autoConfirm) {
    mappingStatus = 'MAPPED';
    confirmedBySeller = true;
  }

  await prisma.$transaction([
    prisma.productMapping.create({
      data: { rawProductId, canonicalProductId, confidence, method, confirmedBySeller }
    }),
    prisma.rawProduct.update({
      where: { id: rawProductId },
      data: { mappingStatus }
    })
  ]);
}

export async function confirmMapping(mappingId: string) {
  await prisma.$transaction(async (tx) => {
    const mapping = await tx.productMapping.update({
      where: { id: mappingId },
      data: { confirmedBySeller: true }
    });
    await tx.rawProduct.update({
      where: { id: mapping.rawProductId },
      data: { mappingStatus: 'MAPPED' }
    });
  });
}

export async function autoMapBatch(batchId: string) {
  const products = await prisma.rawProduct.findMany({
    where: { uploadBatchId: batchId, mappingStatus: 'PENDING' }
  });

  let autoMapped = 0, needsReview = 0, failed = 0;

  for (const product of products) {
    try {
      const suggestions = await generateMappingSuggestions(product.id);
      if (suggestions.length === 0) {
        await prisma.rawProduct.update({ where: { id: product.id }, data: { mappingStatus: 'FAILED' } });
        failed++;
        continue;
      }

      const bestMatch = suggestions[0];
      await createMapping(product.id, bestMatch.canonicalProductId, bestMatch.confidence, bestMatch.method as MappingMethod);

      if (bestMatch.confidence >= 0.9) autoMapped++;
      else needsReview++;
    } catch (error) {
      failed++;
    }
  }

  return { autoMapped, needsReview, failed };
}
