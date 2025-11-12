-- AlterTable
ALTER TABLE "asset" ADD COLUMN     "compliance_summary" TEXT,
ADD COLUMN     "suggested_next_action" TEXT;

-- DropEnum
DROP TYPE "DeviceType";

-- DropEnum
DROP TYPE "Grade";
