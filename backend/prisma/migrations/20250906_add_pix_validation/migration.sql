-- AlterTable: Add pix_validation column to user_taxes table
ALTER TABLE "user_taxes" ADD COLUMN IF NOT EXISTS "pix_validation" DOUBLE PRECISION DEFAULT 1.0;