-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_notifications_favorite" ON "public"."notifications"("is_favorite");
