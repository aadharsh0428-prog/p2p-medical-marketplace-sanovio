import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CanonicalProduct table...');

  const products = [
    {
      canonicalName: 'Nitrilhandschuh Sensicare Ice blau L',
      manufacturer: 'Medline',
      category: 'Schutzkleidung',
      regulatoryClass: 'I',
      gtinCanonical: '04046719012345'
    },
    {
      canonicalName: 'Verbandstoff-Wundversorgung-Set steril',
      manufacturer: 'Hartmann',
      category: 'Wundversorgung',
      regulatoryClass: 'IIa',
      gtinCanonical: '04046719098765'
    },
    {
      canonicalName: 'Einmalspritze 10 ml Luer-Lock steril',
      manufacturer: 'B. Braun',
      category: 'Spritzen',
      regulatoryClass: 'IIa',
      gtinCanonical: '04040456781234'
    },
    {
      canonicalName: 'Infusionsbesteck Intrafix Safe',
      manufacturer: 'B. Braun',
      category: 'Infusion',
      regulatoryClass: 'IIa',
      gtinCanonical: '04040456783456'
    },
    {
      canonicalName: 'OP-Maske mit Bindebändern',
      manufacturer: 'Hartmann',
      category: 'Schutzausrüstung',
      regulatoryClass: 'I',
      gtinCanonical: '04046719111223'
    },
    {
      canonicalName: 'Kanüle Sterican 0,8 × 40 mm',
      manufacturer: 'B. Braun',
      category: 'Nadeln',
      regulatoryClass: 'IIa',
      gtinCanonical: '04040456999887'
    },
    {
      canonicalName: 'Desinfektionstücher Mikrozid AF',
      manufacturer: 'Schülke',
      category: 'Desinfektion',
      regulatoryClass: 'IIa',
      gtinCanonical: '04012345001234'
    },
    {
      canonicalName: 'Einmalhandschuh Latex puderfrei M',
      manufacturer: 'Ansell',
      category: 'Schutzkleidung',
      regulatoryClass: 'I',
      gtinCanonical: '05010023456789'
    },
    {
      canonicalName: 'Urinbecher 100 ml steril',
      manufacturer: 'Sarstedt',
      category: 'Diagnostik',
      regulatoryClass: 'I',
      gtinCanonical: '04012345678901'
    },
    {
      canonicalName: 'Wundpflaster elastic 6 cm × 5 m',
      manufacturer: 'Hartmann',
      category: 'Wundversorgung',
      regulatoryClass: 'I',
      gtinCanonical: '04046719222334'
    },
    {
      canonicalName: 'Surgical Blade Handle #3 Stainless',
      manufacturer: 'Swann-Morton',
      category: 'Surgical Instruments',
      regulatoryClass: 'I',
      gtinCanonical: '05012345678900'
    },
    {
      canonicalName: 'Umbilical Cord Clamp Sterile',
      manufacturer: 'Medline',
      category: 'Obstetrics',
      regulatoryClass: 'I',
      gtinCanonical: '04046719333445'
    }
  ];

  for (const product of products) {
    await prisma.canonicalProduct.upsert({
      where: { gtinCanonical: product.gtinCanonical },
      update: {},
      create: product
    });
  }

  console.log(`✅ Seeded ${products.length} canonical products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
