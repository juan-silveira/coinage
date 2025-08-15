import React from 'react';
import { calculatePasswordStrength, getPasswordStrengthLabel, validatePassword } from '@/utils/passwordValidation';
import useDarkmode from '@/hooks/useDarkMode';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const [isDark] = useDarkmode();
  const strength = calculatePasswordStrength(password);
  const { label, color } = getPasswordStrengthLabel(strength);
  const { checks, errors } = validatePassword(password);

  if (!password) return null;

  const getBarColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 60) return 'bg-orange-500';
    if (strength < 80) return 'bg-yellow-500';
    if (strength < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const themeClasses = {
    container: isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200',
    text: isDark ? 'text-slate-300' : 'text-slate-600',
    requirement: (met) => isDark 
      ? `text-xs ${met ? 'text-green-400' : 'text-slate-400'}` 
      : `text-xs ${met ? 'text-green-600' : 'text-slate-500'}`,
    icon: (met) => met ? 'text-green-500' : (isDark ? 'text-slate-500' : 'text-slate-400')
  };

  return (
    <div className={`p-3 border rounded-lg mt-2 ${themeClasses.container}`}>
      {/* Barra de força */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-medium ${themeClasses.text}`}>
            Força da senha:
          </span>
          <span className={`text-xs font-medium ${color}`}>
            {label}
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${checks.minLength ? 'text-green-500' : themeClasses.icon(false)}`}>
              {checks.minLength ? '✓' : '•'}
            </span>
            <span className={themeClasses.requirement(checks.minLength)}>
              Pelo menos 8 caracteres
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${checks.hasUppercase ? 'text-green-500' : themeClasses.icon(false)}`}>
              {checks.hasUppercase ? '✓' : '•'}
            </span>
            <span className={themeClasses.requirement(checks.hasUppercase)}>
              Uma letra maiúscula
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${checks.hasLowercase ? 'text-green-500' : themeClasses.icon(false)}`}>
              {checks.hasLowercase ? '✓' : '•'}
            </span>
            <span className={themeClasses.requirement(checks.hasLowercase)}>
              Uma letra minúscula
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${checks.hasNumber ? 'text-green-500' : themeClasses.icon(false)}`}>
              {checks.hasNumber ? '✓' : '•'}
            </span>
            <span className={themeClasses.requirement(checks.hasNumber)}>
              Um número
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${checks.hasSpecialChar ? 'text-green-500' : themeClasses.icon(false)}`}>
              {checks.hasSpecialChar ? '✓' : '•'}
            </span>
            <span className={themeClasses.requirement(checks.hasSpecialChar)}>
              Um caractere especial (!@#$%^&* etc.)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;