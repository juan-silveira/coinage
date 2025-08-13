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
    "distribution_date" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "public"."earnings" ADD CONSTRAINT "earnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
