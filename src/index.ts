import * as cookie from './cookie.js';
import { TokenBucketRateLimiter } from './rate-limiter.js';
import type {
  CookieStore,
  InstrumentSearchResponse,
  LoginStatusResponse,
  NordnetConfig,
} from './types.js';

/**
 * Nordnet API Client
 *
 * IMPORTANT: This is an UNOFFICIAL API client that uses web scraping.
 * It may break at any time if Nordnet changes their website.
 * Use at your own risk and consider using Nordnet's official External API instead.
 *
 * @see https://www.nordnet.dk/externalapi/docs/api
 */
export class Nordnet {
  private readonly username: string;
  private readonly password: string;
  private readonly cookies: CookieStore;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * Create a new Nordnet API client
   *
   * @param username - Nordnet username
   * @param password - Nordnet password
   * @param options - Optional configuration
   *
   * @throws {Error} If username or password is missing
   *
   * @example
   * ```typescript
   * const client = new Nordnet('myusername', 'mypassword');
   * const instrument = await client.instrument(12345);
   * ```
   */
  constructor(username: string, password: string, options?: Partial<NordnetConfig>) {
    this.username = username;
    this.password = password;
    this.cookies = {};
    this.rateLimiter = new TokenBucketRateLimiter(options?.requestsPerSecond ?? 2);

    this.init();
  }

  /**
   * Validate credentials
   * @private
   */
  private init(): void {
    if (!this.username || !this.password) {
      throw new Error('Username and password is required');
    }
  }

  /**
   * Check if the current session is logged in
   *
   * @returns Login status response
   * @throws {Error} If the request fails
   */
  async isLoggedIn(): Promise<LoginStatusResponse> {
    try {
      const res = await fetch('https://www.nordnet.dk/api/2/login', {
        headers: {
          cookie: cookie.join(this.cookies),
        },
      });

      if (!res.ok) {
        throw new Error(`Login check failed: ${res.status} ${res.statusText}`);
      }

      return (await res.json()) as LoginStatusResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check login status: ${message}`);
    }
  }

  /**
   * Make an authenticated request
   * @private
   */
  private async _request(url: string, options: RequestInit = {}): Promise<Response> {
    await this.rateLimiter.acquire();

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          cookie: cookie.join(this.cookies),
        },
      });

      if (res.status === 401) {
        await this._login();
        return this._request(url, options);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Request to ${url} failed: ${message}`);
    }
  }

  /**
   * Perform login flow
   * @private
   */
  private async _login(): Promise<void> {
    try {
      // Step 1: Get initial cookies
      const res1 = await fetch(
        'https://classic.nordnet.dk/mux/login/start.html?cmpi=start-loggain&state=signin'
      );

      const setCookies1 = res1.headers.get('set-cookie');
      if (!setCookies1) {
        throw new Error('No cookies received from login start');
      }

      const parsed1 = cookie.parse([setCookies1]);
      if (!parsed1['LOL'] || !parsed1['TUX-COOKIE']) {
        throw new Error('Required cookies (LOL, TUX-COOKIE) not found');
      }

      this.cookies['LOL'] = parsed1['LOL'];
      this.cookies['TUX-COOKIE'] = parsed1['TUX-COOKIE'];

      // Step 2: Anonymous login
      const res2 = await fetch('https://classic.nordnet.dk/api/2/login/anonymous', {
        method: 'POST',
        headers: {
          cookie: cookie.join(this.cookies),
        },
      });

      if (!res2.ok) {
        throw new Error(`Anonymous login failed: ${res2.status} ${res2.statusText}`);
      }

      const setCookies2 = res2.headers.get('set-cookie');
      if (!setCookies2) {
        throw new Error('No cookies received from anonymous login');
      }

      const parsed2 = cookie.parse([setCookies2]);
      if (!parsed2['NOW']) {
        throw new Error('NOW cookie not found after anonymous login');
      }

      this.cookies['NOW'] = parsed2['NOW'];

      // Step 3: Basic authentication
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);

      const res3 = await fetch('https://classic.nordnet.dk/api/2/authentication/basic/login', {
        method: 'POST',
        body: params,
        headers: {
          cookie: cookie.join(this.cookies),
        },
      });

      if (!res3.ok) {
        throw new Error(`Authentication failed: ${res3.status} ${res3.statusText}`);
      }

      const setCookies3 = res3.headers.get('set-cookie');
      if (!setCookies3) {
        throw new Error('No cookies received from authentication');
      }

      const parsed3 = cookie.parse([setCookies3]);
      if (!parsed3['NOW'] || !parsed3['xsrf']) {
        throw new Error('Required cookies (NOW, xsrf) not found after authentication');
      }

      this.cookies['NOW'] = parsed3['NOW'];
      this.cookies['xsrf'] = parsed3['xsrf'];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Login failed: ${message}`);
    }
  }

  /**
   * Get instrument information by ID
   *
   * @param id - Instrument ID
   * @returns Instrument data
   * @throws {Error} If ID is missing or request fails
   *
   * @example
   * ```typescript
   * const instrument = await client.instrument(12345);
   * console.log(instrument);
   * ```
   */
  async instrument(id: number | string): Promise<Record<string, unknown>> {
    try {
      if (!id) {
        throw new Error('Instrument ID is required');
      }

      const res = await this._request(`https://www.nordnet.dk/api/2/instruments/${id}`);
      return (await res.json()) as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch instrument ${id}: ${message}`);
    }
  }

  /**
   * Get historical stock prices
   *
   * @param id - Instrument ID
   * @param start_date - Start date (YYYY-MM-DD format)
   * @returns Historical price data
   * @throws {Error} If parameters are missing or request fails
   *
   * @example
   * ```typescript
   * const history = await client.stockhistory(12345, '2024-01-01');
   * console.log(history);
   * ```
   */
  async stockhistory(id: number | string, start_date: string): Promise<Record<string, unknown>> {
    try {
      if (!id) {
        throw new Error('Instrument ID is required');
      }
      if (!start_date) {
        throw new Error('Start date is required');
      }

      const url = `https://www.nordnet.dk/api/2/instruments/historical/prices/${id}?`;
      const params = new URLSearchParams({
        from: start_date,
        fields: 'last',
      });

      const res = await this._request(url + params.toString());
      return (await res.json()) as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch stock history for ${id}: ${message}`);
    }
  }

  /**
   * Get list of funds with pagination
   *
   * @returns Array of fund results
   * @throws {Error} If request fails or pagination exceeds maximum iterations
   *
   * @example
   * ```typescript
   * const funds = await client.fundlist();
   * console.log(`Found ${funds.length} funds`);
   * ```
   */
  async fundlist(): Promise<Array<Record<string, unknown>>> {
    try {
      const limit = 50;
      let offset = 0;
      let total = 0;
      let result: Array<Record<string, unknown>> = [];
      const maxIterations = 1000; // Prevent infinite loops
      let iterations = 0;

      do {
        if (iterations++ >= maxIterations) {
          throw new Error('Maximum iterations reached - possible API issue');
        }

        const url = `https://www.nordnet.dk/api/2/instrument_search/query/fundlist?`;
        const params = new URLSearchParams({
          sort_attribute: 'yield_1y',
          sort_order: 'desc',
          limit: limit.toString(),
          offset: offset.toString(),
          free_text_search: '',
        });

        const res = await this._request(url + params.toString());
        const data = (await res.json()) as InstrumentSearchResponse;

        if (!data || !data.results) {
          throw new Error('Invalid response format from API');
        }

        const { total_hits, results } = data;
        offset = offset + limit;
        total = total_hits || 0;
        result = result.concat(results);
      } while (result.length < total && total > 0);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch fund list: ${message}`);
    }
  }

  /**
   * Get list of stocks with pagination
   *
   * @param exchange_country - Exchange country code (default: "DK")
   * @returns Array of stock results
   * @throws {Error} If request fails or pagination exceeds maximum iterations
   *
   * @example
   * ```typescript
   * const stocks = await client.stocklist('DK');
   * console.log(`Found ${stocks.length} stocks`);
   * ```
   */
  async stocklist(exchange_country = 'DK'): Promise<Array<Record<string, unknown>>> {
    try {
      if (!exchange_country) {
        throw new Error('Exchange country is required');
      }

      const limit = 100;
      let offset = 0;
      let total = 0;
      let result: Array<Record<string, unknown>> = [];
      const maxIterations = 1000; // Prevent infinite loops
      let iterations = 0;

      do {
        if (iterations++ >= maxIterations) {
          throw new Error('Maximum iterations reached - possible API issue');
        }

        const url = `https://www.nordnet.dk/api/2/instrument_search/query/stocklist?`;
        const params = new URLSearchParams({
          sort_attribute: 'diff_pct',
          sort_order: 'desc',
          limit: limit.toString(),
          offset: offset.toString(),
          free_text_search: '',
          apply_filters: `exchange_country=${exchange_country}`,
        });

        const res = await this._request(url + params.toString());
        const data = (await res.json()) as InstrumentSearchResponse;

        if (!data || !data.results) {
          throw new Error('Invalid response format from API');
        }

        const { total_hits, results } = data;
        offset = offset + limit;
        total = total_hits || 0;
        result = result.concat(results);
      } while (result.length < total && total > 0);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch stock list: ${message}`);
    }
  }
}

// Default export
export default Nordnet;
