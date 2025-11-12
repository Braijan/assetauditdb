-- CreateEnum
CREATE TYPE "R2v3ComplianceStatus" AS ENUM ('COMPLIANT', 'PENDING', 'NONCOMPLIANT');

-- AlterTable
ALTER TABLE "asset" ADD COLUMN     "assigned_to_id" TEXT,
ADD COLUMN     "compliance_notes" TEXT,
ADD COLUMN     "compliance_summary" TEXT,
ADD COLUMN     "operating_system" TEXT,
ADD COLUMN     "processor" TEXT,
ADD COLUMN     "purchase_date" TIMESTAMP(3),
ADD COLUMN     "r2v3_compliance" "R2v3ComplianceStatus",
ADD COLUMN     "ram_size_gb" INTEGER,
ADD COLUMN     "screen_size_inches" DOUBLE PRECISION,
ADD COLUMN     "storage_capacity_gb" INTEGER,
ADD COLUMN     "storage_type" TEXT,
ADD COLUMN     "suggested_next_action" TEXT;

-- CreateTable
CREATE TABLE "hard_drive" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "capacity_gb" INTEGER,
    "value_usd" DECIMAL(10,2),
    "destruction_status" "R2v3ComplianceStatus",
    "destruction_certificate" TEXT,
    "destroyed_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hard_drive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hard_drive_asset_id_serial_number_key" ON "hard_drive"("asset_id", "serial_number");

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hard_drive" ADD CONSTRAINT "hard_drive_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hard_drive" ADD CONSTRAINT "hard_drive_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
