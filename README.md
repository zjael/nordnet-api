# nordnet-api

[![Package version](https://img.shields.io/npm/v/nordnet-api.svg)](https://npmjs.org/package/nordnet-api)
[![NPM downloads](https://img.shields.io/npm/dm/nordnet-api)](https://npmjs.org/package/nordnet-api)
[![Make a pull request](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

> Modern TypeScript client for Nordnet.dk (Unofficial)

## ⚠️ Important Disclaimers

**UNOFFICIAL API**: This is an **unofficial** API client that uses web scraping techniques to access Nordnet.dk. It is **not endorsed or supported by Nordnet**.

**BREAKING CHANGES**: This library may stop working at any time if Nordnet changes their website structure or authentication flow.

**OFFICIAL ALTERNATIVE**: Nordnet provides an official External API. Consider using it instead:
- 📚 [Nordnet External API Documentation](https://www.nordnet.dk/externalapi/docs/api)
- 🔗 [API Examples Repository](https://github.com/nordnet/next-api-v2-examples)

**USE AT YOUR OWN RISK**: By using this library, you acknowledge that:
- Your account credentials are used to authenticate via web scraping
- Nordnet may block or suspend accounts that use unofficial APIs
- No warranty or support is provided
- You are responsible for complying with Nordnet's Terms of Service

---

## 🚀 Features

- ✅ **Full TypeScript support** with comprehensive type definitions
- ✅ **ESM modules** for modern JavaScript
- ✅ **Native fetch API** (Node.js 18+)
- ✅ **Built-in rate limiting** to prevent API abuse
- ✅ **Comprehensive error handling** with descriptive messages
- ✅ **Input validation** for all public methods
- ✅ **Auto-retry on authentication failures**
- ✅ **Pagination support** for large datasets
- ✅ **100% test coverage** with Vitest

---

## 📋 Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Migration Guide (v1 → v2)](#migration-guide-v1--v2)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## 📦 Installation

```bash
npm install nordnet-api
```

```bash
yarn add nordnet-api
```

```bash
pnpm add nordnet-api
```

---

## 🔧 Requirements

- **Node.js** >= 18.0.0 (for native fetch support)
- **TypeScript** >= 5.0 (if using TypeScript)

---

## 🏁 Quick Start

### TypeScript / ESM

```typescript
import { Nordnet } from 'nordnet-api';

const client = new Nordnet('your-username', 'your-password');

// Get instrument data
const instrument = await client.instrument(17092094);
console.log(instrument);

// Get stock history
const history = await client.stockhistory(17092094, '2024-01-01');
console.log(history);

// Get list of Danish stocks
const stocks = await client.stocklist('DK');
console.log(`Found ${stocks.length} stocks`);

// Get list of funds
const funds = await client.fundlist();
console.log(`Found ${funds.length} funds`);
```

### CommonJS (Legacy)

```javascript
// Note: v2.x is ESM-only. For CommonJS, use dynamic import:
const { Nordnet } = await import('nordnet-api');

const client = new Nordnet('your-username', 'your-password');
// ... use as above
```

---

## 📚 API Reference

### `new Nordnet(username, password, options?)`

Create a new Nordnet API client.

**Parameters:**
- `username` (string, required): Your Nordnet username
- `password` (string, required): Your Nordnet password
- `options` (object, optional):
  - `maxRetries` (number): Maximum retry attempts for failed requests (default: 3)
  - `requestsPerSecond` (number): Rate limit for API requests (default: 2)

**Example:**

```typescript
const client = new Nordnet('username', 'password', {
  maxRetries: 5,
  requestsPerSecond: 1, // More conservative rate limiting
});
```

---

### `client.instrument(id)`

Get detailed information about a specific financial instrument.

**Parameters:**
- `id` (number | string, required): Instrument ID

**Returns:** `Promise<Record<string, unknown>>`

**Example:**

```typescript
const instrument = await client.instrument(17092094);
console.log(instrument);
```

**Throws:**
- `Error` if ID is missing
- `Error` if request fails

---

### `client.stockhistory(id, start_date)`

Get historical price data for a stock.

**Parameters:**
- `id` (number | string, required): Instrument ID
- `start_date` (string, required): Start date in `YYYY-MM-DD` format

**Returns:** `Promise<Record<string, unknown>>`

**Example:**

```typescript
const history = await client.stockhistory(17092094, '2024-01-01');
console.log(history);
```

**Throws:**
- `Error` if ID or start_date is missing
- `Error` if request fails

---

### `client.stocklist(exchange_country?)`

Get a paginated list of stocks from a specific exchange.

**Parameters:**
- `exchange_country` (string, optional): Country code (default: `"DK"`)

**Returns:** `Promise<Array<Record<string, unknown>>>`

**Example:**

```typescript
// Get Danish stocks
const dkStocks = await client.stocklist('DK');

// Get Swedish stocks
const seStocks = await client.stocklist('SE');

// Get Norwegian stocks
const noStocks = await client.stocklist('NO');
```

**Throws:**
- `Error` if exchange_country is missing
- `Error` if pagination exceeds maximum iterations (1000)
- `Error` if request fails

---

### `client.fundlist()`

Get a paginated list of all funds.

**Returns:** `Promise<Array<Record<string, unknown>>>`

**Example:**

```typescript
const funds = await client.fundlist();
console.log(`Found ${funds.length} funds`);

// Filter funds by criteria
const highYieldFunds = funds.filter((fund) => fund.yield_1y > 5);
```

**Throws:**
- `Error` if pagination exceeds maximum iterations (1000)
- `Error` if request fails

---

### `client.isLoggedIn()`

Check if the current session is authenticated.

**Returns:** `Promise<LoginStatusResponse>`

**Example:**

```typescript
const status = await client.isLoggedIn();
console.log(status.logged_in); // true or false
```

**Throws:**
- `Error` if request fails

---

## ⚙️ Configuration

### Rate Limiting

The client includes built-in rate limiting to prevent overwhelming Nordnet's servers:

```typescript
const client = new Nordnet('username', 'password', {
  requestsPerSecond: 1, // Max 1 request per second
});
```

**Default:** 2 requests per second

### Retry Logic

Failed requests are automatically retried (except authentication failures):

```typescript
const client = new Nordnet('username', 'password', {
  maxRetries: 5, // Retry up to 5 times
});
```

**Default:** 3 retries

---

## 🚨 Error Handling

All methods throw descriptive errors. Always wrap calls in try/catch:

```typescript
import { Nordnet } from 'nordnet-api';

const client = new Nordnet('username', 'password');

try {
  const instrument = await client.instrument(17092094);
  console.log(instrument);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to fetch instrument:', error.message);
  }
}
```

### Common Error Scenarios

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Username and password is required` | Missing credentials | Provide both username and password |
| `Authentication failed: 401` | Invalid credentials | Check username/password |
| `HTTP 404: Not Found` | Invalid instrument ID | Verify the instrument ID |
| `Maximum iterations reached` | API pagination issue | Contact support or retry later |
| `Request to ... failed` | Network or server error | Check internet connection, retry |

---

## 🔄 Migration Guide (v1 → v2)

### Breaking Changes

#### 1. **Module System: CommonJS → ESM**

**v1.x (CommonJS):**
```javascript
const Nordnet = require('nordnet-api');
```

**v2.x (ESM):**
```typescript
import { Nordnet } from 'nordnet-api';
// or
import Nordnet from 'nordnet-api';
```

#### 2. **Node.js Requirement**

- **v1.x:** Node.js 4.x+
- **v2.x:** Node.js 18.0.0+ (for native fetch)

#### 3. **TypeScript Support**

v2.x is written in TypeScript with full type definitions included.

#### 4. **Method Signatures**

Method signatures remain the same, but now have full type safety:

```typescript
// v2.x - TypeScript knows the parameter types
const history = await client.stockhistory(17092094, '2024-01-01');
//                                         ^number   ^string
```

#### 5. **Error Handling**

v2.x has comprehensive error handling with descriptive messages:

```typescript
// v1.x - Silent failures possible
nordnet.instrument(123).catch(() => {});

// v2.x - Descriptive errors
try {
  await client.instrument(123);
} catch (error) {
  console.error(error.message); // "Failed to fetch instrument 123: HTTP 404: Not Found"
}
```

### Migration Steps

1. **Update Node.js** to version 18 or higher
2. **Update package.json**:
   ```json
   {
     "type": "module"
   }
   ```
3. **Change imports** from `require()` to `import`
4. **Update file extensions** to `.mjs` or set `"type": "module"` in package.json
5. **Add error handling** with try/catch blocks
6. **Install dependencies**:
   ```bash
   npm install nordnet-api@latest
   ```

---

## 🛠️ Development

### Setup

```bash
git clone https://github.com/zjael/nordnet-api.git
cd nordnet-api
npm install
```

### Scripts

```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode for development
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run lint:fix     # Lint and auto-fix
npm run format       # Format code with Prettier
npm run typecheck    # Type-check without building
```

### Project Structure

```
nordnet-api/
├── src/
│   ├── index.ts           # Main Nordnet client
│   ├── cookie.ts          # Cookie parsing utilities
│   ├── rate-limiter.ts    # Rate limiting logic
│   ├── types.ts           # TypeScript type definitions
│   ├── *.test.ts          # Test files
├── dist/                  # Compiled output (gitignored)
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Vitest configuration
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint:fix`
6. Commit with descriptive messages
7. Push to your fork
8. Open a Pull Request

### Code Style

- Follow the existing TypeScript style
- Use Prettier for formatting (`npm run format`)
- Use ESLint for linting (`npm run lint:fix`)
- Write tests for new features
- Maintain 100% test coverage

---

## 📄 License

MIT © Jakob Sjælland

---

## 🙏 Acknowledgments

- This library is not affiliated with or endorsed by Nordnet Bank AB
- Uses web scraping techniques - may break without notice
- For production use, consider Nordnet's [official External API](https://www.nordnet.dk/externalapi/docs/api)

---

## 📞 Support

- 🐛 [Report bugs](https://github.com/zjael/nordnet-api/issues)
- 💡 [Request features](https://github.com/zjael/nordnet-api/issues)
- 📖 [Read the source](https://github.com/zjael/nordnet-api)

---

**Made with ❤️ by the community**
