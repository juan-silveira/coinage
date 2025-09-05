/**
 * Configuração dos Produtos de Stake
 * 
 * Este arquivo centraliza toda a configuração dos produtos de stake disponíveis
 * na plataforma. Cada produto tem seus próprios contratos (stake e tokens).
 * 
 * IMPORTANTE: Os addresses dos contratos serão atualizados após o deploy
 */

// Redes suportadas
export const STAKE_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
};

// Status dos produtos
export const STAKE_PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMING_SOON: 'coming_soon',
  SOLD_OUT: 'sold_out',
  ENDED: 'ended'
};

// Níveis de risco
export const RISK_LEVELS = {
  VERY_LOW: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4
};

// Categorias de produtos
export const STAKE_CATEGORIES = {
  DIGITAL_INCOME: 'renda-digital',
  STARTUPS: 'startups',
  CRYPTO: 'crypto',
  REAL_ESTATE: 'real-estate'
};

/**
 * Produtos de Stake Disponíveis
 * 
 * Cada produto representa um contrato de stake diferente
 * com seus próprios tokens e configurações.
 */
export const STAKE_PRODUCTS = {
  // === PRODUTOS MEU PEDACINHO PRATIQUE ===
  'meu-pedacinho-pratique-lagoa': {
    // Identificação
    id: 'lagoa',
    name: 'Pedacinho Pratique Lagoa',
    subtitle: '(Renda Digital)',
    description: 'Investimento em renda digital com distribuição trimestral de lucros baseada na proporcionalidade do stake de PCN.',
    
    // Contratos deployados
    contracts: {
      stake: {
        address: '0xe21fc42e8c8758f6d999328228721F7952e5988d', // Contrato de stake
        network: STAKE_NETWORKS.TESTNET
      },
      stakeToken: {
        address: '0x0b5F5510160E27E6BFDe03914a18d555B590DAF5', // Token de teste
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      },
      rewardToken: {
        address: '0x0b5F5510160E27E6BFDe03914a18d555B590DAF5', // Mesmo token para recompensas
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      }
    },
    
    // Características do produto
    risk: RISK_LEVELS.LOW,
    category: STAKE_CATEGORIES.DIGITAL_INCOME,
    status: STAKE_PRODUCT_STATUS.COMING_SOON,
    
    // Configurações padrão (valores exemplo - serão obtidos do contrato)
    defaultConfig: {
      minStakeAmount: '1000000000000000000', // 1 PCN em wei
      cycleDurationDays: 90, // Trimestral
      allowPartialWithdrawal: true,
      allowCompound: true,
      stakingEnabled: true
    },
    
    // Dados de exemplo para desenvolvimento
    mockData: {
      receivableInteger: '2.054',
      receivableDecimals: '324568',
      quarterlyReturn: '5.68%',
      returnDate: '15/09/2025',
      stakedInteger: '15.000',
      stakedDecimals: '098546',
      distributedInteger: '11.001',
      distributedDecimals: '123456',
      availableBalance: '1000.000000'
    },
    
    // Metadados
    metadata: {
      location: 'Lagoa',
      region: 'Recife, PE',
      launchDate: '2024-12-01',
      expectedAPY: '18-24%',
      paymentFrequency: 'Trimestral',
      sector: 'Tecnologia'
    }
  },

  'meu-pedacinho-pratique-imbiribeira': {
    id: 'imbiribeira',
    name: 'Pedacinho Pratique Imbiribeira',
    subtitle: '(Renda Digital)',
    description: 'Segundo produto da linha Pratique com foco em expansão regional.',
    
    contracts: {
      stake: {
        address: null,
        network: STAKE_NETWORKS.TESTNET
      },
      stakeToken: {
        address: null,
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      },
      rewardToken: {
        address: null,
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      }
    },
    
    risk: RISK_LEVELS.MEDIUM,
    category: STAKE_CATEGORIES.DIGITAL_INCOME,
    status: STAKE_PRODUCT_STATUS.COMING_SOON,
    
    defaultConfig: {
      minStakeAmount: '1000000000000000000',
      cycleDurationDays: 90,
      allowPartialWithdrawal: true,
      allowCompound: true,
      stakingEnabled: true
    },
    
    mockData: {
      receivableInteger: '834',
      receivableDecimals: '887412',
      quarterlyReturn: '4.92%',
      returnDate: '15/09/2025',
      stakedInteger: '11.500',
      stakedDecimals: '000000',
      distributedInteger: '9.870',
      distributedDecimals: '543210',
      availableBalance: '1000.000000'
    },
    
    metadata: {
      location: 'Imbiribeira',
      region: 'Recife, PE',
      launchDate: '2024-12-15',
      expectedAPY: '16-20%',
      paymentFrequency: 'Trimestral',
      sector: 'Tecnologia'
    }
  },

  'meu-pedacinho-pratique-forquilhinhas': {
    id: 'forquilhinhas',
    name: 'Pedacinho Pratique Forquilhinhas',
    subtitle: '(Renda Digital)',
    description: 'Terceiro produto com maior potencial de retorno e risco moderado.',
    
    contracts: {
      stake: {
        address: null,
        network: STAKE_NETWORKS.TESTNET
      },
      stakeToken: {
        address: null,
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      },
      rewardToken: {
        address: null,
        symbol: 'PCN',
        name: 'Pratique Coin',
        decimals: 18
      }
    },
    
    risk: RISK_LEVELS.HIGH,
    category: STAKE_CATEGORIES.DIGITAL_INCOME,
    status: STAKE_PRODUCT_STATUS.COMING_SOON,
    
    defaultConfig: {
      minStakeAmount: '1000000000000000000',
      cycleDurationDays: 90,
      allowPartialWithdrawal: false, // Mais restritivo
      allowCompound: true,
      stakingEnabled: true
    },
    
    mockData: {
      receivableInteger: '1.120',
      receivableDecimals: '102030',
      quarterlyReturn: '6.15%',
      returnDate: '15/09/2025',
      stakedInteger: '13.200',
      stakedDecimals: '456789',
      distributedInteger: '10.500',
      distributedDecimals: '987654',
      availableBalance: '1000.000000'
    },
    
    metadata: {
      location: 'Forquilhinhas',
      region: 'São José, SC',
      launchDate: '2025-01-01',
      expectedAPY: '22-28%',
      paymentFrequency: 'Trimestral',
      sector: 'Tecnologia'
    }
  },

  // === OUTROS PRODUTOS DE STAKE ===
  'cnt-coinage-stake': {
    id: 'cnt-coinage',
    name: 'CNT - Coinage',
    subtitle: '(Renda Digital)',
    description: 'Stake do token CNT com recompensas em IMB.',
    
    contracts: {
      stake: {
        address: null,
        network: STAKE_NETWORKS.TESTNET
      },
      stakeToken: {
        address: null,
        symbol: 'CNT',
        name: 'Coinage Trade',
        decimals: 18
      },
      rewardToken: {
        address: null,
        symbol: 'IMB',
        name: 'Imobiliário Token',
        decimals: 18
      }
    },
    
    risk: RISK_LEVELS.LOW,
    category: STAKE_CATEGORIES.STARTUPS,
    status: STAKE_PRODUCT_STATUS.COMING_SOON,
    
    defaultConfig: {
      minStakeAmount: '100000000000000000000', // 100 CNT
      cycleDurationDays: 30, // Mensal
      allowPartialWithdrawal: true,
      allowCompound: false, // Recompensa em token diferente
      stakingEnabled: true
    },
    
    mockData: {
      receivableInteger: '2.054',
      receivableDecimals: '324568',
      quarterlyReturn: '14.40%',
      returnDate: '01/01/26',
      stakedInteger: '938',
      stakedDecimals: '92',
      distributedInteger: '11.001',
      distributedDecimals: '123456',
      availableBalance: '2538.000000'
    },
    
    metadata: {
      sector: 'Fintech',
      launchDate: '2025-02-01',
      expectedAPY: '12-18%',
      paymentFrequency: 'Mensal'
    }
  },

  'mjd-juridico-stake': {
    id: 'mjd-juridico',
    name: 'MJD - Meu Jurídico Digital',
    subtitle: '(Renda Variável)',
    description: 'Stake com royalties baseados no desempenho da plataforma jurídica.',
    
    contracts: {
      stake: {
        address: null,
        network: STAKE_NETWORKS.TESTNET
      },
      stakeToken: {
        address: null,
        symbol: 'MJD',
        name: 'Meu Jurídico Digital',
        decimals: 18
      },
      rewardToken: {
        address: null,
        symbol: 'MJD',
        name: 'Meu Jurídico Digital',
        decimals: 18
      }
    },
    
    risk: RISK_LEVELS.LOW,
    category: STAKE_CATEGORIES.STARTUPS,
    status: STAKE_PRODUCT_STATUS.COMING_SOON,
    
    defaultConfig: {
      minStakeAmount: '50000000000000000000', // 50 MJD
      cycleDurationDays: 180, // Semestral
      allowPartialWithdrawal: true,
      allowCompound: true,
      stakingEnabled: true
    },
    
    mockData: {
      receivableInteger: '1.120',
      receivableDecimals: '102030',
      quarterlyReturn: '13.80%',
      returnDate: '01/01/27',
      stakedInteger: '857',
      stakedDecimals: '90',
      distributedInteger: '10.500',
      distributedDecimals: '987654',
      availableBalance: '4046.000000'
    },
    
    metadata: {
      sector: 'LegalTech',
      launchDate: '2025-03-01',
      expectedAPY: '15-22%',
      paymentFrequency: 'Semestral'
    }
  }
};

/**
 * Funções Utilitárias
 */

// Obter produto por ID
export const getStakeProduct = (productId) => {
  return Object.values(STAKE_PRODUCTS).find(product => product.id === productId);
};

// Obter produtos por categoria
export const getStakeProductsByCategory = (category) => {
  return Object.values(STAKE_PRODUCTS).filter(product => product.category === category);
};

// Obter produtos ativos
export const getActiveStakeProducts = () => {
  return Object.values(STAKE_PRODUCTS).filter(product => 
    product.status === STAKE_PRODUCT_STATUS.ACTIVE
  );
};

// Obter produtos por rede
export const getStakeProductsByNetwork = (network) => {
  return Object.values(STAKE_PRODUCTS).filter(product => 
    product.contracts.stake.network === network
  );
};

// Verificar se produto está pronto para uso (contratos deployados)
export const isStakeProductReady = (productId) => {
  const product = getStakeProduct(productId);
  return product && 
         product.contracts.stake.address && 
         product.contracts.stakeToken.address && 
         product.contracts.rewardToken.address;
};

// Obter lista de tokens únicos usados nos stakes
export const getUniqueStakeTokens = () => {
  const tokens = new Map();
  
  Object.values(STAKE_PRODUCTS).forEach(product => {
    // Stake token
    if (product.contracts.stakeToken.symbol) {
      tokens.set(product.contracts.stakeToken.symbol, product.contracts.stakeToken);
    }
    // Reward token (se diferente)
    if (product.contracts.rewardToken.symbol && 
        product.contracts.rewardToken.symbol !== product.contracts.stakeToken.symbol) {
      tokens.set(product.contracts.rewardToken.symbol, product.contracts.rewardToken);
    }
  });
  
  return Array.from(tokens.values());
};

// Validar configuração de produto
export const validateStakeProduct = (product) => {
  const errors = [];
  
  if (!product.id) errors.push('ID é obrigatório');
  if (!product.name) errors.push('Nome é obrigatório');
  if (!product.contracts?.stake?.network) errors.push('Rede do contrato é obrigatória');
  if (!product.contracts?.stakeToken?.symbol) errors.push('Token de stake é obrigatório');
  if (!product.contracts?.rewardToken?.symbol) errors.push('Token de recompensa é obrigatório');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Exportar configuração para debug
export const debugStakeProducts = () => {
  console.group('🎯 Stake Products Configuration');
  console.log('Total products:', Object.keys(STAKE_PRODUCTS).length);
  console.log('Networks:', Object.values(STAKE_NETWORKS));
  console.log('Categories:', Object.values(STAKE_CATEGORIES));
  console.log('Unique tokens:', getUniqueStakeTokens());
  console.groupEnd();
  
  return {
    totalProducts: Object.keys(STAKE_PRODUCTS).length,
    networks: Object.values(STAKE_NETWORKS),
    categories: Object.values(STAKE_CATEGORIES),
    uniqueTokens: getUniqueStakeTokens()
  };
};

export default STAKE_PRODUCTS;