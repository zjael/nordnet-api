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
    if(!this.username | !this.password) {
      throw new Error("Username and password is required");
    }
  }

  async isLoggedIn() {
    return fetch('https://www.nordnet.dk/api/2/login', {
      headers: {
        cookie: cookie.join(this.cookies)
      }
    }).then(res => res.json())
  }

  async getNextCookie() {
    const redirectURL = await fetch('https://classic.nordnet.dk/oauth2/authorize?client_id=NEXT&response_type=code&redirect_uri=https://www.nordnet.dk/oauth2/', {
      redirect: "manual",
      headers: {
        cookie: cookie.join(this.cookies)
      }
    }).then(res => res.headers.get("location"))

    await fetch(redirectURL, {
      redirect: "manual",
      headers: {
        cookie: cookie.join(this.cookies)
      }
    }).then(res => {
      const parsed = cookie.parse(res.headers.raw()['set-cookie']);
      this.cookies['NEXT'] = parsed['NEXT'];
    })
  }

  async _request(url, options = {}) {
    const fn = () => {
      return fetch(url, {
        ...Object.assign(options, {
          headers: {
            cookie: cookie.join(this.cookies)
          }
        })
      })
    }

    const res = await fn();
    if(res.status === 401) {
      await this._login();
      return this._request(url, options);
    }
    return res;
  }

  async _login() {
    await fetch('https://classic.nordnet.dk/mux/login/start.html?cmpi=start-loggain&state=signin').then(res => {
      const parsed = cookie.parse(res.headers.raw()['set-cookie']);
      this.cookies['LOL'] = parsed['LOL'];
      this.cookies['TUX-COOKIE'] = parsed['TUX-COOKIE'];
    })

    await fetch('https://classic.nordnet.dk/api/2/login/anonymous', {
      method: 'POST',
      headers: {
        cookie: cookie.join(this.cookies)
      }
    }).then(res => {
      const parsed = cookie.parse(res.headers.raw()['set-cookie']);
      this.cookies['NOW'] = parsed['NOW'];
    })

    const params = new URLSearchParams();
    params.append('username', this.username);
    params.append('password', this.password);
    await fetch('https://classic.nordnet.dk/api/2/authentication/basic/login', {
      method: 'POST',
      body: params,
      headers: {
        cookie: cookie.join(this.cookies)
      }
    }).then(res => {
      const parsed = cookie.parse(res.headers.raw()['set-cookie']);
      this.cookies['NOW'] = parsed['NOW'];
      this.cookies['xsrf'] = parsed['xsrf'];
    })
  }

  instrument(id) {
    return this._request(`https://www.nordnet.dk/api/2/instruments/${id}`)
      .then(res => res.json())
  }

  stockhistory(id, start_date) {
    const url = `https://www.nordnet.dk/api/2/instruments/historical/prices/${id}?`
    const params = new URLSearchParams({
      "from": start_date,
      "fields": "last"
    })
    return this._request(url + params)
      .then(res => res.json())
  }

  async fundlist() {
    const limit = 50;
    let offset = 0;
    let total = 0;
    let result = [];

    do {
      const url = `https://www.nordnet.dk/api/2/instrument_search/query/fundlist?`
      const params = new URLSearchParams({
        "sort_attribute": "yield_1y",
        "sort_order": "desc",
        "limit": limit,
        "offset": offset,
        "free_text_search": ""
      })
      const { rows, total_hits, results } = await this._request(url + params).then(res => res.json())
      offset = offset + limit;
      total = total_hits;
      result = result.concat(results);
    } while (result.length < total);

    return result;
  }

  async stocklist(exchange_country = "DK") {
    const limit = 100;
    let offset = 0;
    let total = 0;
    let result = [];

    do {
      const url = `https://www.nordnet.dk/api/2/instrument_search/query/stocklist?`
      const params = new URLSearchParams({
        "sort_attribute": "diff_pct",
        "sort_order": "desc",
        "limit": limit,
        "offset": offset,
        "free_text_search": "",
        "apply_filters": `exchange_country=${exchange_country}`
      })
      const { rows, total_hits, results } = await this._request(url + params).then(res => res.json())
      offset = offset + limit;
      total = total_hits;
      result = result.concat(results);
    } while (result.length < total);

    return result;
  }
}

module.exports = Nordnet;