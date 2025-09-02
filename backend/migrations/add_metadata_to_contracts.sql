-- Migration: Add metadata to smart_contracts table
-- Created: 2024-12-01
-- Purpose: Add JSONB metadata column to store stake contract configuration

-- Add metadata column to smart_contracts table
ALTER TABLE smart_contracts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for JSONB queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_smart_contracts_metadata 
ON smart_contracts USING GIN (metadata);

-- Create partial index for stake contracts
CREATE INDEX IF NOT EXISTS idx_smart_contracts_stake_metadata 
ON smart_contracts USING GIN (metadata) 
WHERE contract_type = 'stake';

-- Add comments for documentation
COMMENT ON COLUMN smart_contracts.metadata IS 'JSONB field for storing contract-specific metadata like stake configurations, product info, etc.';

-- Example of metadata structure for stake contracts:
-- {
--   "stakeConfig": {
--     "minStakeAmount": "1000000000000000000",
--     "cycleDurationDays": 90,
--     "allowPartialWithdrawal": true,
--     "allowCompound": true,
--     "stakingEnabled": true
--   },
--   "productInfo": {
--     "productId": "lagoa",
--     "name": "Pedacinho Pratique Lagoa",
--     "risk": 1,
--     "category": "renda-digital",
--     "status": "coming_soon"
--   },
--   "tokens": {
--     "stakeToken": {
--       "address": "0x...",
--       "symbol": "PCN",
--       "name": "Pratique Coin",
--       "decimals": 18
--     },
--     "rewardToken": {
--       "address": "0x...",
--       "symbol": "PCN", 
--       "name": "Pratique Coin",
--       "decimals": 18
--     }
--   },
--   "metadata": {
--     "location": "Lagoa",
--     "region": "Recife, PE",
--     "launchDate": "2024-12-01",
--     "expectedAPY": "18-24%",
--     "paymentFrequency": "Trimestral",
--     "sector": "Tecnologia"
--   }
-- }

-- Rollback script (if needed):
-- ALTER TABLE smart_contracts DROP COLUMN IF EXISTS metadata;
-- DROP INDEX IF EXISTS idx_smart_contracts_metadata;
-- DROP INDEX IF EXISTS idx_smart_contracts_stake_metadata;