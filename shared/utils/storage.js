/**
 * Shared localStorage utility functions for Narduk Games
 */

/**
 * Save data to localStorage
 * @param {string} key - The key to store the data under
 * @param {any} value - The value to store (will be JSON stringified)
 * @returns {boolean} - True if successful, false otherwise
 */
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Load data from localStorage
 * @param {string} key - The key to retrieve
 * @returns {any|null} - The parsed value or null if not found/error
 */
export const loadFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - The key to remove
 * @returns {boolean} - True if successful, false otherwise
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Clear all localStorage data
 * @returns {boolean} - True if successful, false otherwise
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};
