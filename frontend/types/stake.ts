/**
 * Tipos TypeScript para Sistema de Stakes
 * 
 * Define todas as interfaces e tipos relacionados ao sistema de stakes,
 * incluindo produtos, contratos, transações e estados da aplicação.
 */

// ===== TIPOS BÁSICOS =====

export type StakeNetwork = 'mainnet' | 'testnet';
export type StakeProductStatus = 'active' | 'inactive' | 'coming_soon' | 'sold_out' | 'ended';
export type StakeCategory = 'renda-digital' | 'startups' | 'crypto' | 'real-estate';
export type RiskLevel = 0 | 1 | 2 | 3 | 4; // Muito Baixo, Baixo, Médio, Alto, Muito Alto

// Tipos de operações de stake
export type StakeOperationType = 
  | 'invest'        // Investir tokens
  | 'withdraw'      // Retirar investimento
  | 'claim'         // Resgatar recompensas
  | 'compound';     // Reinvestir recompensas

// Status de transação
export type TransactionStatus = 
  | 'pending'       // Aguardando confirmação
  | 'confirming'    // Confirmando na blockchain
  | 'confirmed'     // Confirmada
  | 'failed'        // Falhou
  | 'cancelled';    // Cancelada

// ===== INTERFACES DE CONTRATOS =====

export interface TokenContract {
  address: string | null;
  symbol: string;
  name: string;
  decimals: number;
}

export interface StakeContract {
  address: string | null;
  network: StakeNetwork;
}

export interface StakeContracts {
  stake: StakeContract;
  stakeToken: TokenContract;
  rewardToken: TokenContract;
}

// ===== CONFIGURAÇÕES DE PRODUTO =====

export interface StakeProductConfig {
  minStakeAmount: string;           // Valor mínimo em wei
  cycleDurationDays: number;        // Duração do ciclo em dias
  allowPartialWithdrawal: boolean;  // Permite retirada parcial
  allowCompound: boolean;           // Permite reinvestimento
  stakingEnabled: boolean;          // Permite novos stakes
}

export interface StakeProductMetadata {
  location?: string;                // Localização do projeto
  region?: string;                  // Região geográfica
  launchDate: string;               // Data de lançamento (ISO string)
  expectedAPY: string;              // APY esperado (ex: "18-24%")
  paymentFrequency: string;         // Frequência de pagamento
  sector?: string;                  // Setor da empresa
  [key: string]: any;               // Metadados adicionais
}

export interface StakeProductMockData {
  receivableInteger: string;        // Parte inteira do valor a receber
  receivableDecimals: string;       // Parte decimal do valor a receber
  quarterlyReturn: string;          // Retorno trimestral (ex: "5.68%")
  returnDate: string;               // Data do próximo retorno
  stakedInteger: string;            // Parte inteira do valor em stake
  stakedDecimals: string;           // Parte decimal do valor em stake
  distributedInteger: string;       // Parte inteira do total distribuído
  distributedDecimals: string;      // Parte decimal do total distribuído
  availableBalance: string;         // Saldo disponível para stake
}

// ===== PRODUTO DE STAKE =====

export interface StakeProduct {
  // Identificação
  id: string;
  name: string;
  subtitle: string;
  description: string;
  
  // Contratos
  contracts: StakeContracts;
  
  // Características
  risk: RiskLevel;
  category: StakeCategory;
  status: StakeProductStatus;
  
  // Configurações
  defaultConfig: StakeProductConfig;
  
  // Dados para desenvolvimento
  mockData: StakeProductMockData;
  
  // Metadados
  metadata: StakeProductMetadata;
}

// ===== DADOS DINÂMICOS DO CONTRATO =====

export interface StakeContractInfo {
  // Informações básicas
  name: string;
  stakeToken: string;               // Address do token de stake
  rewardToken: string;              // Address do token de recompensa
  adminAddress: string;             // Address do admin
  
  // Configurações atuais
  minStakeAmount: string;           // Em wei
  cycleDuration: number;            // Em segundos
  timelock: number;                 // Timestamp do timelock
  
  // Estados
  stakingBlocked: boolean;          // Novos stakes bloqueados
  allowPartialWithdrawal: boolean;  // Permite retirada parcial
  isRestakeAllowed: boolean;        // Permite reinvestimento
  whitelistEnabled: boolean;        // Whitelist ativa
  
  // Estatísticas
  totalStakedSupply: string;        // Total investido (em wei)
  totalRewardDistributed: string;   // Total de recompensas distribuídas
  availableRewardBalance: string;   // Saldo do cofre de recompensas
  numberOfActiveUsers: number;      // Número de investidores ativos
}

export interface UserStakeData {
  // Dados do usuário
  userAddress: string;
  
  // Saldos
  totalStakeBalance: string;        // Total investido pelo usuário (em wei)
  pendingReward: string;            // Recompensas pendentes (em wei)
  
  // Estados
  isBlacklisted: boolean;           // Usuário está na blacklist
  isWhitelisted: boolean;           // Usuário está na whitelist
  
  // Histórico (opcional)
  lastStakeDate?: number;           // Timestamp da última operação
  totalRewardsClaimed?: string;     // Total de recompensas já resgatadas
  numberOfStakes?: number;          // Número de stakes realizados
}

export interface StakeData {
  contractInfo: StakeContractInfo;
  userData: UserStakeData | null;
}

// ===== OPERAÇÕES E TRANSAÇÕES =====

export interface StakeOperationRequest {
  productId: string;
  operation: StakeOperationType;
  amount?: string;                  // Para invest/withdraw (em wei)
  userAddress: string;
  customTimestamp?: number;         // Para invest (opcional)
}

export interface StakeTransaction {
  id: string;
  hash: string | null;              // Hash da transação (quando disponível)
  productId: string;
  operation: StakeOperationType;
  amount: string;                   // Em wei
  userAddress: string;
  status: TransactionStatus;
  
  // Timestamps
  createdAt: number;                // Quando foi criada
  submittedAt: number | null;       // Quando foi submetida para blockchain
  confirmedAt: number | null;       // Quando foi confirmada
  
  // Dados adicionais
  gasPrice?: string;                // Preço do gas usado
  gasUsed?: string;                 // Gas consumido
  blockNumber?: number;             // Número do bloco
  errorMessage?: string;            // Mensagem de erro (se falhou)
}

// ===== WIZARD E UI =====

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface StakeWizardState {
  currentStepIndex: number;
  steps: WizardStep[];
  product: StakeProduct;
  operation: StakeOperationType;
  amount: string;
  isProcessing: boolean;
  transaction: StakeTransaction | null;
}

// ===== HOOKS E SERVIÇOS =====

export interface UseStakeDataResult {
  stakeData: StakeData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseStakeOperationResult {
  execute: (request: StakeOperationRequest) => Promise<StakeTransaction>;
  loading: boolean;
  error: string | null;
  transaction: StakeTransaction | null;
}

// ===== CACHE E ESTADO =====

export interface StakeCacheEntry {
  data: StakeData;
  timestamp: number;
  expiresAt: number;
}

export interface StakeState {
  // Produtos carregados
  products: Record<string, StakeProduct>;
  
  // Dados dinâmicos por produto
  stakeData: Record<string, StakeData>;
  
  // Cache
  cache: Record<string, StakeCacheEntry>;
  
  // Estados de UI
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  
  // Transações ativas
  activeTransactions: Record<string, StakeTransaction>;
}

// ===== API RESPONSES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: number;
}

export interface StakeInfoApiResponse extends ApiResponse {
  data: StakeContractInfo;
}

export interface PendingRewardApiResponse extends ApiResponse {
  data: {
    pendingReward: string;
    userAddress: string;
  };
}

export interface TotalStakeBalanceApiResponse extends ApiResponse {
  data: {
    totalBalance: string;
    userAddress: string;
  };
}

export interface StakeOperationApiResponse extends ApiResponse {
  data: {
    transactionHash: string;
    operation: StakeOperationType;
    amount: string;
    timestamp: number;
  };
}

// ===== UTILITÁRIOS =====

export interface StakeFormattedValue {
  integer: string;                  // Parte inteira formatada
  decimals: string;                 // Parte decimal formatada
  full: string;                     // Valor completo formatado
  wei: string;                      // Valor em wei
}

export interface StakeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ===== EVENTOS =====

export type StakeEventType = 
  | 'stake_created'
  | 'stake_withdrawn'
  | 'rewards_claimed'
  | 'rewards_compounded'
  | 'rewards_distributed'
  | 'product_updated'
  | 'contract_deployed';

export interface StakeEvent {
  type: StakeEventType;
  productId: string;
  userAddress?: string;
  amount?: string;
  transactionHash?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// ===== CONFIGURAÇÕES GLOBAIS =====

export interface StakeConfig {
  defaultNetwork: StakeNetwork;
  supportedNetworks: StakeNetwork[];
  cacheExpiration: number;          // Em segundos
  refreshInterval: number;          // Em segundos
  maxRetryAttempts: number;
  retryDelay: number;               // Em millisegundos
  debugMode: boolean;
}

// ===== EXPORTAÇÕES PADRÃO =====

export default StakeProduct;