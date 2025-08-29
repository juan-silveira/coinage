'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_pix_keys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      key_type: {
        type: Sequelize.ENUM('cpf', 'email', 'phone', 'random'),
        allowNull: false,
        comment: 'Tipo da chave PIX'
      },
      key_value: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Valor da chave PIX'
      },
      bank_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Código do banco (ex: 077, 341, 001)'
      },
      bank_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nome do banco'
      },
      bank_logo: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL ou base64 do logo do banco'
      },
      agency: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Número da agência'
      },
      agency_digit: {
        type: Sequelize.STRING(2),
        allowNull: true,
        comment: 'Dígito verificador da agência'
      },
      account_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Número da conta'
      },
      account_digit: {
        type: Sequelize.STRING(2),
        allowNull: false,
        comment: 'Dígito verificador da conta'
      },
      account_type: {
        type: Sequelize.ENUM('corrente', 'poupanca', 'pagamentos', 'salario'),
        allowNull: false,
        defaultValue: 'corrente',
        comment: 'Tipo da conta bancária'
      },
      holder_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nome do titular da conta'
      },
      holder_document: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'CPF/CNPJ do titular'
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Se a chave foi verificada'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Se a chave está ativa'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Se é a chave padrão do usuário'
      },
      verification_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Dados da verificação da chave (resposta da API do BC)'
      },
      last_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data da última verificação'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Adicionar índices
    await queryInterface.addIndex('user_pix_keys', ['user_id']);
    await queryInterface.addIndex('user_pix_keys', ['key_type', 'key_value'], {
      unique: true,
      name: 'unique_pix_key'
    });
    await queryInterface.addIndex('user_pix_keys', ['user_id', 'is_default']);
    await queryInterface.addIndex('user_pix_keys', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_pix_keys');
  }
};