#!/usr/bin/env node

/**
 * Script para executar testes automatizados
 * Não depende de frameworks externos como Jest
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8800';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.results = [];
  }

  async expect(actual, matcher, expected) {
    switch (matcher) {
      case 'toBe':
        return actual === expected;
      case 'toContain':
        return actual && actual.includes(expected);
      case 'toBeDefined':
        return actual !== undefined && actual !== null;
      case 'toBeLessThan':
        return actual < expected;
      default:
        return false;
    }
  }

  async test(name, testFn, timeout = 5000) {
    console.log(`🧪 Running: ${name}`);
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      );
      
      await Promise.race([testFn(), timeoutPromise]);
      
      this.passed++;
      this.results.push({ name, status: 'PASS' });
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.failed++;
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${name} - ${error.message}`);
    }
  }

  skip(name, reason = 'Skipped') {
    this.skipped++;
    this.results.push({ name, status: 'SKIP', reason });
    console.log(`⏸️ SKIP: ${name} - ${reason}`);
  }

  async runHealthCheckTests() {
    console.log('\n📋 === HEALTH CHECK TESTS ===');

    // Test 1: Backend Health Check
    await this.test('Backend Health Check', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (response.status !== 200) throw new Error('Status not 200');
      if (response.data.status !== 'OK') throw new Error('Status not OK');
      if (!response.data.timestamp) throw new Error('Timestamp missing');
      
      console.log(`   Uptime: ${response.data.uptime}s`);
    });

    // Test 2: API Root
    await this.test('API Root Endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/`);
      
      if (response.status !== 200) throw new Error('Status not 200');
      if (!response.data.message?.includes('API')) throw new Error('API message missing');
    });

    // Test 3: Rate Limiting
    await this.test('Rate Limiting Headers', async () => {
      let response;
      try {
        response = await axios.get(`${BASE_URL}/api/auth/login`);
      } catch (error) {
        response = error.response; // Rate limiting pode retornar erro, mas com headers
      }
      
      if (!response?.headers['x-ratelimit-limit']) throw new Error('Rate limit headers missing');
      
      console.log(`   Limit: ${response.headers['x-ratelimit-limit']}`);
      console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
    });

    // Test 4: Performance
    await this.test('Response Time Performance', async () => {
      const startTime = Date.now();
      await axios.get(`${BASE_URL}/health`);
      const responseTime = Date.now() - startTime;
      
      if (responseTime >= 1000) throw new Error(`Response time too slow: ${responseTime}ms`);
      
      console.log(`   Response time: ${responseTime}ms`);
    });

    // Test 5: Error Handling
    await this.test('Error Handling', async () => {
      try {
        await axios.get(`${BASE_URL}/api/nonexistent`);
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response?.status !== 404) throw new Error('Wrong error status');
        if (!error.response?.data?.success === false) throw new Error('Error format incorrect');
      }
    });
  }

  async runSecurityTests() {
    console.log('\n🔒 === SECURITY TESTS ===');

    // Test 1: Security Headers
    await this.test('Security Headers', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (!response.headers['x-content-type-options']) throw new Error('X-Content-Type-Options missing');
      if (!response.headers['x-frame-options']) throw new Error('X-Frame-Options missing');
      if (!response.headers['content-security-policy']) throw new Error('CSP missing');
    });

    // Test 2: CORS
    await this.test('CORS Configuration', async () => {
      try {
        const response = await axios.options(`${BASE_URL}/api/auth/login`, {
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST'
          }
        });
        
        if (!response.headers['access-control-allow-origin']) throw new Error('CORS headers missing');
      } catch (error) {
        // OPTIONS pode não estar implementado, mas se o header existir está OK
        if (!error.response?.headers['access-control-allow-origin']) {
          throw new Error('CORS not configured');
        }
      }
    });

    // Test 3: Authentication
    await this.test('Authentication Protection', async () => {
      try {
        await axios.get(`${BASE_URL}/api/users`);
        throw new Error('Protected endpoint accessible without auth');
      } catch (error) {
        if (error.response?.status !== 401) throw new Error('Wrong auth error status');
      }
    });
  }

  async runIntegrationTests() {
    console.log('\n🔗 === INTEGRATION TESTS ===');

    // Estes testes são skipped por enquanto pois precisam de implementação específica
    this.skip('Database Connection Test', 'Requires test endpoint implementation');
    this.skip('Email Service Test', 'Requires test endpoint implementation');
    this.skip('Redis Connection Test', 'Requires test endpoint implementation');
  }

  async runLoadTests() {
    console.log('\n⚡ === LOAD TESTS ===');

    await this.test('Multiple Concurrent Requests', async () => {
      const promises = [];
      const requestCount = 10;
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(axios.get(`${BASE_URL}/health`));
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Verificar se todas as requisições foram bem-sucedidas
      responses.forEach((response, index) => {
        if (response.status !== 200) {
          throw new Error(`Request ${index} failed with status ${response.status}`);
        }
      });
      
      console.log(`   ${requestCount} requests completed in ${totalTime}ms`);
      console.log(`   Average: ${(totalTime / requestCount).toFixed(2)}ms per request`);
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Automated Tests...');
    console.log(`📍 Target URL: ${BASE_URL}`);
    console.log('=====================================');

    await this.runHealthCheckTests();
    await this.runSecurityTests();
    await this.runIntegrationTests();
    await this.runLoadTests();

    this.printSummary();
  }

  printSummary() {
    console.log('\n=====================================');
    console.log('📊 TEST SUMMARY');
    console.log('=====================================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⏸️ Skipped: ${this.skipped}`);
    console.log(`📝 Total: ${this.passed + this.failed + this.skipped}`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log('\n' + (this.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
    
    // Exit code
    process.exit(this.failed === 0 ? 0 : 1);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;