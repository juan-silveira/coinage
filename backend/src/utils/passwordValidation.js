/**
 * Utilitários para validação de senha no backend
 */

/**
 * Valida se a senha atende aos critérios de segurança
 * @param {string} password - Senha a ser validada
 * @returns {object} Objeto com resultado da validação e detalhes
 */
const validatePassword = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isValid = Object.values(checks).every(check => check);

  return {
    isValid,
    checks,
    errors: getPasswordErrors(checks)
  };
};

/**
 * Retorna lista de erros baseada nos checks
 * @param {object} checks - Resultado dos checks de validação
 * @returns {string[]} Array de mensagens de erro
 */
const getPasswordErrors = (checks) => {
  const errors = [];

  if (!checks.minLength) {
    errors.push('Deve ter pelo menos 8 caracteres');
  }
  if (!checks.hasUppercase) {
    errors.push('Deve ter pelo menos uma letra maiúscula');
  }
  if (!checks.hasLowercase) {
    errors.push('Deve ter pelo menos uma letra minúscula');
  }
  if (!checks.hasNumber) {
    errors.push('Deve ter pelo menos um número');
  }
  if (!checks.hasSpecialChar) {
    errors.push('Deve ter pelo menos um caractere especial (!@#$%^&* etc.)');
  }

  return errors;
};

module.exports = {
  validatePassword
};