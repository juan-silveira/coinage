/**
 * Utility function to concatenate class names
 * @param {...string} classes - Class names to concatenate
 * @returns {string} Concatenated class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}