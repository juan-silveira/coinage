-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TransactionType" ADD VALUE 'deposit';
ALTER TYPE "public"."TransactionType" ADD VALUE 'withdraw';
ALTER TYPE "public"."TransactionType" ADD VALUE 'stake';
ALTER TYPE "public"."TransactionType" ADD VALUE 'unstake';
ALTER TYPE "public"."TransactionType" ADD VALUE 'exchange';
ALTER TYPE "public"."TransactionType" ADD VALUE 'stake_reward';
