/**
 * Cookie storage type
 */
export interface CookieStore {
  [key: string]: string;
}

/**
 * Response from instrument search queries
 */
export interface InstrumentSearchResponse {
  rows?: number;
  total_hits?: number;
  results: Array<Record<string, unknown>>;
}

/**
 * Login status response
 */
export interface LoginStatusResponse {
  logged_in: boolean;
  [key: string]: unknown;
}

/**
 * Nordnet API configuration options
 */
export interface NordnetConfig {
  username: string;
  password: string;
  requestsPerSecond?: number;
}

/**
 * Rate limiter interface
 */
export interface RateLimiter {
  acquire(): Promise<void>;
}
