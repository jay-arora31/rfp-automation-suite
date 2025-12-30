-- CreateEnum
CREATE TYPE "RfpStatus" AS ENUM ('draft', 'sent', 'evaluating', 'awarded', 'closed');

-- CreateEnum
CREATE TYPE "RfpVendorStatus" AS ENUM ('pending', 'sent', 'responded', 'declined');

-- CreateTable
CREATE TABLE "user_settings" (
    "id" SERIAL NOT NULL,
    "google_access_token" TEXT,
    "google_refresh_token" TEXT,
    "google_token_expiry" TIMESTAMPTZ(6),
    "connected_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "phone" VARCHAR(50),
    "category" VARCHAR(100),
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfps" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "raw_input" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "budget" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "deadline" DATE,
    "delivery_days" INTEGER,
    "payment_terms" VARCHAR(100),
    "warranty_terms" VARCHAR(255),
    "additional_terms" TEXT,
    "status" "RfpStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rfps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfp_vendors" (
    "id" SERIAL NOT NULL,
    "rfp_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "email_message_id" VARCHAR(255),
    "status" "RfpVendorStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rfp_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "rfp_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "raw_email" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "parsed_data" JSONB NOT NULL DEFAULT '{}',
    "total_price" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "delivery_days" INTEGER,
    "payment_terms" VARCHAR(100),
    "warranty_terms" VARCHAR(255),
    "ai_score" DECIMAL(3,2),
    "ai_summary" TEXT,
    "ai_analysis" JSONB,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" SERIAL NOT NULL,
    "proposal_id" INTEGER NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "specifications" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rfp_vendors_rfp_id_vendor_id_key" ON "rfp_vendors"("rfp_id", "vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_rfp_id_vendor_id_key" ON "proposals"("rfp_id", "vendor_id");

-- AddForeignKey
ALTER TABLE "rfp_vendors" ADD CONSTRAINT "rfp_vendors_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfp_vendors" ADD CONSTRAINT "rfp_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
