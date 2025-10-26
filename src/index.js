const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const cookie = require('./cookie.js');

class Nordnet {
  constructor(username, password) {
    this.username = username;
    this.password = password;

    this.cookies = [];
    this.init();
  }

  init() {
    if(!this.username || !this.password) {
      throw new Error("Username and password is required");
    }
  }

  async isLoggedIn() {
    try {
      const res = await fetch('https://www.nordnet.dk/api/2/login', {
        headers: {
          cookie: cookie.join(this.cookies)
        }
      });

      if (!res.ok) {
        throw new Error(`Login check failed: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      throw new Error(`Failed to check login status: ${error.message}`);
    }
  }

  async getNextCookie() {
    try {
      const res1 = await fetch('https://classic.nordnet.dk/oauth2/authorize?client_id=NEXT&response_type=code&redirect_uri=https://www.nordnet.dk/oauth2/', {
        redirect: "manual",
        headers: {
          cookie: cookie.join(this.cookies)
        }
      });

      const redirectURL = res1.headers.get("location");
      if (!redirectURL) {
        throw new Error('No redirect URL received from OAuth authorize');
      }

      const res2 = await fetch(redirectURL, {
        redirect: "manual",
        headers: {
          cookie: cookie.join(this.cookies)
        }
      });

      const setCookies = res2.headers.raw()['set-cookie'];
      if (!setCookies) {
        throw new Error('No cookies received from OAuth callback');
      }

      const parsed = cookie.parse(setCookies);
      if (!parsed['NEXT']) {
        throw new Error('NEXT cookie not found in response');
      }

      this.cookies['NEXT'] = parsed['NEXT'];
    } catch (error) {
      throw new Error(`Failed to get NEXT cookie: ${error.message}`);
    }
  }

  async _request(url, options = {}) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          cookie: cookie.join(this.cookies)
        }
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
      throw new Error(`Request to ${url} failed: ${error.message}`);
    }
  }

  async _login() {
    try {
      // Step 1: Get initial cookies
      const res1 = await fetch('https://classic.nordnet.dk/mux/login/start.html?cmpi=start-loggain&state=signin');
      const setCookies1 = res1.headers.raw()['set-cookie'];
      if (!setCookies1) {
        throw new Error('No cookies received from login start');
      }

      const parsed1 = cookie.parse(setCookies1);
      if (!parsed1['LOL'] || !parsed1['TUX-COOKIE']) {
        throw new Error('Required cookies (LOL, TUX-COOKIE) not found');
      }

      this.cookies['LOL'] = parsed1['LOL'];
      this.cookies['TUX-COOKIE'] = parsed1['TUX-COOKIE'];

      // Step 2: Anonymous login
      const res2 = await fetch('https://classic.nordnet.dk/api/2/login/anonymous', {
        method: 'POST',
        headers: {
          cookie: cookie.join(this.cookies)
        }
      });

      if (!res2.ok) {
        throw new Error(`Anonymous login failed: ${res2.status} ${res2.statusText}`);
      }

      const setCookies2 = res2.headers.raw()['set-cookie'];
      if (!setCookies2) {
        throw new Error('No cookies received from anonymous login');
      }

      const parsed2 = cookie.parse(setCookies2);
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
          cookie: cookie.join(this.cookies)
        }
      });

      if (!res3.ok) {
        throw new Error(`Authentication failed: ${res3.status} ${res3.statusText}`);
      }

      const setCookies3 = res3.headers.raw()['set-cookie'];
      if (!setCookies3) {
        throw new Error('No cookies received from authentication');
      }

      const parsed3 = cookie.parse(setCookies3);
      if (!parsed3['NOW'] || !parsed3['xsrf']) {
        throw new Error('Required cookies (NOW, xsrf) not found after authentication');
      }

      this.cookies['NOW'] = parsed3['NOW'];
      this.cookies['xsrf'] = parsed3['xsrf'];
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async instrument(id) {
    try {
      if (!id) {
        throw new Error('Instrument ID is required');
      }

      const res = await this._request(`https://www.nordnet.dk/api/2/instruments/${id}`);
      return await res.json();
    } catch (error) {
      throw new Error(`Failed to fetch instrument ${id}: ${error.message}`);
    }
  }

  async stockhistory(id, start_date) {
    try {
      if (!id) {
        throw new Error('Instrument ID is required');
      }
      if (!start_date) {
        throw new Error('Start date is required');
      }

      const url = `https://www.nordnet.dk/api/2/instruments/historical/prices/${id}?`;
      const params = new URLSearchParams({
        "from": start_date,
        "fields": "last"
      });

      const res = await this._request(url + params);
      return await res.json();
    } catch (error) {
      throw new Error(`Failed to fetch stock history for ${id}: ${error.message}`);
    }
  }

  async fundlist() {
    try {
      const limit = 50;
      let offset = 0;
      let total = 0;
      let result = [];
      const maxIterations = 1000; // Prevent infinite loops
      let iterations = 0;

      do {
        if (iterations++ >= maxIterations) {
          throw new Error('Maximum iterations reached - possible API issue');
        }

        const url = `https://www.nordnet.dk/api/2/instrument_search/query/fundlist?`;
        const params = new URLSearchParams({
          "sort_attribute": "yield_1y",
          "sort_order": "desc",
          "limit": limit,
          "offset": offset,
          "free_text_search": ""
        });

        const res = await this._request(url + params);
        const data = await res.json();

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
      throw new Error(`Failed to fetch fund list: ${error.message}`);
    }
  }

  async stocklist(exchange_country = "DK") {
    try {
      if (!exchange_country) {
        throw new Error('Exchange country is required');
      }

      const limit = 100;
      let offset = 0;
      let total = 0;
      let result = [];
      const maxIterations = 1000; // Prevent infinite loops
      let iterations = 0;

      do {
        if (iterations++ >= maxIterations) {
          throw new Error('Maximum iterations reached - possible API issue');
        }

        const url = `https://www.nordnet.dk/api/2/instrument_search/query/stocklist?`;
        const params = new URLSearchParams({
          "sort_attribute": "diff_pct",
          "sort_order": "desc",
          "limit": limit,
          "offset": offset,
          "free_text_search": "",
          "apply_filters": `exchange_country=${exchange_country}`
        });

        const res = await this._request(url + params);
        const data = await res.json();

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
      throw new Error(`Failed to fetch stock list: ${error.message}`);
    }
  }
}

module.exports = Nordnet;