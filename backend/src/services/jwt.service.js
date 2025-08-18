const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisService = require('./redis.service');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'azore-jwt-secret-key-change-in-production';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'azore-refresh-secret-key-change-in-production';
    this.tempSecret = process.env.JWT_TEMP_SECRET || 'azore-temp-secret-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 minutos
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 dias
    this.tempTokenExpiry = process.env.JWT_TEMP_EXPIRY || '10m'; // 10 minutos para 2FA
    this.blacklistedTokens = new Map(); // Blacklist local para fallback
  }

  /**
   * Gerar access token
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.permissions,
      isApiAdmin: user.isApiAdmin,
      isCompanyAdmin: user.isCompanyAdmin,
      type: 'access'
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'azore-api',
      audience: 'azore-company'
    });
  }

  /**
   * Gerar refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'azore-api',
      audience: 'azore-company'
    });
  }

  /**
   * Gerar token temporário para 2FA
   */
  generateTempToken(user, additionalData = {}) {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'temp_2fa',
      ...additionalData
    };

    return jwt.sign(payload, this.tempSecret, {
      expiresIn: this.tempTokenExpiry,
      issuer: 'azore-api',
      audience: 'azore-company'
    });
  }

  /**
   * Verificar token temporário
   */
  verifyTempToken(token) {
    try {
      const decoded = jwt.verify(token, this.tempSecret, {
        issuer: 'azore-api',
        audience: 'azore-company'
      });

      if (decoded.type !== 'temp_2fa') {
        throw new Error('Token temporário inválido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token temporário inválido ou expirado');
    }
  }

  /**
   * Gerar par de tokens (access + refresh)
   */
  generateTokenPair(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryTime(this.accessTokenExpiry),
      refreshExpiresIn: this.getExpiryTime(this.refreshTokenExpiry)
    };
  }

  /**
   * Verificar access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'azore-api',
        audience: 'azore-company'
      });

      if (decoded.type !== 'access') {
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Verificar refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: 'azore-api',
        audience: 'azore-company'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Refresh token inválido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Refresh token inválido ou expirado');
    }
  }

  /**
   * Renovar access token usando refresh token
   */
  async refreshAccessToken(refreshToken, userService) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Buscar usuário atualizado
      const user = await userService.getUserById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Gerar novo access token
      const newAccessToken = this.generateAccessToken(user);

      return {
        accessToken: newAccessToken,
        expiresIn: this.getExpiryTime(this.accessTokenExpiry)
      };
    } catch (error) {
      throw new Error('Falha ao renovar token');
    }
  }

  /**
   * Decodificar token sem verificar (para debug)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obter tempo de expiração em segundos
   */
  getExpiryTime(expiry) {
    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // 15 minutos padrão
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Gerar token de reset de senha
   */
  generatePasswordResetToken(userId) {
    const payload = {
      id: userId,
      type: 'password-reset',
      nonce: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: '1h', // 1 hora
      issuer: 'azore-api',
      audience: 'azore-company'
    });
  }

  /**
   * Verificar token de reset de senha
   */
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'azore-api',
        audience: 'azore-company'
      });

      if (decoded.type !== 'password-reset') {
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token de reset inválido ou expirado');
    }
  }

  /**
   * Gerar token de verificação de email
   */
  generateEmailVerificationToken(userId, email) {
    const payload = {
      id: userId,
      email,
      type: 'email-verification',
      nonce: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: '24h', // 24 horas
      issuer: 'azore-api',
      audience: 'azore-company'
    });
  }

  /**
   * Verificar token de verificação de email
   */
  verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'azore-api',
        audience: 'azore-company'
      });

      if (decoded.type !== 'email-verification') {
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token de verificação inválido ou expirado');
    }
  }

  /**
   * Blacklist de tokens (para logout)
   */
  async blacklistToken(token, expiresIn = 3600) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        console.log(`❌ Falha ao adicionar token à blacklist - Token inválido: ${token.substring(0, 20)}...`);
        throw new Error('Token inválido');
      }

      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp - now;

      console.log(`🔍 Tentativa de blacklist - Token: ${token.substring(0, 20)}..., User ID: ${decoded.id}, TTL: ${ttl}s`);

      if (ttl > 0) {
        // Adicionar à blacklist do Redis
        const success = await redisService.addToBlacklist(token, ttl);
        
        if (success) {
          console.log(`✅ Token adicionado à blacklist Redis - Token: ${token.substring(0, 20)}..., User ID: ${decoded.id}, TTL: ${ttl}s`);
          return true;
        } else {
          // Fallback para blacklist em memória se Redis não estiver disponível
          this.blacklistedTokens.set(token, {
            blacklistedAt: new Date(),
            expiresAt: new Date(exp * 1000)
          });

          setTimeout(() => {
            this.blacklistedTokens.delete(token);
          }, ttl * 1000);

          console.log(`✅ Token adicionado à blacklist local (fallback) - Token: ${token.substring(0, 20)}..., User ID: ${decoded.id}, TTL: ${ttl}s`);
          return true;
        }
      } else {
        console.log(`⚠️ Token expirado, não adicionado à blacklist - Token: ${token.substring(0, 20)}..., User ID: ${decoded.id}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar token à blacklist:', error.message);
      return false;
    }
  }

  /**
   * Verificar se token está na blacklist
   */
  async isTokenBlacklisted(token) {
    try {
      // Verificar primeiro na blacklist do Redis
      const isBlacklisted = await redisService.isBlacklisted(token);
      if (isBlacklisted) {
        console.log(`🚫 Token encontrado na blacklist Redis - Token: ${token.substring(0, 20)}...`);
        return true;
      }

      // Fallback para blacklist em memória
      const isLocalBlacklisted = this.blacklistedTokens.has(token);
      if (isLocalBlacklisted) {
        console.log(`🚫 Token encontrado na blacklist local - Token: ${token.substring(0, 20)}...`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar blacklist:', error.message);
      // Em caso de erro, verificar apenas a blacklist local
      const isLocalBlacklisted = this.blacklistedTokens.has(token);
      if (isLocalBlacklisted) {
        console.log(`🚫 Token encontrado na blacklist local (fallback) - Token: ${token.substring(0, 20)}...`);
      }
      return isLocalBlacklisted;
    }
  }
}

module.exports = new JWTService(); 