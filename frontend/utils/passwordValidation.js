/**
 * Utilitários para validação de senha
 */

/**
 * Valida se a senha atende aos critérios de segurança
 * @param {string} password - Senha a ser validada
 * @returns {object} Objeto com resultado da validação e detalhes
 */
export const validatePassword = (password) => {
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

/**
 * Calcula a força da senha (0-100)
 * @param {string} password - Senha a ser avaliada
 * @returns {number} Força da senha de 0 a 100
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;
  const checks = validatePassword(password).checks;

  // Cada critério vale 20 pontos
  if (checks.minLength) score += 20;
  if (checks.hasUppercase) score += 20;
  if (checks.hasLowercase) score += 20;
  if (checks.hasNumber) score += 20;
  if (checks.hasSpecialChar) score += 20;

  return score;
};

/**
 * Retorna a classificação da força da senha
 * @param {number} strength - Força da senha (0-100)
 * @returns {object} Objeto com label e cor da força
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength === 0) return { label: '', color: '' };
  if (strength < 40) return { label: 'Muito Fraca', color: 'text-red-600' };
  if (strength < 60) return { label: 'Fraca', color: 'text-orange-600' };
  if (strength < 80) return { label: 'Média', color: 'text-yellow-600' };
  if (strength < 100) return { label: 'Forte', color: 'text-blue-600' };
  return { label: 'Muito Forte', color: 'text-green-600' };
};