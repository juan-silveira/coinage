/**
 * Serviço de Alertas
 * Monitora eventos críticos do sistema e envia notificações
 */

const logger = require('../config/logger');
const emailService = require('./email.service');

class AlertingService {
  constructor() {
    this.alertThresholds = {
      errorRate: 10, // Máximo de 10 erros por minuto
      responseTime: 5000, // 5 segundos
      failedLogins: 50, // 50 tentativas falhadas por hora
      databaseErrors: 5, // 5 erros de database por hora
      criticalErrors: 1, // Qualquer erro crítico
    };

    this.alertCounters = {
      errors: new Map(),
      slowRequests: 0,
      failedLogins: 0,
      databaseErrors: 0,
      lastReset: Date.now()
    };

    // Reset counters a cada hora
    setInterval(() => this.resetCounters(), 60 * 60 * 1000);
  }

  /**
   * Reset dos contadores de alertas
   */
  resetCounters() {
    this.alertCounters.errors.clear();
    this.alertCounters.slowRequests = 0;
    this.alertCounters.failedLogins = 0;
    this.alertCounters.databaseErrors = 0;
    this.alertCounters.lastReset = Date.now();

    logger.info('Alert counters reset', {
      timestamp: new Date().toISOString(),
      service: 'alerting',
      type: 'counter_reset'
    });
  }

  /**
   * Incrementa contador de erros e verifica thresholds
   */
  trackError(error, context = {}) {
    const errorType = error.name || 'UnknownError';
    const currentCount = this.alertCounters.errors.get(errorType) || 0;
    this.alertCounters.errors.set(errorType, currentCount + 1);

    // Log do erro
    logger.error('Error tracked for alerting', {
      error: error.message,
      type: errorType,
      count: currentCount + 1,
      context,
      stack: error.stack
    });

    // Verificar se precisa alertar
    if (currentCount + 1 >= this.alertThresholds.errorRate) {
      this.sendAlert('HIGH_ERROR_RATE', {
        errorType,
        count: currentCount + 1,
        threshold: this.alertThresholds.errorRate,
        context
      });
    }
  }

  /**
   * Rastreia requests lentos
   */
  trackSlowRequest(req, responseTime) {
    if (responseTime > this.alertThresholds.responseTime) {
      this.alertCounters.slowRequests++;

      logger.warn('Slow request detected', {
        url: req.url,
        method: req.method,
        responseTime,
        threshold: this.alertThresholds.responseTime,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });

      // Alertar se muitas requests lentas
      if (this.alertCounters.slowRequests >= 20) { // 20 requests lentas por hora
        this.sendAlert('SLOW_REQUESTS', {
          count: this.alertCounters.slowRequests,
          threshold: this.alertThresholds.responseTime
        });
      }
    }
  }

  /**
   * Rastreia tentativas de login falhadas
   */
  trackFailedLogin(email, ip, reason) {
    this.alertCounters.failedLogins++;

    logger.warn('Failed login attempt', {
      email,
      ip,
      reason,
      count: this.alertCounters.failedLogins
    });

    if (this.alertCounters.failedLogins >= this.alertThresholds.failedLogins) {
      this.sendAlert('HIGH_FAILED_LOGINS', {
        count: this.alertCounters.failedLogins,
        threshold: this.alertThresholds.failedLogins,
        lastAttempt: { email, ip, reason }
      });
    }
  }

  /**
   * Rastreia erros de banco de dados
   */
  trackDatabaseError(error, query = null) {
    this.alertCounters.databaseErrors++;

    logger.error('Database error', {
      error: error.message,
      query,
      count: this.alertCounters.databaseErrors,
      stack: error.stack
    });

    if (this.alertCounters.databaseErrors >= this.alertThresholds.databaseErrors) {
      this.sendAlert('DATABASE_ERRORS', {
        count: this.alertCounters.databaseErrors,
        threshold: this.alertThresholds.databaseErrors,
        lastError: error.message
      });
    }
  }

  /**
   * Alerta crítico imediato
   */
  sendCriticalAlert(type, data) {
    logger.error('CRITICAL ALERT', {
      type,
      data,
      timestamp: new Date().toISOString(),
      urgent: true
    });

    this.sendAlert('CRITICAL_' + type, data, true);
  }

  /**
   * Envia alerta via email e log
   */
  async sendAlert(alertType, data, critical = false) {
    const alertData = {
      type: alertType,
      severity: critical ? 'CRITICAL' : 'WARNING',
      timestamp: new Date().toISOString(),
      data,
      system: 'Coinage Backend',
      environment: process.env.NODE_ENV || 'development'
    };

    // Log do alerta
    const logLevel = critical ? 'error' : 'warn';
    logger[logLevel]('ALERT TRIGGERED', alertData);

    // Tentar enviar email se configurado
    try {
      await this.sendAlertEmail(alertData);
    } catch (emailError) {
      logger.error('Failed to send alert email', {
        alertType,
        emailError: emailError.message
      });
    }
  }

  /**
   * Envia email de alerta
   */
  async sendAlertEmail(alertData) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coinage.com';
    
    const subject = `[${alertData.severity}] ${alertData.type} - Coinage Alert`;
    
    const template = 'system_alert';
    const templateData = {
      alertType: alertData.type,
      severity: alertData.severity,
      timestamp: alertData.timestamp,
      details: JSON.stringify(alertData.data, null, 2),
      environment: alertData.environment,
      system: alertData.system
    };

    try {
      await emailService.sendEmail(
        adminEmail,
        subject,
        template,
        templateData
      );

      logger.info('Alert email sent successfully', {
        alertType: alertData.type,
        recipient: adminEmail
      });
    } catch (error) {
      // Falha silenciosa - já logada acima
      throw error;
    }
  }

  /**
   * Verifica saúde dos contadores de alerta
   */
  getAlertStats() {
    const stats = {
      thresholds: this.alertThresholds,
      counters: {
        errors: Object.fromEntries(this.alertCounters.errors),
        slowRequests: this.alertCounters.slowRequests,
        failedLogins: this.alertCounters.failedLogins,
        databaseErrors: this.alertCounters.databaseErrors,
        lastReset: new Date(this.alertCounters.lastReset).toISOString()
      },
      nextReset: new Date(this.alertCounters.lastReset + 60 * 60 * 1000).toISOString()
    };

    return stats;
  }

  /**
   * Atualiza thresholds dinamicamente
   */
  updateThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    
    logger.info('Alert thresholds updated', {
      newThresholds: this.alertThresholds
    });
  }

  /**
   * Força reset dos contadores (para testes)
   */
  forceResetCounters() {
    this.resetCounters();
    logger.info('Counters forcefully reset');
  }
}

// Singleton instance
const alertingService = new AlertingService();

module.exports = alertingService;