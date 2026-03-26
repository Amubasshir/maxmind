/**
 * Session Manager for Password Protection
 *
 * Manages client-side authentication state using localStorage.
 * Session expires after 96 hours (4 days).
 */

const SESSION_DURATION_MS = 96 * 60 * 60 * 1000; // 96 hours in milliseconds
const STORAGE_KEY = 'friq_auth_timestamp';
const DEFAULT_PASSWORD = 'FRIQ2026';

/**
 * Get the stored authentication timestamp from localStorage
 */
function getStoredTimestamp(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const timestamp = localStorage.getItem(STORAGE_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the current session is still valid
 * @returns true if authenticated within the last 96 hours, false otherwise
 */
export function isSessionValid(): boolean {
  const timestamp = getStoredTimestamp();
  if (!timestamp) {
    return false;
  }

  const now = Date.now();
  const elapsed = now - timestamp;
  return elapsed < SESSION_DURATION_MS;
}

/**
 * Set the authentication timestamp to current time
 */
export function setAuthenticated(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to set authentication:', error);
  }
}

/**
 * Clear the authentication session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Validate the provided password
 * @param password - The password to validate
 * @returns true if password matches, false otherwise
 */
export function validatePassword(password: string): boolean {
  const correctPassword =
    process.env.NEXT_PUBLIC_APP_PASSWORD || DEFAULT_PASSWORD;
  return password === correctPassword;
}

/**
 * Get the remaining time until session expires (in hours)
 * @returns remaining hours or null if not authenticated
 */
export function getSessionRemainingHours(): number | null {
  const timestamp = getStoredTimestamp();
  if (!timestamp) {
    return null;
  }

  const now = Date.now();
  const elapsed = now - timestamp;
  const remaining = SESSION_DURATION_MS - elapsed;
  return remaining > 0 ? Math.floor(remaining / (60 * 60 * 1000)) : 0;
}
