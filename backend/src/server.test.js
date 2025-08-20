// Servidor de teste simplificado para verificar integração básica
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8800;

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'coinage-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Coinage API Test Server',
    status: 'running',
    endpoints: {
      health: '/health',
      swagger: '/api-docs'
    }
  });
});

// Test authentication route
app.post('/api/test/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication test endpoint working',
    received: req.body
  });
});

// Test database connection
app.get('/api/test/db', async (req, res) => {
  try {
    // Simular teste de conexão
    res.json({
      success: true,
      message: 'Database connection test',
      status: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test email service
app.post('/api/test/email', (req, res) => {
  res.json({
    success: true,
    message: 'Email service test endpoint working',
    provider: 'mock'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});