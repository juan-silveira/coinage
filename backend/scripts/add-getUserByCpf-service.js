// Script para adicionar método getUserByCpf no user.service.prisma.js

const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../src/services/user.service.prisma.js');

// Lê o arquivo atual
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Método a ser adicionado após getUserByPublicKey
const newMethod = `
  /**
   * Busca usuário por CPF
   * @param {string} cpf - CPF do usuário
   * @param {boolean} includePrivateKey - Se deve incluir chave privada
   * @returns {Promise<Object|null>} Usuário encontrado
   */
  async getUserByCpf(cpf, includePrivateKey = false) {
    try {
      if (!this.prisma) await this.init();

      // Limpar CPF (remover pontos e traços)
      const cleanCpf = cpf.replace(/[.-]/g, '');

      const user = await this.prisma.user.findUnique({
        where: { 
          cpf: cleanCpf,
          isActive: true 
        },
        include: {
          client: true
        }
      });

      if (!user) return null;

      return includePrivateKey ? user : this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por CPF:', error);
      throw error;
    }
  }
`;

// Localizar onde adicionar (após o método getUserByPublicKey)
const getUserByPublicKeyIndex = serviceContent.indexOf('async getUserByPublicKey(');
if (getUserByPublicKeyIndex === -1) {
  throw new Error('Método getUserByPublicKey não encontrado');
}

// Encontrar o final do método getUserByPublicKey
let braceCount = 0;
let methodEnd = getUserByPublicKeyIndex;
let inMethod = false;

for (let i = getUserByPublicKeyIndex; i < serviceContent.length; i++) {
  if (serviceContent[i] === '{') {
    braceCount++;
    inMethod = true;
  } else if (serviceContent[i] === '}') {
    braceCount--;
    if (inMethod && braceCount === 0) {
      methodEnd = i + 1;
      break;
    }
  }
}

// Inserir o novo método
const beforeMethod = serviceContent.substring(0, methodEnd);
const afterMethod = serviceContent.substring(methodEnd);

const newContent = beforeMethod + newMethod + afterMethod;

// Escreve o arquivo atualizado
fs.writeFileSync(servicePath, newContent, 'utf8');

console.log('✅ Método getUserByCpf adicionado ao user.service.prisma.js');
console.log('📝 Arquivo atualizado em:', servicePath);
