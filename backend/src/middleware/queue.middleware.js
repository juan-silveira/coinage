const queueService = require('../services/queue.service');
const { ethers } = require('ethers');

/**
 * Middleware para enfileirar operações externas automaticamente
 */
class QueueMiddleware {
  /**
   * Middleware principal que detecta e enfileira operações automaticamente
   */
  static async enqueueExternalOperations(req, res, next) {
    try {
      const fullPath = req.baseUrl + req.path;
      
      // Verificar se a rota deve ser enfileirada
      const shouldEnqueue = determineShouldEnqueue(req.method, fullPath);
      
      if (!shouldEnqueue) {
        // Rota não enfileirada, continuar normalmente
        return next();
      }

      // Determinar o tipo de operação
      const operationType = determineOperationType(req.method, fullPath);
      
      // Preparar dados para a fila
      const queueData = {
        id: generateUniqueId(),
        type: operationType,
        method: req.method,
        path: fullPath,
        data: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        clientId: req.client?.id
      };

      // Converter amount de ETH para Wei se necessário
      if (queueData.data && queueData.data.amount && operationType.includes('token_')) {
        if (operationType === 'token_transfer_gasless') {
          // Para transferências gasless, manter amount original
          // A conversão será feita pelo service específico
        } else {
          // Para outras operações de token, converter para Wei
          const amountWei = ethers.utils.parseEther(queueData.data.amount.toString());
          queueData.data.amountWei = amountWei.toString();
        }
      }

      // Enfileirar operação
      const enqueued = await queueService.enqueueOperation(queueData);
      
      if (enqueued) {
        // Operação enfileirada com sucesso
        res.json({
          success: true,
          message: 'Operação enfileirada com sucesso',
          data: {
            operationId: queueData.id,
            type: operationType,
            status: 'queued',
            estimatedTime: '2-5 minutos'
          }
        });
      } else {
        // Falha ao enfileirar, continuar com execução direta
        console.warn('⚠️ Falha ao enfileirar operação, executando diretamente');
        next();
      }
      
    } catch (error) {
      console.error('❌ Erro no QueueMiddleware:', error);
      // Em caso de erro, continuar com execução direta
      next();
    }
  }

  /**
   * Determina automaticamente o tipo de operação baseado na rota
   */
  static determineOperationType(path, method) {
    console.log(`🔍 determineOperationType: path=${path}, method=${method}`);
    
    // Extrair informações da rota (path é relativo, ex: /mint, /balance)
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[0]; // /mint -> mint, /balance -> balance
    
    console.log(`🔍 pathParts=${JSON.stringify(pathParts)}, action=${action}`);
    
    // Mapeamento automático baseado no padrão da rota
    if (method === 'POST') {
      // Operações de escrita
      switch (action) {
        case 'mint': 
          console.log(`✅ Detectado token_mint`);
          return 'token_mint';
        case 'burn': 
          console.log(`✅ Detectado token_burn`);
          return 'token_burn';
        case 'transfer-gasless': 
          console.log(`✅ Detectado token_transfer_gasless`);
          return 'token_transfer_gasless';
        case 'register': 
          // Verificar se é stake ou token
          if (path.includes('/stakes/')) {
            console.log(`✅ Detectado stake_register`);
            return 'stake_register';
          }
          // Token register não vai mais para fila - processamento direto
          console.log(`ℹ️ token_register não é mais enfileirado`);
          return 'direct_operation';
        case 'deploy': 
          console.log(`✅ Detectado contract_deploy`);
          return 'contract_deploy';
        default:
          console.log(`🔍 Verificando padrões específicos para: ${path}`);
          if (path.includes('/grant-role')) {
            console.log(`✅ Detectado contract_grant_role`);
            return 'contract_grant_role';
          }
          if (path.includes('/revoke-role')) {
            console.log(`✅ Detectado contract_revoke_role`);
            return 'contract_revoke_role';
          }
          if (path.includes('/has-role')) {
            console.log(`✅ Detectado contract_has_role`);
            return 'contract_has_role';
          }
          if (path.includes('/write')) {
            console.log(`✅ Detectado contract_write`);
            return 'contract_write';
          }
          if (path.includes('/invest')) {
            console.log(`✅ Detectado stake_invest`);
            return 'stake_invest';
          }
          if (path.includes('/withdraw')) {
            console.log(`✅ Detectado stake_withdraw`);
            return 'stake_withdraw';
          }
          if (path.includes('/claim-rewards')) {
            console.log(`✅ Detectado stake_claim_rewards`);
            return 'stake_claim_rewards';
          }
          if (path.includes('/compound')) {
            console.log(`✅ Detectado stake_compound`);
            return 'stake_compound';
          }
          if (path.includes('/deposit-rewards')) {
            console.log(`✅ Detectado stake_deposit_rewards`);
            return 'stake_deposit_rewards';
          }
          if (path.includes('/distribute-rewards')) {
            console.log(`✅ Detectado stake_distribute_rewards`);
            return 'stake_distribute_rewards';
          }
          if (path.includes('/withdraw-reward-tokens')) {
            console.log(`✅ Detectado stake_withdraw_reward_tokens`);
            return 'stake_withdraw_reward_tokens';
          }
          if (path.includes('/set-cycle-duration')) {
            console.log(`✅ Detectado stake_set_cycle_duration`);
            return 'stake_set_cycle_duration';
          }
          if (path.includes('/set-allow-restake')) {
            console.log(`✅ Detectado stake_set_allow_restake`);
            return 'stake_set_allow_restake';
          }
          if (path.includes('/remove-from-blacklist')) {
            console.log(`✅ Detectado stake_remove_from_blacklist`);
            return 'stake_remove_from_blacklist';
          }
          if (path.includes('/set-staking-blocked')) {
            console.log(`✅ Detectado stake_set_staking_blocked`);
            return 'stake_set_staking_blocked';
          }
          if (path.includes('/set-timelock')) {
            console.log(`✅ Detectado stake_set_timelock`);
            return 'stake_set_timelock';
          }
          if (path.includes('/set-allow-partial-withdrawal')) {
            console.log(`✅ Detectado stake_set_allow_partial_withdrawal`);
            return 'stake_set_allow_partial_withdrawal';
          }
          if (path.includes('/update-min-value-stake')) {
            console.log(`✅ Detectado stake_update_min_value_stake`);
            return 'stake_update_min_value_stake';
          }
          if (path.includes('/add-to-whitelist')) {
            console.log(`✅ Detectado stake_add_to_whitelist`);
            return 'stake_add_to_whitelist';
          }
          if (path.includes('/remove-from-whitelist')) {
            console.log(`✅ Detectado stake_remove_from_whitelist`);
            return 'stake_remove_from_whitelist';
          }
          if (path.includes('/set-whitelist-enabled')) {
            console.log(`✅ Detectado stake_set_whitelist_enabled`);
            return 'stake_set_whitelist_enabled';
          }
          if (path.includes('/enqueue')) {
            console.log(`✅ Detectado transaction_enqueue`);
            return 'transaction_enqueue';
          }
          console.log(`⚠️ Nenhum padrão encontrado, retornando external_operation`);
          return 'external_operation';
      }
    } else if (method === 'GET') {
      // Consultas que fazem comunicação externa
      switch (action) {
        case 'balance': return 'token_balance_query';
        case 'balanceAZE': return 'token_balance_query';
        case 'connection': return 'blockchain_connection_query';
        case 'network-info': return 'blockchain_network_query';
        default:
          if (path.includes('/info')) {
            // Verificar se é stake ou token
            if (path.includes('/stakes/')) return 'stake_info_query';
            return 'token_info_query';
          }
          if (path.includes('/functions')) return 'contract_functions_query';
          if (path.includes('/events')) return 'contract_events_query';
          if (path.includes('/available-reward-balance')) return 'stake_reward_query';
          if (path.includes('/total-staked-supply')) return 'stake_supply_query';
          if (path.includes('/balance/')) return 'blockchain_balance_query';
          if (path.includes('/transaction/')) return 'blockchain_transaction_query';
          return 'external_query';
      }
    }
    
    return 'unknown_operation';
  }

  /**
   * Verifica se a rota deve ser enfileirada baseado em padrões
   */
  static shouldEnqueue(path, method) {
    // Lista de padrões de rotas que fazem comunicação externa
    const externalPatterns = [
      // Token operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/tokens\/mint$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/burn$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/transfer-gasless$/, method: 'POST' },
      // { pattern: /^\/api\/tokens\/register$/, method: 'POST' }, // Removido: registro é consulta direta, não transação
      
      // Contract operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/contracts\/deploy$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/write$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/grant-role$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/revoke-role$/, method: 'POST' },
      
      // Stake operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/stakes\/register$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/invest$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/withdraw$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/claim-rewards$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/compound$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/deposit-rewards$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/distribute-rewards$/, method: 'POST' },
      
      // Stake admin operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/stakes\/[^\/]+\/withdraw-reward-tokens$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-cycle-duration$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-restake$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-blacklist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-staking-blocked$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-timelock$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-partial-withdrawal$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/update-min-value-stake$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/add-to-whitelist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-whitelist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-whitelist-enabled$/, method: 'POST' }
    ];

    return externalPatterns.some(route => {
      const methodMatch = route.method === method;
      const pathMatch = route.pattern.test(path);
      return methodMatch && pathMatch;
    });
  }

  /**
   * Obtém o tempo estimado de processamento baseado no tipo de operação
   */
  static getEstimatedTime(operationType) {
    const timeEstimates = {
      // Operações de blockchain (mais lentas)
      'token_mint': '10-30 segundos',
      'token_burn': '10-30 segundos',
      'token_transfer_gasless': '10-30 segundos',
      'contract_deploy': '30-60 segundos',
      'contract_write': '10-30 segundos',
      'contract_grant_role': '10-30 segundos',
      'contract_revoke_role': '10-30 segundos',
      'stake_invest': '15-45 segundos',
      'stake_withdraw': '15-45 segundos',
      'stake_claim_rewards': '15-45 segundos',
      'stake_compound': '15-45 segundos',
      'stake_deposit_rewards': '15-45 segundos',
      'stake_distribute_rewards': '15-45 segundos',
      
      // Consultas (mais rápidas)
      'token_balance_query': '2-5 segundos',
      'token_info_query': '2-5 segundos',
      'contract_functions_query': '2-5 segundos',
      'contract_events_query': '2-5 segundos',
      'stake_info_query': '2-5 segundos',
      'stake_reward_query': '2-5 segundos',
      'stake_supply_query': '2-5 segundos',
      'blockchain_connection_query': '1-3 segundos',
      'blockchain_balance_query': '2-5 segundos',
      'blockchain_transaction_query': '2-5 segundos'
    };
    
    return timeEstimates[operationType] || '5-15 segundos';
  }

  /**
   * Middleware para operações de blockchain (POST)
   */
  static enqueueBlockchainOperation(req, res, next) {
    return QueueMiddleware.enqueueExternalOperations(req, res, next);
  }

  /**
   * Middleware para consultas de blockchain (GET)
   */
  static enqueueBlockchainQuery(req, res, next) {
    return QueueMiddleware.enqueueExternalOperations(req, res, next);
  }
}

// Função para determinar se uma rota deve ser enfileirada
const determineShouldEnqueue = (method, path) => {
  // Rotas que devem ser enfileiradas
  const enqueueableRoutes = [
    'POST /api/tokens/mint',
    'POST /api/tokens/burn',
    'POST /api/tokens/transfer-gasless',
    'POST /api/stakes/register',
    'POST /api/contracts/deploy',
    'POST /api/contracts/grant-role',
    'POST /api/contracts/revoke-role',
    'POST /api/contracts/has-role',
    'POST /api/contracts/write',
    'POST /api/stakes/invest',
    'POST /api/stakes/withdraw',
    'POST /api/stakes/claim-rewards',
    'POST /api/stakes/compound',
    'POST /api/stakes/deposit-rewards',
    'POST /api/stakes/distribute-rewards',
    'POST /api/stakes/withdraw-reward-tokens',
    'POST /api/stakes/set-cycle-duration',
    'POST /api/stakes/set-allow-restake',
    'POST /api/stakes/remove-from-blacklist',
    'POST /api/stakes/set-staking-blocked',
    'POST /api/stakes/set-timelock',
    'POST /api/stakes/set-allow-partial-withdrawal',
    'POST /api/stakes/update-min-value-stake',
    'POST /api/stakes/add-to-whitelist',
    'POST /api/stakes/remove-from-whitelist',
    'POST /api/stakes/set-whitelist-enabled',
    'POST /api/transactions/enqueue'
  ];

  const routeKey = `${method} ${path}`;
  return enqueueableRoutes.includes(routeKey);
};

// Função para determinar o tipo de operação
const determineOperationType = (method, path) => {
  const pathParts = path.split('/');
  const action = pathParts[pathParts.length - 1];
  
  // Mapear rotas para tipos de operação
  if (path.includes('/tokens/') && action === 'mint') return 'token_mint';
  if (path.includes('/tokens/') && action === 'burn') return 'token_burn';
  if (path.includes('/tokens/') && action === 'transfer-gasless') return 'token_transfer_gasless';
  if (path.includes('/stakes/') && action === 'register') return 'stake_register';
  if (path.includes('/contracts/') && action === 'deploy') return 'contract_deploy';
  if (path.includes('/contracts/') && action === 'grant-role') return 'contract_grant_role';
  if (path.includes('/contracts/') && action === 'revoke-role') return 'contract_revoke_role';
  if (path.includes('/contracts/') && action === 'has-role') return 'contract_has_role';
  if (path.includes('/contracts/') && action === 'write') return 'contract_write';
  if (path.includes('/stakes/') && action === 'invest') return 'stake_invest';
  if (path.includes('/stakes/') && action === 'withdraw') return 'stake_withdraw';
  if (path.includes('/stakes/') && action === 'claim-rewards') return 'stake_claim_rewards';
  if (path.includes('/stakes/') && action === 'compound') return 'stake_compound';
  if (path.includes('/stakes/') && action === 'deposit-rewards') return 'stake_deposit_rewards';
  if (path.includes('/stakes/') && action === 'distribute-rewards') return 'stake_distribute_rewards';
  if (path.includes('/stakes/') && action === 'withdraw-reward-tokens') return 'stake_withdraw_reward_tokens';
  if (path.includes('/stakes/') && action === 'set-cycle-duration') return 'stake_set_cycle_duration';
  if (path.includes('/stakes/') && action === 'set-allow-restake') return 'stake_set_allow_restake';
  if (path.includes('/stakes/') && action === 'remove-from-blacklist') return 'stake_remove_from_blacklist';
  if (path.includes('/stakes/') && action === 'set-staking-blocked') return 'stake_set_staking_blocked';
  if (path.includes('/stakes/') && action === 'set-timelock') return 'stake_set_timelock';
  if (path.includes('/stakes/') && action === 'set-allow-partial-withdrawal') return 'stake_set_allow_partial_withdrawal';
  if (path.includes('/stakes/') && action === 'update-min-value-stake') return 'stake_update_min_value_stake';
  if (path.includes('/stakes/') && action === 'add-to-whitelist') return 'stake_add_to_whitelist';
  if (path.includes('/stakes/') && action === 'remove-from-whitelist') return 'stake_remove_from_whitelist';
  if (path.includes('/stakes/') && action === 'set-whitelist-enabled') return 'stake_set_whitelist_enabled';
  if (path.includes('/transactions/') && action === 'enqueue') return 'transaction_enqueue';
  
  // Padrão para operações não reconhecidas
  return 'external_operation';
};

module.exports = QueueMiddleware; 