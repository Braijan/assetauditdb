-- CreateEnum
CREATE TYPE "OrgPartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'DOWNSTREAM', 'INTERNAL');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TECH', 'QA', 'AUDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('RECEIVED', 'IN_PROCESS', 'SANITIZED', 'READY_FOR_SALE', 'SCRAPPED', 'SHIPPED', 'DESTROYED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('LAPTOP', 'DESKTOP', 'SERVER', 'TABLET', 'PHONE', 'MONITOR', 'PRINTER', 'NETWORK_EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('SERIAL', 'CLIENT_TAG', 'INT_TAG', 'IMEI', 'MAC', 'UUID');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('TEST', 'REPAIR', 'SANITIZE', 'TEARDOWN');

-- CreateEnum
CREATE TYPE "COCEventType" AS ENUM ('RECEIVED', 'MOVED', 'SANITIZED', 'RELEASED', 'SHIPPED', 'DESTROYED');

-- CreateEnum
CREATE TYPE "SanitizationMethod" AS ENUM ('BLANCO', 'NIST_800_88_CLEAR', 'NIST_800_88_PURGE', 'PHYSICAL_DESTROY');

-- CreateEnum
CREATE TYPE "MaterialStream" AS ENUM ('ALUMINUM', 'COPPER', 'MIXED_PLASTICS', 'PCBS', 'STEEL', 'OTHER');

-- CreateEnum
CREATE TYPE "ShipmentDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "NCRSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "org_party" (
    "id" TEXT NOT NULL,
    "type" "OrgPartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "r2_scope" TEXT,
    "risk_tier" "RiskTier",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "org_party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "org_party_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_secure" BOOLEAN NOT NULL DEFAULT false,
    "gps_lat" DOUBLE PRECISION,
    "gps_lon" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "org_party_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "device_type" "DeviceType",
    "form_factor" TEXT,
    "received_date" TIMESTAMP(3),
    "current_status" "AssetStatus" NOT NULL DEFAULT 'RECEIVED',
    "grade" "Grade",
    "data_bearing_flag" BOOLEAN NOT NULL DEFAULT false,
    "hazmat_flag" BOOLEAN NOT NULL DEFAULT false,
    "current_location_id" TEXT,
    "weight_kg" DOUBLE PRECISION,
    "purchase_cost" DECIMAL(10,2),
    "resale_value" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_identifier" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "id_type" "IdentifierType" NOT NULL,
    "id_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_identifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_order" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "packing_list_num" TEXT,
    "total_weight_kg" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_line" (
    "id" TEXT NOT NULL,
    "intake_order_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight_kg" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "wo_type" "WorkOrderType" NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "tech_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_step" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "procedure_code" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "passed" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_of_custody_event" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "event_type" "COCEventType" NOT NULL,
    "event_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_location_id" TEXT,
    "to_location_id" TEXT,
    "performed_by" TEXT,
    "evidence_doc_id" TEXT,
    "signature_hash" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_of_custody_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_status_history" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "from_status" "AssetStatus",
    "to_status" "AssetStatus" NOT NULL,
    "changed_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "asset_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanitization_action" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "method" "SanitizationMethod" NOT NULL,
    "tool_name" TEXT,
    "tool_version" TEXT,
    "policy_rev" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "outcome" TEXT,
    "verifier" TEXT,
    "certificate_number" TEXT,
    "report_doc_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanitization_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanitization_result" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "action_id" TEXT,
    "passed" BOOLEAN NOT NULL,
    "verified_at" TIMESTAMP(3),
    "verifier_id" TEXT,
    "certificate_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanitization_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_result" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "procedure_code" TEXT NOT NULL,
    "metric" TEXT,
    "value" TEXT,
    "pass_flag" BOOLEAN NOT NULL,
    "tester_id" TEXT,
    "test_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "specs" TEXT,
    "data_bearing_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_component" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "removed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_lot" (
    "id" TEXT NOT NULL,
    "stream" "MaterialStream" NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "downstream_vendor_id" TEXT,
    "shipment_id" TEXT,
    "disposition_status" TEXT,
    "assay_results" TEXT,
    "recovery_percent" DOUBLE PRECISION,
    "coc_tracking" TEXT,
    "crt_tracking" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" TEXT NOT NULL,
    "direction" "ShipmentDirection" NOT NULL,
    "carrier" TEXT,
    "tracking_no" TEXT,
    "bol_number" TEXT,
    "pickup_ts" TIMESTAMP(3),
    "delivery_ts" TIMESTAMP(3),
    "origin_location_id" TEXT,
    "dest_location_id" TEXT,
    "manifest_doc_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_item" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "material_lot_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2),
    "status" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_line" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2),
    "total_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT,
    "issuedBy" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "certificate_number" TEXT,
    "document_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_party_certification" (
    "id" TEXT NOT NULL,
    "org_party_id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_party_certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downstream_vendor_approval" (
    "id" TEXT NOT NULL,
    "org_party_id" TEXT NOT NULL,
    "riskTier" "RiskTier" NOT NULL,
    "approved_materials" TEXT,
    "review_date" TIMESTAMP(3) NOT NULL,
    "next_review_date" TIMESTAMP(3),
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "downstream_vendor_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nonconformance" (
    "id" TEXT NOT NULL,
    "raised_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "requirement_ref" TEXT,
    "severity" "NCRSeverity" NOT NULL,
    "asset_id" TEXT,
    "description" TEXT NOT NULL,
    "root_cause" TEXT,
    "containment" TEXT,
    "raised_by_id" TEXT,
    "assigned_to_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nonconformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capa_action" (
    "id" TEXT NOT NULL,
    "ncr_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_id" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capa_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "checksum" TEXT,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_link" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_org_party_id_code_key" ON "location"("org_party_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_clerk_id_key" ON "user_account"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_identifier_id_type_id_value_key" ON "asset_identifier"("id_type", "id_value");

-- CreateIndex
CREATE UNIQUE INDEX "intake_order_order_number_key" ON "intake_order"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_order_number_key" ON "sales_order"("order_number");

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_org_party_id_fkey" FOREIGN KEY ("org_party_id") REFERENCES "org_party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_org_party_id_fkey" FOREIGN KEY ("org_party_id") REFERENCES "org_party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "org_party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_current_location_id_fkey" FOREIGN KEY ("current_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_identifier" ADD CONSTRAINT "asset_identifier_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_order" ADD CONSTRAINT "intake_order_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "org_party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_line" ADD CONSTRAINT "intake_line_intake_order_id_fkey" FOREIGN KEY ("intake_order_id") REFERENCES "intake_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_line" ADD CONSTRAINT "intake_line_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_step" ADD CONSTRAINT "work_order_step_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_evidence_doc_id_fkey" FOREIGN KEY ("evidence_doc_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_status_history" ADD CONSTRAINT "asset_status_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_status_history" ADD CONSTRAINT "asset_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanitization_action" ADD CONSTRAINT "sanitization_action_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanitization_action" ADD CONSTRAINT "sanitization_action_report_doc_id_fkey" FOREIGN KEY ("report_doc_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanitization_result" ADD CONSTRAINT "sanitization_result_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanitization_result" ADD CONSTRAINT "sanitization_result_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_tester_id_fkey" FOREIGN KEY ("tester_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_component" ADD CONSTRAINT "asset_component_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_component" ADD CONSTRAINT "asset_component_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lot" ADD CONSTRAINT "material_lot_downstream_vendor_id_fkey" FOREIGN KEY ("downstream_vendor_id") REFERENCES "org_party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lot" ADD CONSTRAINT "material_lot_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_origin_location_id_fkey" FOREIGN KEY ("origin_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_dest_location_id_fkey" FOREIGN KEY ("dest_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_manifest_doc_id_fkey" FOREIGN KEY ("manifest_doc_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_item" ADD CONSTRAINT "shipment_item_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_item" ADD CONSTRAINT "shipment_item_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_item" ADD CONSTRAINT "shipment_item_material_lot_id_fkey" FOREIGN KEY ("material_lot_id") REFERENCES "material_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "org_party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_line" ADD CONSTRAINT "sales_line_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_line" ADD CONSTRAINT "sales_line_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification" ADD CONSTRAINT "certification_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_party_certification" ADD CONSTRAINT "org_party_certification_org_party_id_fkey" FOREIGN KEY ("org_party_id") REFERENCES "org_party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_party_certification" ADD CONSTRAINT "org_party_certification_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downstream_vendor_approval" ADD CONSTRAINT "downstream_vendor_approval_org_party_id_fkey" FOREIGN KEY ("org_party_id") REFERENCES "org_party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance" ADD CONSTRAINT "nonconformance_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance" ADD CONSTRAINT "nonconformance_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance" ADD CONSTRAINT "nonconformance_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_action" ADD CONSTRAINT "capa_action_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "nonconformance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_action" ADD CONSTRAINT "capa_action_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_link" ADD CONSTRAINT "document_link_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
