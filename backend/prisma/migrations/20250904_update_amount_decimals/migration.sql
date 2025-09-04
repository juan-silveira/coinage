-- Alterar precisão dos campos amount e net_amount para suportar 8 casas decimais
ALTER TABLE "transactions" 
  ALTER COLUMN "amount" TYPE DECIMAL(20, 8),
  ALTER COLUMN "net_amount" TYPE DECIMAL(20, 8);

-- Alterar também na tabela de user_actions se existir
ALTER TABLE "user_actions" 
  ALTER COLUMN "amount" TYPE DECIMAL(20, 8),
  ALTER COLUMN "net_amount" TYPE DECIMAL(20, 8);