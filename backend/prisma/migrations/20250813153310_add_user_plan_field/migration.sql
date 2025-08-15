-- CreateEnum
CREATE TYPE "public"."UserPlan" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "user_plan" "public"."UserPlan" NOT NULL DEFAULT 'BASIC';

-- CreateIndex
CREATE INDEX "idx_users_user_plan" ON "public"."users"("user_plan");
