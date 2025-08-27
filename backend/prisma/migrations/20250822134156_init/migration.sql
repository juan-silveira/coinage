-- CreateEnum
CREATE TYPE "public"."Network" AS ENUM ('mainnet', 'testnet');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('transfer', 'contract_deploy', 'contract_call', 'contract_read', 'deposit', 'withdraw', 'stake', 'unstake', 'exchange', 'stake_reward');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'APP_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserPlan" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('identity', 'address_proof', 'financial', 'contract', 'other');

-- CreateEnum
CREATE TYPE "public"."UserCompanyStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "public"."TwoFactorType" AS ENUM ('totp', 'sms', 'email', 'backup_codes');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- CreateEnum
CREATE TYPE "public"."LayoutStyle" AS ENUM ('default', 'centered', 'sidebar', 'fullscreen');

-- CreateEnum
CREATE TYPE "public"."FontSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "public"."UserDocumentType" AS ENUM ('front', 'back', 'selfie');

-- CreateEnum
CREATE TYPE "public"."UserDocumentStatus" AS ENUM ('not_sent', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."UserActionType" AS ENUM ('login', 'logout', 'login_failed', 'password_reset', 'password_changed', 'two_factor_enabled', 'two_factor_disabled', 'two_factor_verified', 'profile_updated', 'profile_viewed', 'document_uploaded', 'document_verified', 'deposit_initiated', 'deposit_confirmed', 'deposit_failed', 'withdrawal_initiated', 'withdrawal_approved', 'withdrawal_completed', 'withdrawal_failed', 'transfer_sent', 'transfer_received', 'transfer_failed', 'transaction_sent', 'transaction_confirmed', 'transaction_failed', 'contract_interaction', 'token_swap', 'stake_created', 'stake_withdrawn', 'reward_claimed', 'api_key_created', 'api_key_deleted', 'suspicious_activity', 'account_locked', 'account_unlocked', 'notification_sent', 'email_sent', 'webhook_triggered', 'cache_cleared', 'user_created', 'user_updated', 'user_deleted', 'permission_granted', 'permission_revoked');

-- CreateEnum
CREATE TYPE "public"."UserActionCategory" AS ENUM ('authentication', 'profile', 'financial', 'blockchain', 'security', 'system', 'admin');

-- CreateEnum
CREATE TYPE "public"."UserActionStatus" AS ENUM ('success', 'failed', 'pending', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ContractCategory" AS ENUM ('token', 'nft', 'defi', 'escrow', 'governance', 'bridge', 'oracle', 'other');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit" JSONB NOT NULL DEFAULT '{"requestsPerDay": 10000, "requestsPerHour": 1000, "requestsPerMinute": 100}',
    "last_activity_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "alias" VARCHAR(50),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
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
    "password_changed_at" TIMESTAMPTZ(6),
    "is_first_access" BOOLEAN NOT NULL DEFAULT true,
    "session_token" VARCHAR(255),
    "session_expires_at" TIMESTAMPTZ(6),
    "session_timeout" INTEGER NOT NULL DEFAULT 600,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "profile_picture" TEXT,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "blockchain_address" VARCHAR(42),
    "metadata" JSONB,
    "last_activity_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_login_at" TIMESTAMPTZ(6),
    "is_blocked_login_attempts" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_plan" "public"."UserPlan" NOT NULL DEFAULT 'BASIC',

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
    "expires_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "permissions" JSONB,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "transaction_type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(15,2),
    "currency" VARCHAR(5),
    "network" "public"."Network",
    "contract_address" VARCHAR(42),
    "tx_hash" VARCHAR(66),
    "block_number" BIGINT,
    "from_address" VARCHAR(42),
    "to_address" VARCHAR(42),
    "gas_used" BIGINT,
    "function_name" VARCHAR(50),
    "confirmed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "category" "public"."ContractCategory" NOT NULL,
    "abi_path" VARCHAR(255) NOT NULL,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."smart_contracts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "contract_type_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "network" "public"."Network" NOT NULL,
    "abi" JSONB,
    "bytecode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "deployed_at" TIMESTAMPTZ(6),
    "deployed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "smart_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stakes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "network" "public"."Network" NOT NULL,
    "abi" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhooks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "events" JSON NOT NULL DEFAULT '[]',
    "secret" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "last_triggered" TIMESTAMPTZ(6),
    "last_success" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "total_triggers" INTEGER NOT NULL DEFAULT 0,
    "total_success" INTEGER NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
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
    "expires_at" TIMESTAMPTZ(6),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_download_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" "public"."UserDocumentType" NOT NULL,
    "status" "public"."UserDocumentStatus" NOT NULL DEFAULT 'not_sent',
    "s3_url" VARCHAR(500),
    "s3_key" VARCHAR(500),
    "filename" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_companies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" "public"."UserCompanyStatus" NOT NULL DEFAULT 'pending',
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "linked_at" TIMESTAMPTZ(6),
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "requested_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "last_access_at" TIMESTAMPTZ(6),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "can_view_private_keys" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
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
    "setup_completed_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

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
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "bounced_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_brandings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
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
    "deployed_at" TIMESTAMPTZ(6),
    "deployed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "company_brandings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "sender" VARCHAR(50) NOT NULL DEFAULT 'coinage',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "read_date" TIMESTAMPTZ(6),
    "delete_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."withdrawals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "fee" DECIMAL(15,2) NOT NULL,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "pix_key" VARCHAR(255) NOT NULL,
    "pix_key_type" VARCHAR(20) NOT NULL,
    "status" "public"."WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "burn_tx_hash" VARCHAR(66),
    "pix_transaction_id" VARCHAR(255),
    "pix_end_to_end_id" VARCHAR(32),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."earnings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_symbol" VARCHAR(20) NOT NULL,
    "token_name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "quote" DECIMAL(20,8) NOT NULL,
    "network" "public"."Network" NOT NULL DEFAULT 'testnet',
    "transaction_hash" VARCHAR(66),
    "distribution_date" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_actions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID,
    "action" "public"."UserActionType" NOT NULL,
    "category" "public"."UserActionCategory" NOT NULL,
    "status" "public"."UserActionStatus" NOT NULL DEFAULT 'success',
    "details" JSONB,
    "metadata" JSONB,
    "related_id" UUID,
    "related_type" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "device_info" JSONB,
    "location" JSONB,
    "error_message" TEXT,
    "error_code" VARCHAR(50),
    "duration" INTEGER,
    "performed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_taxes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "deposit_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "withdraw_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "min_deposit_fee" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "max_deposit_fee" DOUBLE PRECISION,
    "min_withdraw_fee" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "max_withdraw_fee" DOUBLE PRECISION,
    "exchange_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "transfer_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "gas_subsidy_enabled" BOOLEAN NOT NULL DEFAULT false,
    "gas_subsidy_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custom_fees" JSONB,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "vip_level" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_alias_key" ON "public"."companies"("alias");

-- CreateIndex
CREATE INDEX "idx_companies_active" ON "public"."companies"("is_active");

-- CreateIndex
CREATE INDEX "idx_companies_last_activity" ON "public"."companies"("last_activity_at");

-- CreateIndex
CREATE INDEX "idx_companies_alias" ON "public"."companies"("alias");

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
CREATE INDEX "idx_users_active" ON "public"."users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_email_confirmed" ON "public"."users"("email_confirmed");

-- CreateIndex
CREATE INDEX "idx_users_last_activity" ON "public"."users"("last_activity_at");

-- CreateIndex
CREATE INDEX "idx_users_user_plan" ON "public"."users"("user_plan");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "public"."transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_user_type" ON "public"."transactions"("user_id", "transaction_type");

-- CreateIndex
CREATE INDEX "idx_transactions_company_status" ON "public"."transactions"("company_id", "status");

-- CreateIndex
CREATE INDEX "idx_transactions_type_status" ON "public"."transactions"("transaction_type", "status");

-- CreateIndex
CREATE INDEX "idx_transactions_tx_hash" ON "public"."transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "idx_transactions_created_at" ON "public"."transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_transactions_contract" ON "public"."transactions"("contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_name_key" ON "public"."contract_types"("name");

-- CreateIndex
CREATE INDEX "idx_contract_types_name" ON "public"."contract_types"("name");

-- CreateIndex
CREATE INDEX "idx_contract_types_category" ON "public"."contract_types"("category");

-- CreateIndex
CREATE INDEX "idx_contract_types_active" ON "public"."contract_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "smart_contracts_address_key" ON "public"."smart_contracts"("address");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_address" ON "public"."smart_contracts"("address");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_network" ON "public"."smart_contracts"("network");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_active" ON "public"."smart_contracts"("is_active");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_contract_type" ON "public"."smart_contracts"("contract_type_id");

-- CreateIndex
CREATE INDEX "idx_smart_contracts_deployed_by" ON "public"."smart_contracts"("deployed_by");

-- CreateIndex
CREATE UNIQUE INDEX "stakes_address_key" ON "public"."stakes"("address");

-- CreateIndex
CREATE INDEX "idx_stakes_address" ON "public"."stakes"("address");

-- CreateIndex
CREATE INDEX "idx_stakes_network" ON "public"."stakes"("network");

-- CreateIndex
CREATE INDEX "idx_stakes_active" ON "public"."stakes"("is_active");

-- CreateIndex
CREATE INDEX "idx_request_logs_company_id" ON "public"."request_logs"("company_id");

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
CREATE INDEX "idx_documents_company_id" ON "public"."documents"("company_id");

-- CreateIndex
CREATE INDEX "idx_documents_category" ON "public"."documents"("category");

-- CreateIndex
CREATE INDEX "idx_documents_expires_at" ON "public"."documents"("expires_at");

-- CreateIndex
CREATE INDEX "idx_user_documents_user_id" ON "public"."user_documents"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_documents_status" ON "public"."user_documents"("status");

-- CreateIndex
CREATE INDEX "idx_user_documents_type" ON "public"."user_documents"("document_type");

-- CreateIndex
CREATE INDEX "idx_user_documents_reviewer" ON "public"."user_documents"("reviewed_by");

-- CreateIndex
CREATE INDEX "idx_user_documents_status_type" ON "public"."user_documents"("status", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_documents_user_id_document_type_key" ON "public"."user_documents"("user_id", "document_type");

-- CreateIndex
CREATE INDEX "idx_user_companies_user_id" ON "public"."user_companies"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_companies_company_id" ON "public"."user_companies"("company_id");

-- CreateIndex
CREATE INDEX "idx_user_companies_status" ON "public"."user_companies"("status");

-- CreateIndex
CREATE INDEX "idx_user_companies_role" ON "public"."user_companies"("role");

-- CreateIndex
CREATE INDEX "idx_user_companies_company_status" ON "public"."user_companies"("company_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_companies_user_status" ON "public"."user_companies"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_user_companies_company_role" ON "public"."user_companies"("company_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_user_id_company_id_key" ON "public"."user_companies"("user_id", "company_id");

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
CREATE UNIQUE INDEX "company_brandings_company_id_key" ON "public"."company_brandings"("company_id");

-- CreateIndex
CREATE INDEX "idx_company_brandings_company_id" ON "public"."company_brandings"("company_id");

-- CreateIndex
CREATE INDEX "idx_company_brandings_is_active" ON "public"."company_brandings"("is_active");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "public"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_active" ON "public"."notifications"("is_active");

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_favorite" ON "public"."notifications"("is_favorite");

-- CreateIndex
CREATE INDEX "idx_notifications_created" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_withdrawals_user_id" ON "public"."withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "idx_withdrawals_status" ON "public"."withdrawals"("status");

-- CreateIndex
CREATE INDEX "idx_withdrawals_created" ON "public"."withdrawals"("created_at");

-- CreateIndex
CREATE INDEX "idx_withdrawals_pix_transaction" ON "public"."withdrawals"("pix_transaction_id");

-- CreateIndex
CREATE INDEX "idx_earnings_user_id" ON "public"."earnings"("user_id");

-- CreateIndex
CREATE INDEX "idx_earnings_token_symbol" ON "public"."earnings"("token_symbol");

-- CreateIndex
CREATE INDEX "idx_earnings_network" ON "public"."earnings"("network");

-- CreateIndex
CREATE INDEX "idx_earnings_distribution_date" ON "public"."earnings"("distribution_date");

-- CreateIndex
CREATE INDEX "idx_earnings_active" ON "public"."earnings"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_actions_user_id" ON "public"."user_actions"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_actions_company_id" ON "public"."user_actions"("company_id");

-- CreateIndex
CREATE INDEX "idx_user_actions_action" ON "public"."user_actions"("action");

-- CreateIndex
CREATE INDEX "idx_user_actions_category" ON "public"."user_actions"("category");

-- CreateIndex
CREATE INDEX "idx_user_actions_status" ON "public"."user_actions"("status");

-- CreateIndex
CREATE INDEX "idx_user_actions_performed_at" ON "public"."user_actions"("performed_at");

-- CreateIndex
CREATE INDEX "idx_user_actions_related_id" ON "public"."user_actions"("related_id");

-- CreateIndex
CREATE INDEX "idx_user_actions_user_performed" ON "public"."user_actions"("user_id", "performed_at");

-- CreateIndex
CREATE INDEX "idx_user_actions_user_category" ON "public"."user_actions"("user_id", "category");

-- CreateIndex
CREATE INDEX "idx_user_actions_user_action_status" ON "public"."user_actions"("user_id", "action", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_taxes_user_id_key" ON "public"."user_taxes"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_taxes_user_id" ON "public"."user_taxes"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_taxes_is_vip" ON "public"."user_taxes"("is_vip");

-- CreateIndex
CREATE INDEX "idx_user_taxes_vip_level" ON "public"."user_taxes"("vip_level");

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."smart_contracts" ADD CONSTRAINT "smart_contracts_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_logs" ADD CONSTRAINT "request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_documents" ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_documents" ADD CONSTRAINT "user_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_companies" ADD CONSTRAINT "user_companies_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_companies" ADD CONSTRAINT "user_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_companies" ADD CONSTRAINT "user_companies_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_companies" ADD CONSTRAINT "user_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_two_factors" ADD CONSTRAINT "user_two_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_brandings" ADD CONSTRAINT "company_brandings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_brandings" ADD CONSTRAINT "company_brandings_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawals" ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."earnings" ADD CONSTRAINT "earnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_actions" ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_actions" ADD CONSTRAINT "user_actions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_taxes" ADD CONSTRAINT "user_taxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
