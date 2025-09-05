-- Alterar precisão dos campos amount e net_amount para suportar 8 casas decimais
ALTER TABLE "transactions" 
  ALTER COLUMN "amount" TYPE DECIMAL(20, 8),
  ALTER COLUMN "net_amount" TYPE DECIMAL(20, 8);

-- Alterar precisão dos campos amount e quote da tabela earnings para suportar 8 casas decimais
ALTER TABLE "earnings" 
  ALTER COLUMN "amount" TYPE DECIMAL(20, 8),
  ALTER COLUMN "quote" TYPE DECIMAL(20, 8);

-- Adicionar enum distributeReward ao UserActionType
ALTER TYPE "UserActionType" ADD VALUE IF NOT EXISTS 'distributeReward';