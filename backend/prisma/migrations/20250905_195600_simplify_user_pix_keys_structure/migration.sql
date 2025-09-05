/*
  Warnings:

  - You are about to drop the column `account_digit` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `account_number` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `account_type` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `agency` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `agency_digit` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `bank_code` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `bank_logo` on the `user_pix_keys` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `user_pix_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_pix_keys" DROP COLUMN "account_digit",
DROP COLUMN "account_number",
DROP COLUMN "account_type",
DROP COLUMN "agency",
DROP COLUMN "agency_digit",
DROP COLUMN "bank_code",
DROP COLUMN "bank_logo",
DROP COLUMN "bank_name";

-- Drop the AccountType enum as it's no longer used
DROP TYPE "AccountType";