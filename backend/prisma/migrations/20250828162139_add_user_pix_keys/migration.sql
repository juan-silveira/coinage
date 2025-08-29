-- CreateEnum
CREATE TYPE "public"."PixKeyType" AS ENUM ('cpf', 'email', 'phone', 'random');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('corrente', 'poupanca', 'pagamentos', 'salario');

-- CreateTable
CREATE TABLE "public"."user_pix_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key_type" "public"."PixKeyType" NOT NULL,
    "key_value" VARCHAR(255) NOT NULL,
    "bank_code" VARCHAR(10) NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "bank_logo" TEXT,
    "agency" VARCHAR(20) NOT NULL,
    "agency_digit" VARCHAR(2),
    "account_number" VARCHAR(20) NOT NULL,
    "account_digit" VARCHAR(2) NOT NULL,
    "account_type" "public"."AccountType" NOT NULL DEFAULT 'corrente',
    "holder_name" VARCHAR(255) NOT NULL,
    "holder_document" VARCHAR(20) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "verification_data" JSONB,
    "last_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pix_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_pix_keys_user_id" ON "public"."user_pix_keys"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_pix_keys_key_type_value" ON "public"."user_pix_keys"("key_type", "key_value");

-- CreateIndex
CREATE INDEX "idx_user_pix_keys_user_default" ON "public"."user_pix_keys"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "idx_user_pix_keys_active" ON "public"."user_pix_keys"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_pix_keys_key_type_key_value_key" ON "public"."user_pix_keys"("key_type", "key_value");

-- AddForeignKey
ALTER TABLE "public"."user_pix_keys" ADD CONSTRAINT "user_pix_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
