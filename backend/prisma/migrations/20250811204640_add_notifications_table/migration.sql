/*
  Warnings:

  - A unique constraint covering the columns `[alias]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."clients" ADD COLUMN     "alias" VARCHAR(50);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "sender" VARCHAR(50) NOT NULL DEFAULT 'coinage',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "read_date" TIMESTAMPTZ,
    "delete_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notifications_active" ON "public"."notifications"("is_active");

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_created" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_alias_key" ON "public"."clients"("alias");

-- CreateIndex
CREATE INDEX "idx_clients_alias" ON "public"."clients"("alias");
