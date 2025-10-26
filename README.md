# nordnet-api

[![npm version](https://img.shields.io/npm/v/nordnet-api.svg)](https://npmjs.org/package/nordnet-api)
[![npm downloads](https://img.shields.io/npm/dm/nordnet-api)](https://npmjs.org/package/nordnet-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

Unofficial TypeScript API client for Nordnet.dk. Supports both ESM and CommonJS.

## Warning

This is an **unofficial** API that works by scraping Nordnet's web interface. It can break at any time if Nordnet changes their website. **Use at your own risk.**

For production use, consider [Nordnet's official External API](https://www.nordnet.dk/externalapi/docs/api).

## Installation

```bash
npm install nordnet-api
```

Requires Node.js >= 18.0.0

## Quick Start

```typescript
import { Nordnet } from 'nordnet-api';

const client = new Nordnet('username', 'password');

// Get instrument data
const instrument = await client.instrument(17092094);

// Get historical prices
const history = await client.stockhistory(17092094, '2024-01-01');

// List stocks by country
const stocks = await client.stocklist('DK');

// List all funds
const funds = await client.fundlist();
```

### CommonJS

```javascript
const { Nordnet } = require('nordnet-api');

const client = new Nordnet('username', 'password');
// Same API as above
```

## API

### `new Nordnet(username, password, options?)`

Create a client instance.

**Options:**
- `requestsPerSecond` - Rate limit (default: 2)

### `client.instrument(id)`

Get instrument details by ID.

### `client.stockhistory(id, startDate)`

Get historical prices. Date format: `YYYY-MM-DD`

### `client.stocklist(country?)`

Get list of stocks. Default country: `DK`

### `client.fundlist()`

Get list of all funds.

### `client.isLoggedIn()`

Check authentication status.

## Configuration

```typescript
const client = new Nordnet('username', 'password', {
  requestsPerSecond: 1  // Conservative rate limiting
});
```

## Error Handling

All methods throw errors. Always use try/catch:

```typescript
try {
  const data = await client.instrument(12345);
} catch (error) {
  console.error('Failed:', error.message);
}
```

## Testing

The package includes test scripts you can run:

```bash
# Test ESM imports
node examples/test-esm.mjs

# Test CommonJS requires
node examples/test-cjs.cjs

# Test against live API (requires credentials)
NORDNET_USERNAME=user NORDNET_PASSWORD=pass node examples/live-test.mjs
```

## Migration from v1.x

v2.0 is a complete rewrite with breaking changes:

1. **Node.js 18+** now required (was 4.x+)
2. **TypeScript** - Full type definitions included
3. **Dual format** - Works with both `import` and `require()`
4. **Rate limiting** - Built-in by default
5. **Better errors** - Descriptive error messages

The API interface remains mostly the same. Update your Node version and you should be good to go.

## Development

```bash
git clone https://github.com/zjael/nordnet-api.git
cd nordnet-api
npm install
npm test
```

**Build:**
```bash
npm run build        # Dual ESM/CJS build
npm run dev          # Watch mode
```

**Test:**
```bash
npm test             # Unit tests
npm run test:watch   # Watch mode
```

**Lint:**
```bash
npm run lint         # Check
npm run lint:fix     # Fix
npm run format       # Prettier
```

## Contributing

Contributions welcome. Please:

1. Fork the repo
2. Create a feature branch
3. Add tests if applicable
4. Run `npm run lint:fix` and `npm test`
5. Submit a PR

## License

MIT

## Disclaimer

This library is not affiliated with or endorsed by Nordnet Bank AB. It may violate Nordnet's Terms of Service. The authors are not responsible for any consequences of using this library.
