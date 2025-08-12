-- CreateEnum
CREATE TYPE "public"."Network" AS ENUM ('mainnet', 'testnet');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('transfer', 'contract_deploy', 'contract_call', 'contract_read');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'APP_ADMIN');

-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('identity', 'address_proof', 'financial', 'contract', 'other');

-- CreateEnum
CREATE TYPE "public"."UserClientStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "public"."TwoFactorType" AS ENUM ('totp', 'sms', 'email', 'backup_codes');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- CreateEnum
CREATE TYPE "public"."LayoutStyle" AS ENUM ('default', 'centered', 'sidebar', 'fullscreen');

-- CreateEnum
CREATE TYPE "public"."FontSize" AS ENUM ('small', 'medium', 'large');

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit" JSONB NOT NULL DEFAULT '{"requestsPerMinute": 100, "requestsPerHour": 1000, "requestsPerDay": 10000}',
    "last_activity_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "phone" VARCHAR(20),
    "birth_date" DATE,
    "public_key" TEXT NOT NULL,
    "private_key" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ,
    "is_first_access" BOOLEAN NOT NULL DEFAULT true,
    "session_token" VARCHAR(255),
    "session_expires_at" TIMESTAMPTZ,
    "session_timeout" INTEGER NOT NULL DEFAULT 600,
    "global_role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "last_activity_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "permissions" JSONB,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "user_id" UUID,
    "user_client_id" UUID,
    "request_log_id" UUID,
    "contract_id" UUID,
    "network" "public"."Network" NOT NULL,
    "transaction_type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'pending',
    "tx_hash" VARCHAR(66),
    "block_number" BIGINT,
    "from_address" VARCHAR(42),
    "to_address" VARCHAR(42),
    "value" DECIMAL(65,0),
    "gas_price" DECIMAL(65,0),
    "gas_limit" BIGINT,
    "gas_used" BIGINT,
    "nonce" INTEGER,
    "data" TEXT,
    "function_name" VARCHAR(255),
    "function_params" JSONB,
    "receipt" JSONB,
    "error" JSONB,
    "confirmations" INTEGER DEFAULT 0,
    "estimated_gas" BIGINT,
    "actual_gas_cost" DECIMAL(65,0),
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."smart_contracts" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "network" "public"."Network" NOT NULL,
    "abi" JSONB NOT NULL,
    "bytecode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "smart_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stakes" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "network" "public"."Network" NOT NULL,
    "abi" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_logs" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "user_id" UUID,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "request_body" JSONB,
    "response_body" JSONB,
    "error" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhooks" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "events" JSON NOT NULL DEFAULT '[]',
    "secret" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "last_triggered" TIMESTAMPTZ,
    "last_success" TIMESTAMPTZ,
    "last_error" TEXT,
    "total_triggers" INTEGER NOT NULL DEFAULT 0,
    "total_success" INTEGER NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "user_id" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" BIGINT NOT NULL,
    "category" "public"."DocumentCategory" NOT NULL DEFAULT 'other',
    "tags" JSON,
    "metadata" JSONB,
    "path" VARCHAR(500) NOT NULL,
    "url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_download_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_clients" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "status" "public"."UserClientStatus" NOT NULL DEFAULT 'pending',
    "client_role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "linked_at" TIMESTAMPTZ,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "requested_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "last_access_at" TIMESTAMPTZ,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "can_view_private_keys" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_two_factors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "public"."TwoFactorType" NOT NULL,
    "secret" TEXT,
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "backup_codes" JSONB,
    "used_backup_codes" JSONB NOT NULL DEFAULT '[]',
    "setup_completed_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_two_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_logs" (
    "id" UUID NOT NULL,
    "template_id" UUID,
    "to_email" VARCHAR(255) NOT NULL,
    "from_email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'pending',
    "provider_id" VARCHAR(255),
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "opened_at" TIMESTAMPTZ,
    "clicked_at" TIMESTAMPTZ,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "bounced_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_brandings" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#007bff',
    "secondary_color" VARCHAR(7),
    "accent_color" VARCHAR(7),
    "background_color" VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    "text_color" VARCHAR(7) NOT NULL DEFAULT '#333333',
    "logo_url" TEXT,
    "logo_url_dark" TEXT,
    "favicon_url" TEXT,
    "background_image_url" TEXT,
    "layout_style" "public"."LayoutStyle" NOT NULL DEFAULT 'default',
    "border_radius" INTEGER NOT NULL DEFAULT 8,
    "font_family" VARCHAR(100),
    "font_size" "public"."FontSize" NOT NULL DEFAULT 'medium',
    "login_title" VARCHAR(100),
    "login_subtitle" VARCHAR(200),
    "welcome_message" TEXT,
    "footer_text" TEXT,
    "support_url" TEXT,
    "privacy_policy_url" TEXT,
    "terms_of_service_url" TEXT,
    "contact_email" VARCHAR(255),
    "custom_css" TEXT,
    "custom_js" TEXT,
    "allow_customization" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deployed_at" TIMESTAMPTZ,
    "deployed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "client_brandings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_clients_active" ON "public"."clients"("is_active");

-- CreateIndex
CREATE INDEX "idx_clients_last_activity" ON "public"."clients"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "public"."users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_session_token_key" ON "public"."users"("session_token");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_cpf" ON "public"."users"("cpf");

-- CreateIndex
CREATE INDEX "idx_users_global_role" ON "public"."users"("global_role");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "public"."users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_last_activity" ON "public"."users"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "public"."transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_client_id" ON "public"."transactions"("client_id");

-- CreateIndex
CREATE INDEX "idx_transactions_tx_hash" ON "public"."transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "public"."transactions"("status");

-- CreateIndex
CREATE INDEX "idx_transactions_network" ON "public"."transactions"("network");

-- CreateIndex
CREATE INDEX "idx_transactions_type" ON "public"."transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_transactions_from_address" ON "public"."transactions"("from_address");

-- CreateIndex
CREATE INDEX "idx_transactions_to_address" ON "public"."transactions"("to_address");

-- CreateIndex
CREATE INDEX "idx_transactions_block_number" ON "public"."transactions"("block_number");

-- CreateIndex
CREATE INDEX "idx_transactions_created_at" ON "public"."transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_transactions_confirmed_at" ON "public"."transactions"("confirmed_at");

-- CreateIndex
CREATE INDEX "idx_transactions_client_status" ON "public"."transactions"("client_id", "status");

-- CreateIndex
CREATE INDEX "idx_transactions_user_id" ON "public"."transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_transactions_user_client_id" ON "public"."transactions"("user_client_id");

-- CreateIndex
CREATE INDEX "idx_transactions_network_status" ON "public"."transactions"("network", "status");

-- CreateIndex
CREATE UNIQUE INDEX "smart_contracts_address_key" ON "public"."smart_contracts"("address");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_address" ON "public"."smart_contracts"("address");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_network" ON "public"."smart_contracts"("network");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_active" ON "public"."smart_contracts"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "stakes_address_key" ON "public"."stakes"("address");

-- CreateIndex
CREATE INDEX "idx_stakes_address" ON "public"."stakes"("address");

-- CreateIndex
CREATE INDEX "idx_stakes_network" ON "public"."stakes"("network");

-- CreateIndex
CREATE INDEX "idx_stakes_active" ON "public"."stakes"("is_active");

-- CreateIndex
CREATE INDEX "idx_request_logs_client_id" ON "public"."request_logs"("client_id");

-- CreateIndex
CREATE INDEX "idx_request_logs_user_id" ON "public"."request_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_request_logs_created_at" ON "public"."request_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "public"."password_resets"("token");

-- CreateIndex
CREATE INDEX "idx_password_resets_email" ON "public"."password_resets"("email");

-- CreateIndex
CREATE INDEX "idx_password_resets_token" ON "public"."password_resets"("token");

-- CreateIndex
CREATE INDEX "idx_documents_client_id" ON "public"."documents"("client_id");

-- CreateIndex
CREATE INDEX "idx_documents_category" ON "public"."documents"("category");

-- CreateIndex
CREATE INDEX "idx_documents_expires_at" ON "public"."documents"("expires_at");

-- CreateIndex
CREATE INDEX "idx_user_clients_user_id" ON "public"."user_clients"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_clients_client_id" ON "public"."user_clients"("client_id");

-- CreateIndex
CREATE INDEX "idx_user_clients_status" ON "public"."user_clients"("status");

-- CreateIndex
CREATE INDEX "idx_user_clients_role" ON "public"."user_clients"("client_role");

-- CreateIndex
CREATE INDEX "idx_user_clients_client_status" ON "public"."user_clients"("client_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_clients_user_status" ON "public"."user_clients"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_clients_client_role" ON "public"."user_clients"("client_id", "client_role");

-- CreateIndex
CREATE UNIQUE INDEX "user_clients_user_id_client_id_key" ON "public"."user_clients"("user_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_user_two_factors_user_id" ON "public"."user_two_factors"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_two_factors_user_active" ON "public"."user_two_factors"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_two_factors_user_id_type_key" ON "public"."user_two_factors"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "idx_email_templates_name" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "idx_email_templates_active" ON "public"."email_templates"("is_active");

-- CreateIndex
CREATE INDEX "idx_email_logs_to_email" ON "public"."email_logs"("to_email");

-- CreateIndex
CREATE INDEX "idx_email_logs_status" ON "public"."email_logs"("status");

-- CreateIndex
CREATE INDEX "idx_email_logs_created_at" ON "public"."email_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_email_logs_template_id" ON "public"."email_logs"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_brandings_client_id_key" ON "public"."client_brandings"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_brandings_client_id" ON "public"."client_brandings"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_brandings_is_active" ON "public"."client_brandings"("is_active");

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_client_id_fkey" FOREIGN KEY ("user_client_id") REFERENCES "public"."user_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_request_log_id_fkey" FOREIGN KEY ("request_log_id") REFERENCES "public"."request_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."smart_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_clients" ADD CONSTRAINT "user_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_clients" ADD CONSTRAINT "user_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_clients" ADD CONSTRAINT "user_clients_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_clients" ADD CONSTRAINT "user_clients_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_two_factors" ADD CONSTRAINT "user_two_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_brandings" ADD CONSTRAINT "client_brandings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_brandings" ADD CONSTRAINT "client_brandings_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
