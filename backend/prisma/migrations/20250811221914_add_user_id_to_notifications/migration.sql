/*
  Warnings:

  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add column as nullable first
ALTER TABLE "public"."notifications" ADD COLUMN "user_id" UUID;

-- Step 2: Update existing notifications to assign them to the first available user (Ivan)
UPDATE "public"."notifications" 
SET "user_id" = (SELECT id FROM "public"."users" WHERE email = 'ivan.alberton@navi.inf.br' LIMIT 1)
WHERE "user_id" IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE "public"."notifications" ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "public"."notifications"("user_id");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
