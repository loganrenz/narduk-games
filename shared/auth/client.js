// Shared Authentication Client for all Narduk Games
// Provides reusable auth functions that can be imported by any game

const AUTH_API_BASE_URL = 'https://narduk-games-auth-api.narduk.workers.dev';

/**
 * Get or create a user
 * @param {string} username - The username
 * @param {string|null} userId - Optional existing user ID
 * @param {string|null} password - Optional password for new users
 * @returns {Promise<Object|null>} User object or null on error
 */
export async function getOrCreateUser(username, userId = null, password = null) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, userId, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error creating user:', error);
      // Throw error with message for better error handling
      throw new Error(error.error || `Failed to create user: ${response.status}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    // Re-throw network errors with better messages
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      throw new Error('Unable to connect to authentication server. Please check your connection or try again later.');
    }
    throw error;
  }
}

/**
 * Get user by username or ID
 * @param {string|null} username - The username (optional)
 * @param {string|null} userId - The user ID (optional)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUser(username = null, userId = null) {
  try {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (userId) params.append('userId', userId);
    
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/user?${params}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Check if username is available
 * @param {string} username - The username to check
 * @returns {Promise<Object>} Object with available, exists, and taken properties
 */
export async function checkUsername(username) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, exists: false, taken: false };
  }
}

/**
 * Login user with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<Object|null>} User object or null on error
 */
export async function login(username, password) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Login error:', error);
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
}

/**
 * Update user profile
 * @param {string} userId - The user ID
 * @param {Object} updates - Object with displayname, password, currentPassword
 * @returns {Promise<Object|null>} Updated user object or null on error
 */
export async function updateUser(userId, updates) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/user`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating user:', error);
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

