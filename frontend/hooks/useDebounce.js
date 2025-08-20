import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores
 * @param {*} value - Valor a ser debounced
 * @param {number} delay - Delay em millisegundos
 * @returns {*} - Valor debounced
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debouncing de chamadas de função
 * @param {Function} callback - Função a ser chamada
 * @param {number} delay - Delay em millisegundos
 * @returns {Function} - Função debounced
 */
export function useDebouncedCallback(callback, delay) {
  const [debounceTimer, setDebounceTimer] = useState(null);

  return (...args) => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };
}

export default useDebounce;