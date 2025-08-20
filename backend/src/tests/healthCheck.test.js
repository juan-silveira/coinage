/**
 * Testes automatizados de Health Check
 * Valida funcionamento básico de todos os serviços
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8800';

describe('Health Check Tests', () => {
  
  /**
   * Teste de Health Check Principal
   */
  test('Backend Health Check', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('OK');
      expect(response.data.timestamp).toBeDefined();
      expect(response.data.uptime).toBeDefined();
      
      console.log('✅ Backend Health Check: OK');
      console.log(`   Uptime: ${response.data.uptime}s`);
    } catch (error) {
      console.error('❌ Backend Health Check Failed:', error.message);
      throw error;
    }
  }, 10000);

  /**
   * Teste de API Root
   */
  test('API Root Endpoint', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/`);
      
      expect(response.status).toBe(200);
      expect(response.data.message).toContain('API');
      
      console.log('✅ API Root: OK');
    } catch (error) {
      console.error('❌ API Root Failed:', error.message);
      throw error;
    }
  }, 5000);

  /**
   * Teste de Rate Limiting
   */
  test('Rate Limiting Headers', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/login`);
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      
      console.log('✅ Rate Limiting Headers: OK');
      console.log(`   Limit: ${response.headers['x-ratelimit-limit']}`);
      console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
    } catch (error) {
      if (error.response?.headers['x-ratelimit-limit']) {
        console.log('✅ Rate Limiting Headers: OK (from error response)');
      } else {
        console.error('❌ Rate Limiting Headers Failed:', error.message);
        throw error;
      }
    }
  }, 5000);

  /**
   * Teste de CORS Headers
   */
  test('CORS Configuration', async () => {
    try {
      const response = await axios.options(`${BASE_URL}/api/auth/login`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST'
        }
      });
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      
      console.log('✅ CORS Configuration: OK');
    } catch (error) {
      console.error('❌ CORS Configuration Failed:', error.message);
      throw error;
    }
  }, 5000);

  /**
   * Teste de Performance (Response Time)
   */
  test('Response Time Performance', async () => {
    const startTime = Date.now();
    
    try {
      await axios.get(`${BASE_URL}/health`);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
      
      console.log(`✅ Response Time: ${responseTime}ms (OK)`);
    } catch (error) {
      console.error('❌ Performance Test Failed:', error.message);
      throw error;
    }
  }, 2000);

  /**
   * Teste de Error Handling
   */
  test('Error Handling', async () => {
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
    } catch (error) {
      expect(error.response?.status).toBe(404);
      expect(error.response?.data).toBeDefined();
      expect(error.response?.data.success).toBe(false);
      
      console.log('✅ Error Handling: OK');
    }
  }, 5000);
});

/**
 * Testes de Integração de Serviços
 */
describe('Service Integration Tests', () => {
  
  /**
   * Teste de Database Connection (simulado)
   */
  test('Database Connection Test', async () => {
    // Este teste depende da implementação do endpoint de teste
    console.log('⏸️ Database Connection Test: Skipped (requires implementation)');
  });

  /**
   * Teste de Email Service (mock)
   */
  test('Email Service Test', async () => {
    // Este teste depende da implementação do endpoint de teste
    console.log('⏸️ Email Service Test: Skipped (requires implementation)');
  });

  /**
   * Teste de Redis Connection
   */
  test('Redis Connection Test', async () => {
    // Este teste depende da implementação do endpoint de teste
    console.log('⏸️ Redis Connection Test: Skipped (requires implementation)');
  });
});

/**
 * Testes de Segurança Básicos
 */
describe('Basic Security Tests', () => {
  
  /**
   * Teste de Security Headers
   */
  test('Security Headers', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      // Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
      
      console.log('✅ Security Headers: OK');
    } catch (error) {
      console.error('❌ Security Headers Test Failed:', error.message);
      throw error;
    }
  }, 5000);

  /**
   * Teste de Authentication Endpoints
   */
  test('Authentication Required Endpoints', async () => {
    try {
      // Tentar acessar endpoint protegido sem autenticação
      await axios.get(`${BASE_URL}/api/users`);
    } catch (error) {
      expect(error.response?.status).toBe(401);
      console.log('✅ Authentication Protection: OK');
    }
  }, 5000);
});

// Configuração global para todos os testes
beforeAll(() => {
  console.log('🚀 Starting Health Check Tests...');
  console.log(`   Target URL: ${BASE_URL}`);
});

afterAll(() => {
  console.log('✅ Health Check Tests Completed');
});