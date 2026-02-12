import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'hospital123';

// ✅ Medical products with GTINs
const medicalProducts = [
  { name: 'Nitrilhandschuh Sensicare Ice blau L', manufacturer: 'Medline', category: 'PPE', class: 'I', basePrice: 0.019, gtin: '04046719012345' },
  { name: 'Verbandstoff-Wundversorgung-Set steril', manufacturer: 'Hartmann', category: 'Wound Care', class: 'IIa', basePrice: 0.580, gtin: '04046719098765' },
  { name: 'Einmalspritze 10 ml Luer-Lock steril', manufacturer: 'B. Braun', category: 'Syringes', class: 'IIa', basePrice: 0.120, gtin: '04040456781234' },
  { name: 'Infusionsbesteck Intrafix Safe', manufacturer: 'B. Braun', category: 'Infusion', class: 'IIa', basePrice: 1.350, gtin: '04040456783456' },
  { name: 'OP-Maske mit Bindebändern', manufacturer: 'Hartmann', category: 'PPE', class: 'I', basePrice: 0.080, gtin: '04046719111223' },
  { name: 'Kanüle Sterican 0,8 × 40 mm', manufacturer: 'B. Braun', category: 'Needles', class: 'IIa', basePrice: 0.060, gtin: '04040456999887' },
  { name: 'Desinfektionstücher Mikrozid AF', manufacturer: 'Schülke', category: 'Disinfection', class: 'IIa', basePrice: 3.950, gtin: '04012345001234' },
  { name: 'Einmalhandschuh Latex puderfrei M', manufacturer: 'Ansell', category: 'PPE', class: 'I', basePrice: 0.110, gtin: '05010023456789' },
  { name: 'Urinbecher 100 ml steril', manufacturer: 'Sarstedt', category: 'Diagnostics', class: 'I', basePrice: 0.040, gtin: '04012345678901' },
  { name: 'Wundpflaster elastic 6 cm × 5 m', manufacturer: 'Hartmann', category: 'Wound Care', class: 'I', basePrice: 1.750, gtin: '04046719222334' },
  { name: 'Surgical Gloves Sterile Size 7.5', manufacturer: 'Medline', category: 'PPE', class: 'I', basePrice: 0.250, gtin: '05012345600001' },
  { name: 'Sterile Gauze Swabs 10x10 cm', manufacturer: 'Hartmann', category: 'Wound Care', class: 'I', basePrice: 0.035, gtin: '04046719600002' },
  { name: 'IV Catheter 20G × 32mm', manufacturer: 'B. Braun', category: 'Catheters', class: 'IIb', basePrice: 0.890, gtin: '04040456600003' },
  { name: 'Blood Collection Tube EDTA 5ml', manufacturer: 'Sarstedt', category: 'Diagnostics', class: 'IIa', basePrice: 0.150, gtin: '04012345600004' },
  { name: 'Alcohol Swabs 70% Isopropyl', manufacturer: 'Schülke', category: 'Disinfection', class: 'I', basePrice: 0.015, gtin: '04012345600005' },
  { name: 'Surgical Drape Sterile 75x90 cm', manufacturer: 'Hartmann', category: 'OR Supplies', class: 'I', basePrice: 2.450, gtin: '04046719600006' },
  { name: 'Foley Catheter 2-way 16 Fr', manufacturer: 'Medline', category: 'Catheters', class: 'IIa', basePrice: 3.200, gtin: '05012345600007' },
  { name: 'ECG Electrodes Disposable Adult', manufacturer: '3M', category: 'Monitoring', class: 'IIa', basePrice: 0.180, gtin: '07612345600008' },
  { name: 'Oxygen Mask Adult with Tubing', manufacturer: 'Intersurgical', category: 'Respiratory', class: 'IIa', basePrice: 1.250, gtin: '05012345600009' },
  { name: 'Suture Vicryl 3-0 FS-2 75cm', manufacturer: 'Ethicon', category: 'Sutures', class: 'III', basePrice: 8.950, gtin: '03616345600010' },
  { name: 'Nasogastric Tube 12 Fr 125cm', manufacturer: 'B. Braun', category: 'Feeding Tubes', class: 'IIa', basePrice: 2.100, gtin: '04040456600011' },
  { name: 'Wound Closure Strips 6×75 mm', manufacturer: '3M', category: 'Wound Care', class: 'I', basePrice: 0.420, gtin: '07612345600012' },
  { name: 'Sterile Water for Irrigation 1000ml', manufacturer: 'B. Braun', category: 'Solutions', class: 'IIa', basePrice: 3.750, gtin: '04040456600013' },
  { name: 'Thermometer Digital Disposable', manufacturer: 'Omron', category: 'Diagnostics', class: 'IIa', basePrice: 1.850, gtin: '04015750600014' },
  { name: 'Surgical Scalpel Blade #10 Carbon Steel', manufacturer: 'Swann-Morton', category: 'Surgical', class: 'IIa', basePrice: 0.280, gtin: '05012345600015' },
  { name: 'Urine Drainage Bag 2000ml', manufacturer: 'Medline', category: 'Urology', class: 'IIa', basePrice: 2.350, gtin: '05012345600016' },
  { name: 'Wound Dressing Hydrocolloid 10×10 cm', manufacturer: 'ConvaTec', category: 'Wound Care', class: 'IIa', basePrice: 4.200, gtin: '07688345600017' },
  { name: 'Lancet Safety 21G 2.2mm Depth', manufacturer: 'Sarstedt', category: 'Diagnostics', class: 'IIa', basePrice: 0.095, gtin: '04012345600018' },
  { name: 'Sodium Chloride 0.9% 500ml Irrigation', manufacturer: 'B. Braun', category: 'Solutions', class: 'IIa', basePrice: 2.450, gtin: '04040456600019' },
  { name: 'Surgical Marker Pen Sterile Single-use', manufacturer: 'Viscot', category: 'Surgical', class: 'I', basePrice: 0.650, gtin: '06501234600020' },
  { name: 'Transparent Film Dressing 10×12 cm', manufacturer: '3M', category: 'Wound Care', class: 'I', basePrice: 0.880, gtin: '07612345600021' },
  { name: 'Endotracheal Tube Cuffed 7.5mm', manufacturer: 'Medtronic', category: 'Respiratory', class: 'IIb', basePrice: 4.950, gtin: '07684345600022' },
  { name: 'Blood Pressure Cuff Adult Disposable', manufacturer: 'Welch Allyn', category: 'Monitoring', class: 'IIa', basePrice: 3.150, gtin: '07884345600023' },
  { name: 'Surgical Blade Handle #3 Stainless', manufacturer: 'Swann-Morton', category: 'Surgical', class: 'I', basePrice: 12.500, gtin: '05012345678900' },
  { name: 'Umbilical Cord Clamp Sterile', manufacturer: 'Medline', category: 'Neonatal', class: 'IIa', basePrice: 0.350, gtin: '04046719333445' },
  { name: 'Adhesive Tape Medical Grade 2.5cm×5m', manufacturer: '3M', category: 'Wound Care', class: 'I', basePrice: 1.200, gtin: '07612345600025' },
  { name: 'Pulse Oximeter Finger Probe Disposable', manufacturer: 'Masimo', category: 'Monitoring', class: 'IIb', basePrice: 15.750, gtin: '08884345600026' },
  { name: 'Surgical Gown Sterile XXL', manufacturer: 'Hartmann', category: 'PPE', class: 'I', basePrice: 4.850, gtin: '04046719600027' },
  { name: 'Central Venous Catheter Kit 7Fr Triple', manufacturer: 'Arrow', category: 'Catheters', class: 'III', basePrice: 45.000, gtin: '07384345600028' },
  { name: 'Bone Marrow Biopsy Needle 11G', manufacturer: 'Medline', category: 'Biopsy', class: 'IIb', basePrice: 28.500, gtin: '05012345600029' },
  { name: 'Chest Drain Kit 28Fr with Trocar', manufacturer: 'Medtronic', category: 'Drainage', class: 'IIb', basePrice: 35.200, gtin: '07684345600030' },
  { name: 'Epidural Catheter Set 18G Tuohy', manufacturer: 'B. Braun', category: 'Anesthesia', class: 'IIb', basePrice: 22.750, gtin: '04040456600031' },
  { name: 'Spinal Needle 25G × 90mm Quincke', manufacturer: 'B. Braun', category: 'Anesthesia', class: 'IIb', basePrice: 3.850, gtin: '04040456600032' },
  { name: 'Bronchoscopy Brush Disposable 2mm', manufacturer: 'Olympus', category: 'Endoscopy', class: 'IIa', basePrice: 18.900, gtin: '04999345600033' },
  { name: 'Arterial Line Set Transducer 120cm', manufacturer: 'Edwards', category: 'Monitoring', class: 'IIb', basePrice: 24.500, gtin: '07314345600034' },
  { name: 'Tracheostomy Tube Cuffed 8.0mm', manufacturer: 'Medtronic', category: 'Respiratory', class: 'IIb', basePrice: 32.150, gtin: '07684345600035' },
  { name: 'PICC Line Single Lumen 4Fr 55cm', manufacturer: 'Bard', category: 'Catheters', class: 'III', basePrice: 48.750, gtin: '07884345600036' },
  { name: 'Laparoscopic Trocar 12mm Bladeless', manufacturer: 'Ethicon', category: 'Surgical', class: 'IIb', basePrice: 65.000, gtin: '03616345600037' },
  { name: 'Urinary Catheter Set 3-way 18Fr', manufacturer: 'Medline', category: 'Urology', class: 'IIa', basePrice: 8.950, gtin: '05012345600038' },
  { name: 'Nasopharyngeal Airway 7.0mm with Lubricant', manufacturer: 'Intersurgical', category: 'Respiratory', class: 'IIa', basePrice: 2.850, gtin: '05012345600039' }
];

const hospitals = [
  { name: 'Universitätsspital Zürich', city: 'Zürich', canton: 'ZH', contactPerson: 'Dr. Thomas Weber', licenseNumber: 'CH-HOSP-001' },
  { name: 'Universitätsspital Basel', city: 'Basel', canton: 'BS', contactPerson: 'Dr. Sarah Fischer', licenseNumber: 'CH-HOSP-002' },
  { name: 'CHUV Lausanne', city: 'Lausanne', canton: 'VD', contactPerson: 'Dr. Jean Martin', licenseNumber: 'CH-HOSP-003' },
  { name: 'Inselspital Bern', city: 'Bern', canton: 'BE', contactPerson: 'Dr. Anna Müller', licenseNumber: 'CH-HOSP-004' },
  { name: 'Kantonsspital St. Gallen', city: 'St. Gallen', canton: 'SG', contactPerson: 'Dr. Michael Schneider', licenseNumber: 'CH-HOSP-005' }
];

async function main() {
  console.log('🗑️  Clearing existing data...');

  // Clear in correct order (due to foreign keys)
  await prisma.reservation.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.hospital.deleteMany({});

  console.log('✅ Database cleared\n');

  // Hash password
  console.log('🔐 Hashing password...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log('✅ Password hashed\n');

  // Create products
  console.log('📦 Creating products with GTINs...');
  const createdProducts: Array<any> = [];

  for (const product of medicalProducts) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        gtin: product.gtin,
        description: `${product.manufacturer} - ${product.category} - Class ${product.class}`,
        category: product.category,
      }
    });
    createdProducts.push({ ...created, basePrice: product.basePrice });
  }

  console.log(`✅ Created ${createdProducts.length} products with GTINs\n`);

  // Create hospitals with listings
  console.log('🏥 Creating hospitals with listings...');
  const createdHospitals: Array<any> = [];

  for (let i = 0; i < hospitals.length; i++) {
    const hospitalData = hospitals[i];
    const cleanName = hospitalData.name.toLowerCase().replace(/[^a-z]/g, '');
    const email = `info@${cleanName}.ch`;

    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalData.name,
        email,
        passwordHash,
        address: `${hospitalData.city}, ${hospitalData.canton}`,
        country: 'Switzerland',
        phone: `+41 ${20 + i} 123 45 67`,
        contactPerson: hospitalData.contactPerson,
        licenseNumber: hospitalData.licenseNumber,
      }
    });

    createdHospitals.push({ id: hospital.id, name: hospital.name, email });

    // Create 3-6 random listings for each hospital
    const numListings = Math.floor(Math.random() * 4) + 3;
    const selectedProducts = createdProducts
      .slice()
      .sort(() => 0.5 - Math.random())
      .slice(0, numListings);

    for (const product of selectedProducts) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 180 + Math.floor(Math.random() * 365));

      await prisma.listing.create({
        data: {
          hospitalId: hospital.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 500) + 100,
          pricePerUnit: parseFloat((product.basePrice * (0.9 + Math.random() * 0.2)).toFixed(3)),
          expiryDate: expiryDate,
          status: 'available',
        }
      });
    }

    // Create upload batch record
    await prisma.uploadBatch.create({
      data: {
        hospitalId: hospital.id,
        filename: `${cleanName}_inventory_${new Date().toISOString().slice(0, 10)}.xlsx`,
        rowsProcessed: numListings,
        rowsSuccess: numListings,
        rowsFailed: 0,
      }
    });

    console.log(`  ✓ ${hospital.name} (${numListings} listings)`);
  }

  console.log('\n📊 DATABASE SUMMARY:');
  console.log('═'.repeat(70));
  console.log(`Hospitals: ${createdHospitals.length}`);
  console.log(`Products: ${createdProducts.length} (ALL with GTINs)`);
  console.log(`Active Listings: ${await prisma.listing.count()}`);
  console.log(`Upload Batches: ${await prisma.uploadBatch.count()}`);
  console.log('═'.repeat(70));
  console.log('\n🎯 READY FOR TESTING!\n');
  
  console.log('🏥 HOSPITAL LOGIN CREDENTIALS:\n');
  createdHospitals.forEach((h, i) => {
    console.log(`${i + 1}. ${h.name}`);
    console.log(`   Email: ${h.email}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Hospital ID: ${h.id}\n`);
  });
  
  console.log('═'.repeat(70));
  console.log('🔑 Default Password for ALL hospitals: ' + DEFAULT_PASSWORD);
  console.log('═'.repeat(70));
  console.log('\n🧪 TEST THE SYSTEM:');
  console.log('1. Login: POST /api/auth/login');
  console.log('2. Search: GET /api/marketplace/search?query=Nitril');
  console.log('3. Upload: POST /api/upload with Excel file');
  console.log('4. Dashboard: GET /api/dashboard\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
