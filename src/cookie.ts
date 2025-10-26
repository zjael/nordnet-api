import type { CookieStore } from './types.js';

/**
 * Parse Set-Cookie headers into a cookie store
 * @param raw - Array of Set-Cookie header values
 * @returns Parsed cookie store with name-value pairs
 */
export function parse(raw: string[]): CookieStore {
  const parsed: CookieStore = {};

  for (const cookie of raw) {
    const [pair] = cookie.split(';');
    if (!pair) continue;

    const [name, value] = pair.split('=');
    if (!name) continue;

    parsed[name.trim()] = value ? value.trim() : '';
  }

  return parsed;
}

/**
 * Join cookie store into a Cookie header string
 * @param store - Cookie store object
 * @returns Cookie header string (e.g., "name1=value1; name2=value2")
 */
export function join(store: CookieStore): string {
  return Object.keys(store)
    .map((name) => `${name}=${store[name]}`)
    .join('; ');
}
