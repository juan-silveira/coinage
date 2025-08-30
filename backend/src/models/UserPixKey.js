const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPixKey = sequelize.define('UserPixKey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    keyType: {
      type: DataTypes.ENUM('cpf', 'email', 'phone', 'random'),
      allowNull: false,
      field: 'key_type'
    },
    keyValue: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'key_value'
    },
    bankCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'bank_code'
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'bank_name'
    },
    bankLogo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'bank_logo'
    },
    agency: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    agencyDigit: {
      type: DataTypes.STRING(2),
      allowNull: true,
      field: 'agency_digit'
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'account_number'
    },
    accountDigit: {
      type: DataTypes.STRING(2),
      allowNull: false,
      field: 'account_digit'
    },
    accountType: {
      type: DataTypes.ENUM('corrente', 'poupanca', 'pagamentos', 'salario'),
      allowNull: false,
      defaultValue: 'corrente',
      field: 'account_type'
    },
    holderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'holder_name'
    },
    holderDocument: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'holder_document'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_default'
    },
    verificationData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'verification_data'
    },
    lastVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_verified_at'
    }
  }, {
    tableName: 'user_pix_keys',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['key_type', 'key_value'],
        unique: true,
        name: 'unique_pix_key'
      },
      {
        fields: ['user_id', 'is_default']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Associações
  UserPixKey.associate = function(models) {
    UserPixKey.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Métodos de instância
  UserPixKey.prototype.getFormattedKey = function() {
    switch(this.keyType) {
      case 'cpf':
        return this.keyValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      case 'phone':
        const digits = this.keyValue.replace(/\D/g, '');
        if (digits.length === 11) {
          return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else {
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
      default:
        return this.keyValue;
    }
  };

  UserPixKey.prototype.getAccountDisplay = function() {
    const agency = this.agencyDigit 
      ? `${this.agency}-${this.agencyDigit}`
      : this.agency;
    
    const account = `${this.accountNumber}-${this.accountDigit}`;
    
    const typeMap = {
      'corrente': 'Conta corrente',
      'poupanca': 'Conta poupança',
      'pagamentos': 'Conta de pagamentos',
      'salario': 'Conta salário'
    };

    return {
      agency,
      account,
      type: typeMap[this.accountType] || 'Conta corrente'
    };
  };

  // Métodos estáticos
  UserPixKey.findByUser = function(userId, options = {}) {
    return this.findAll({
      where: { 
        userId,
        isActive: true,
        ...options.where 
      },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
      ...options
    });
  };

  UserPixKey.findDefaultByUser = function(userId) {
    return this.findOne({
      where: { 
        userId,
        isDefault: true,
        isActive: true 
      }
    });
  };

  UserPixKey.setAsDefault = async function(pixKeyId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Remove o padrão de todas as chaves do usuário
      await this.update(
        { isDefault: false },
        { 
          where: { userId },
          transaction
        }
      );

      // Define a nova chave como padrão
      await this.update(
        { isDefault: true },
        { 
          where: { id: pixKeyId, userId },
          transaction
        }
      );

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  return UserPixKey;
};