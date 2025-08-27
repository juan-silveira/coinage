-- CreateMigration: simplify-taxes-fixed-fees
-- Simplificar tabela de taxes: valores fixos para deposit/withdraw, percentuais para exchange/transfer

BEGIN;

-- Adicionar novas colunas com valores fixos
ALTER TABLE "user_taxes" 
ADD COLUMN "deposit_fee" DOUBLE PRECISION DEFAULT 3.0,
ADD COLUMN "withdraw_fee" DOUBLE PRECISION DEFAULT 5.0;

-- Migrar dados existentes: usar valor mínimo como taxa fixa
UPDATE "user_taxes" 
SET 
  "deposit_fee" = COALESCE("min_deposit_fee", 3.0),
  "withdraw_fee" = COALESCE("min_withdraw_fee", 5.0);

-- Tornar as novas colunas NOT NULL
ALTER TABLE "user_taxes" 
ALTER COLUMN "deposit_fee" SET NOT NULL,
ALTER COLUMN "withdraw_fee" SET NOT NULL;

-- Remover colunas antigas de percentuais e min/max para deposit/withdraw
ALTER TABLE "user_taxes" 
DROP COLUMN "deposit_fee_percent",
DROP COLUMN "withdraw_fee_percent", 
DROP COLUMN "min_deposit_fee",
DROP COLUMN "max_deposit_fee",
DROP COLUMN "min_withdraw_fee",
DROP COLUMN "max_withdraw_fee";

COMMIT;