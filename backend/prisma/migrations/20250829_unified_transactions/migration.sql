-- Migration para unificar transações de deposit em uma única linha
-- Adiciona campos para rastrear status de PIX e Blockchain separadamente

-- Adicionar campos PIX
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS pix_status "TransactionStatus" DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_transaction_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_end_to_end_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_failed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar campos Blockchain
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS blockchain_status "TransactionStatus" DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blockchain_block_number BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blockchain_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blockchain_failed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar campos de controle
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50) DEFAULT NULL; -- 'deposit' ou 'withdraw'

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_pix_status ON transactions(pix_status);
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain_status ON transactions(blockchain_status);
CREATE INDEX IF NOT EXISTS idx_transactions_pix_transaction_id ON transactions(pix_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain_tx_hash ON transactions(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_operation_type ON transactions(operation_type);

-- Adicionar comentários para documentação
COMMENT ON COLUMN transactions.pix_status IS 'Status específico da transação PIX';
COMMENT ON COLUMN transactions.blockchain_status IS 'Status específico da transação blockchain';
COMMENT ON COLUMN transactions.operation_type IS 'Tipo de operação: deposit ou withdraw';
COMMENT ON COLUMN transactions.fee IS 'Taxa cobrada na transação';
COMMENT ON COLUMN transactions.net_amount IS 'Valor líquido após dedução de taxas';