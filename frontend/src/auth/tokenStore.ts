/**
 * In-memory token store — the ONLY place tokens are held on the frontend.
 *
 * Tokens are module-level variables. They are NEVER written to:
 *   - localStorage
 *   - sessionStorage
 *   - cookies
 *   - any other persistent browser storage
 *
 * This means tokens are cleared on page refresh, which is intentional
 * for the security model of this application.
 *
 * Requirements: 10.3, 12.4
 */

/** Access token (JWT) for the current session, or null if not authenticated. */
let _accessToken: string | null = null

/** Refresh token for the current session, or null if not authenticated. */
let _refreshToken: string | null = null

/**
 * Store a new token pair after a successful login or token refresh.
 *
 * @param access  - The new access token (JWT).
 * @param refresh - The new refresh token.
 */
export function setTokens(access: string, refresh: string): void {
  _accessToken = access
  _refreshToken = refresh
}

/**
 * Retrieve the current access token.
 *
 * @returns The access token string, or null if not authenticated.
 */
export function getAccessToken(): string | null {
  return _accessToken
}

/**
 * Retrieve the current refresh token.
 *
 * @returns The refresh token string, or null if not authenticated.
 */
export function getRefreshToken(): string | null {
  return _refreshToken
}

/**
 * Clear both tokens — call this on logout or when a refresh fails.
 */
export function clearTokens(): void {
  _accessToken = null
  _refreshToken = null
}
