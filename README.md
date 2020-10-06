# nordnet-api

[![Package version](https://img.shields.io/npm/v/nordnet-api.svg)](https://npmjs.org/package/nordnet-api)
[![NPM downloads](https://img.shields.io/npm/dm/nordnet-api)](https://npmjs.org/package/nordnet-api)
[![Make a pull request](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

> Nordnet.dk Unofficial API

## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [License](#license)

## Install

```shell script
npm install nordnet-api
```

## Usage

### Get instrument data

```js
const Nordnet = require('nordnet-api');

const nordnet = new Nordnet("username", "password");
const instrument_id = 17092094;
nordnet.instrument(instrument_id)
  .then(console.log)
  .catch(console.error)
```

### Get stock history

```js
const Nordnet = require('nordnet-api');

const nordnet = new Nordnet("username", "password");
const instrument_id = 17092094;
const start_date = '2010-01-01'
nordnet.stockhistory(instrument_id, start_date)
  .then(console.log)
  .catch(console.error)
```

### Get stocklist

```js
const Nordnet = require('nordnet-api');

const nordnet = new Nordnet("username", "password");
nordnet.stocklist()
  .then(console.log)
  .catch(console.error)
```

### Get fundslist

```js
const Nordnet = require('nordnet-api');

const nordnet = new Nordnet("username", "password");
nordnet.fundslist()
  .then(console.log)
  .catch(console.error)
```

## License

MIT
