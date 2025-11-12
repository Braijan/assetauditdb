-- Remove unnecessary fields from asset table
ALTER TABLE "asset" DROP COLUMN IF EXISTS "device_type";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "form_factor";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "received_date";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "grade";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "weight_kg";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "purchase_cost";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "compliance_summary";
ALTER TABLE "asset" DROP COLUMN IF EXISTS "suggested_next_action";

-- Drop unused enums if they're not used elsewhere
-- Note: DeviceType and Grade enums are removed from schema but may still exist in DB
-- They will be cleaned up if not referenced by other tables
