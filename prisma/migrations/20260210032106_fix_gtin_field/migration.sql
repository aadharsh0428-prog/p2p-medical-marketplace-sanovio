/*
  Warnings:

  - You are about to drop the column `gtinCanonical` on the `CanonicalProduct` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `activatedAt` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `Listing` table. All the data in the column will be lost.
  - The `status` column on the `Listing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `basismengeneinheit` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `basismengeneinheitenProBME` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `bestellmengeneinheit` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `ean` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `hospitalId` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `internalId` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `jahresmenge` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `mappingStatus` on the `RawProduct` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RawProduct` table. All the data in the column will be lost.
  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMapping` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gtin]` on the table `CanonicalProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[canonicalName,manufacturer]` on the table `CanonicalProduct` will be added. If there are existing duplicate values, this will fail.
  - Made the column `manufacturer` on table `CanonicalProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `CanonicalProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `regulatoryClass` on table `CanonicalProduct` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `hospitalId` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rowNumber` to the `RawProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_listingId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMapping" DROP CONSTRAINT "ProductMapping_canonicalProductId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMapping" DROP CONSTRAINT "ProductMapping_rawProductId_fkey";

-- DropForeignKey
ALTER TABLE "RawProduct" DROP CONSTRAINT "RawProduct_hospitalId_fkey";

-- DropIndex
DROP INDEX "CanonicalProduct_canonicalName_idx";

-- DropIndex
DROP INDEX "CanonicalProduct_gtinCanonical_key";

-- DropIndex
DROP INDEX "CanonicalProduct_manufacturer_idx";

-- DropIndex
DROP INDEX "Hospital_email_idx";

-- DropIndex
DROP INDEX "Hospital_name_idx";

-- DropIndex
DROP INDEX "Listing_canonicalProductId_idx";

-- DropIndex
DROP INDEX "Listing_sellerId_idx";

-- DropIndex
DROP INDEX "Listing_status_idx";

-- DropIndex
DROP INDEX "RawProduct_artikelnummer_idx";

-- DropIndex
DROP INDEX "RawProduct_gtin_idx";

-- DropIndex
DROP INDEX "RawProduct_hospitalId_uploadBatchId_idx";

-- DropIndex
DROP INDEX "RawProduct_mappingStatus_idx";

-- DropIndex
DROP INDEX "Reservation_expiresAt_status_idx";

-- DropIndex
DROP INDEX "Reservation_listingId_status_idx";

-- AlterTable
ALTER TABLE "CanonicalProduct" DROP COLUMN "gtinCanonical",
ADD COLUMN     "gtin" TEXT,
ADD COLUMN     "manufacturerSKU" TEXT,
ADD COLUMN     "searchVector" TEXT,
ALTER COLUMN "manufacturer" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "regulatoryClass" SET NOT NULL;

-- AlterTable
ALTER TABLE "Hospital" DROP COLUMN "passwordHash",
DROP COLUMN "postalCode",
DROP COLUMN "verified",
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "activatedAt",
DROP COLUMN "sellerId",
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "hospitalId" TEXT NOT NULL,
ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storageConditions" TEXT,
ALTER COLUMN "baseUnit" SET DEFAULT 'unit',
ALTER COLUMN "currency" SET DEFAULT 'CHF',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "RawProduct" DROP COLUMN "basismengeneinheit",
DROP COLUMN "basismengeneinheitenProBME",
DROP COLUMN "bestellmengeneinheit",
DROP COLUMN "ean",
DROP COLUMN "hospitalId",
DROP COLUMN "internalId",
DROP COLUMN "jahresmenge",
DROP COLUMN "mappingStatus",
DROP COLUMN "updatedAt",
ADD COLUMN     "canonicalProductId" TEXT,
ADD COLUMN     "chargennummer" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "matchStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "menge" INTEGER,
ADD COLUMN     "rowNumber" INTEGER NOT NULL,
ADD COLUMN     "verfallsdatum" TIMESTAMP(3),
ALTER COLUMN "artikelbezeichnung" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CHF',
ADD COLUMN     "pricePerUnit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "ProductMapping";

-- DropEnum
DROP TYPE "ListingStatus";

-- DropEnum
DROP TYPE "MappingMethod";

-- DropEnum
DROP TYPE "MappingStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ReservationStatus";

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalProduct_gtin_key" ON "CanonicalProduct"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalProduct_canonicalName_manufacturer_key" ON "CanonicalProduct"("canonicalName", "manufacturer");

-- AddForeignKey
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawProduct" ADD CONSTRAINT "RawProduct_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
