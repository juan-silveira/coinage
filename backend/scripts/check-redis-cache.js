#!/usr/bin/env node

/**
 * Script para verificar o que está no cache Redis
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

const redisService = require('../src/services/redis.service');
const balanceSyncService = require('../src/services/balanceSync.service');

const TEST_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
const TEST_USER_ID = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // ID do ivan.alberton

async function checkRedisCache() {
  console.log('🔍 Verificando cache Redis');
  console.log('=========================\n');

  try {
    // Inicializar Redis
    await redisService.initialize();
    console.log('✅ Redis conectado\n');

    // 1. Verificar estatísticas do Redis
    const stats = redisService.getStats();
    console.log('📊 Estatísticas do Redis:');
    console.log(`   - Conectado: ${stats.isConnected}`);
    console.log(`   - Modo: ${stats.mode}`);
    console.log(`   - Fallback size: ${stats.memoryFallbackSize}`);
    console.log();

    // 2. Tentar buscar cache específico
    console.log('🔍 Buscando cache específico do usuário...');
    const cache = await balanceSyncService.getCache(TEST_USER_ID, TEST_ADDRESS, 'testnet');
    
    if (cache) {
      console.log('✅ Cache encontrado:');
      console.log(`   - Network: ${cache.network}`);
      console.log(`   - Address: ${cache.address}`);
      console.log(`   - Total tokens: ${Object.keys(cache.balancesTable || {}).length}`);
      console.log(`   - Balances:`, cache.balancesTable);
      console.log(`   - Last updated: ${cache.lastUpdated}`);
      console.log(`   - Source: ${cache.source}`);
    } else {
      console.log('❌ Nenhum cache encontrado para este usuário');
    }
    console.log();

    // 3. Listar todas as chaves do Redis relacionadas ao usuário
    console.log('🗝️ Buscando todas as chaves relacionadas ao usuário...');
    if (redisService.isConnected && redisService.client) {
      try {
        const pattern = `*${TEST_USER_ID}*`;
        const keys = await redisService.client.keys(pattern);
        
        if (keys.length > 0) {
          console.log(`✅ Encontradas ${keys.length} chave(s):`);
          for (const key of keys) {
            console.log(`   - ${key}`);
            try {
              const value = await redisService.client.get(key);
              if (value) {
                const parsed = JSON.parse(value);
                if (parsed.balancesTable) {
                  console.log(`     → Balances: ${Object.keys(parsed.balancesTable).length} tokens`);
                  console.log(`     → cBRL: ${parsed.balancesTable.cBRL || 'não encontrado'}`);
                }
              }
            } catch (parseError) {
              console.log(`     → Erro ao ler valor: ${parseError.message}`);
            }
          }
        } else {
          console.log('❌ Nenhuma chave encontrada com esse padrão');
        }
      } catch (keyError) {
        console.error('❌ Erro ao listar chaves:', keyError.message);
      }
    }
    console.log();

    // 4. Tentar buscar com diferentes padrões
    console.log('🔍 Buscando outras possibilidades...');
    const patterns = [
      `balance_sync:testnet:${TEST_USER_ID}:${TEST_ADDRESS}`,
      `balance_sync:testnet:*:${TEST_ADDRESS}`,
      `*:${TEST_ADDRESS}:*`,
      `*balance*`,
      `*sync*`
    ];

    for (const pattern of patterns) {
      try {
        console.log(`   Padrão: ${pattern}`);
        if (redisService.isConnected && redisService.client) {
          const keys = await redisService.client.keys(pattern);
          if (keys.length > 0) {
            console.log(`     ✅ ${keys.length} chave(s): ${keys.join(', ')}`);
          } else {
            console.log(`     ❌ Nenhuma chave`);
          }
        }
      } catch (patternError) {
        console.log(`     ❌ Erro: ${patternError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await redisService.close();
      console.log('\n✅ Redis desconectado');
    } catch (closeError) {
      console.error('❌ Erro ao fechar Redis:', closeError.message);
    }
  }
}

// Executar
if (require.main === module) {
  checkRedisCache()
    .then(() => {
      console.log('\n✅ Verificação concluída');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = { checkRedisCache };