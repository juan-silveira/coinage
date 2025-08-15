-- Migration: Migrate global_role from users to user_clients
-- This migration moves the global_role field from the users table to the role field in user_clients table
-- This allows users to have different roles in different clients

-- Step 1: Add a temporary column to user_clients to store the role data
ALTER TABLE "user_clients" ADD COLUMN "temp_role" "UserRole";

-- Step 2: Update user_clients with the global_role from users
UPDATE "user_clients" 
SET "temp_role" = u."global_role"
FROM "users" u 
WHERE "user_clients"."user_id" = u."id";

-- Step 3: Update user_clients where temp_role is null (users without user_clients records)
-- For users that don't have user_clients records, we'll create them with the default client
-- First, let's identify the default client (assuming it's the first one or a specific one)
-- For now, we'll set a default role for these cases
UPDATE "user_clients" 
SET "temp_role" = 'USER'::"UserRole"
WHERE "temp_role" IS NULL;

-- Step 4: Drop the old client_role column and rename temp_role to role
ALTER TABLE "user_clients" DROP COLUMN "client_role";
ALTER TABLE "user_clients" RENAME COLUMN "temp_role" TO "role";

-- Step 5: Update the column mapping in the database
COMMENT ON COLUMN "user_clients"."role" IS 'Role of the user in this specific client';

-- Step 6: Remove the global_role column from users table
ALTER TABLE "users" DROP COLUMN "global_role";

-- Step 7: Update indexes
-- Drop old index
DROP INDEX IF EXISTS "idx_user_clients_role";

-- Create new index for the renamed column
CREATE INDEX "idx_user_clients_role" ON "user_clients"("role");

-- Drop old composite indexes that reference the old column name
DROP INDEX IF EXISTS "idx_user_clients_client_role";

-- Create new composite indexes with the renamed column
CREATE INDEX "idx_user_clients_client_role" ON "user_clients"("client_id", "role");

-- Step 8: Update any existing constraints or foreign keys if necessary
-- (This step is usually not needed for simple column renames)

-- Step 9: Clean up any orphaned user_clients records that might have been created
-- This is a safety measure to ensure data integrity
DELETE FROM "user_clients" 
WHERE "user_id" NOT IN (SELECT "id" FROM "users")
   OR "client_id" NOT IN (SELECT "id" FROM "clients");

-- Step 10: Ensure all users have at least one user_client record
-- This is important for the new role-based system
INSERT INTO "user_clients" ("id", "user_id", "client_id", "status", "role", "linked_at", "permissions", "created_at", "updated_at")
SELECT 
    gen_random_uuid(),
    u."id",
    c."id",
    'active'::"UserClientStatus",
    'USER'::"UserRole",
    u."created_at",
    '{}'::jsonb,
    NOW(),
    NOW()
FROM "users" u
CROSS JOIN "clients" c
WHERE NOT EXISTS (
    SELECT 1 FROM "user_clients" uc 
    WHERE uc."user_id" = u."id" AND uc."client_id" = c."id"
)
AND u."is_active" = true
AND c."is_active" = true;

-- Step 11: Update the updated_at timestamp for all affected records
UPDATE "user_clients" SET "updated_at" = NOW() WHERE "updated_at" < NOW();
