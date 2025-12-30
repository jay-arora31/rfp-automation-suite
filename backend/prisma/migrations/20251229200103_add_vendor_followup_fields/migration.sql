-- AlterEnum
ALTER TYPE "RfpVendorStatus" ADD VALUE 'awaiting_details';

-- AlterTable
ALTER TABLE "rfp_vendors" ADD COLUMN     "email_thread_id" VARCHAR(255),
ADD COLUMN     "follow_up_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_follow_up_at" TIMESTAMPTZ(6),
ADD COLUMN     "missing_fields" JSONB;
