// Cross-subdomain cookie utilities for shared authentication
// Sets cookies with domain=.nard.uk so they work across all subdomains

const COOKIE_DOMAIN = '.nard.uk';
const AUTH_COOKIE_NAME = 'narduk_auth';
const AUTH_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Set an authentication cookie that works across all *.nard.uk subdomains
 * @param {Object} user - User object to store
 */
export function setAuthCookie(user) {
  const cookieValue = JSON.stringify({
    id: user.id,
    username: user.username,
    displayname: user.displayname || user.username,
    timestamp: Date.now()
  });
  
  // Encode to base64 to avoid issues with special characters
  const encoded = btoa(unescape(encodeURIComponent(cookieValue)));
  
  // Set cookie with domain=.nard.uk so it works across all subdomains
  document.cookie = `${AUTH_COOKIE_NAME}=${encoded}; domain=${COOKIE_DOMAIN}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

/**
 * Get the authentication cookie
 * @returns {Object|null} User object or null if not found
 */
export function getAuthCookie() {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
  
  if (!authCookie) {
    return null;
  }
  
  try {
    const encoded = authCookie.split('=')[1];
    const decoded = decodeURIComponent(escape(atob(encoded)));
    const user = JSON.parse(decoded);
    return user;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return null;
  }
}

/**
 * Clear the authentication cookie
 */
export function clearAuthCookie() {
  // Set cookie with past expiration date to delete it
  document.cookie = `${AUTH_COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0; SameSite=Lax; Secure`;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getAuthCookie() !== null;
}

