const jwt = require('jsonwebtoken');

// JWT Secret (mesmo usado na aplicação)
const JWT_SECRET = '1dbe2489ad1e57530b103d71d7007ad34e17a3239a90c0cfa9007cbcab6859f75c9d2cd12f08a95a9c23428466e1e6f25c5c33cd818889d7c63d5eedf4c88f50';

// Dados do usuário (baseado nos logs - user ID from direct Prisma test)
const userData = {
  userId: '386eb564-5dc1-404f-8e1b-ce0b88c3adb0',
  userPlan: 'PREMIUM',
  email: 'ivan.alberton@navi.inf.br',
  iat: Math.floor(Date.now() / 1000) - 3600 // 1 hora atrás para garantir validade
};

// Gerar JWT
const token = jwt.sign(userData, JWT_SECRET);

console.log('JWT Token gerado:');
console.log(token);
console.log('\nPara testar:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8800/api/admin/tokens/register`);