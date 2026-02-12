import { prisma } from '../utils/db';
import { RawProductData } from '../types';

export async function processUpload(hospitalId: string, products: RawProductData[]) {
  const batchId = `batch_${Date.now()}_${hospitalId}`;
  const errors: string[] = [];
  const createdProducts: string[] = [];

  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) throw new Error(`Hospital ${hospitalId} not found`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.artikelbezeichnung) {
      errors.push(`Row ${i + 1}: Missing Artikelbezeichnung`);
      continue;
    }
    if (!product.artikelnummer && !product.gtin) {
      errors.push(`Row ${i + 1}: Missing Artikelnummer and GTIN`);
      continue;
    }
    if (!product.nettoZielpreis) {
      errors.push(`Row ${i + 1}: Missing Netto-Zielpreis`);
      continue;
    }

    try {
      const rawProduct = await prisma.rawProduct.create({
        data: {
          hospitalId, uploadBatchId: batchId, ...product, mappingStatus: 'PENDING'
        }
      });
      createdProducts.push(rawProduct.id);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }

  return { batchId, productIds: createdProducts, errors };
}

export async function getUploadBatch(batchId: string) {
  return await prisma.rawProduct.findMany({
    where: { uploadBatchId: batchId },
    include: { mapping: { include: { canonicalProduct: true } } },
    orderBy: { createdAt: 'asc' }
  });
}

export async function getHospitalBatches(hospitalId: string) {
  const batches = await prisma.rawProduct.groupBy({
    by: ['uploadBatchId'],
    where: { hospitalId },
    _count: { id: true },
    _min: { createdAt: true }
  });
  return batches.map(b => ({
    batchId: b.uploadBatchId,
    productCount: b._count.id,
    uploadedAt: b._min.createdAt
  }));
}
