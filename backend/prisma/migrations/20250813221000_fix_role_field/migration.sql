-- Migration: Fix role field in user_clients table
-- This migration makes the role field required and sets default values for existing records

-- Step 1: Update any null role values to 'USER' (default)
UPDATE "user_clients" 
SET "role" = 'USER'::"UserRole" 
WHERE "role" IS NULL;

-- Step 2: Make the role column NOT NULL
ALTER TABLE "user_clients" ALTER COLUMN "role" SET NOT NULL;

-- Step 3: Ensure the default value is set
ALTER TABLE "user_clients" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";

-- Step 4: Update the column comment
COMMENT ON COLUMN "user_clients"."role" IS 'Role of the user in this specific client (required)';
