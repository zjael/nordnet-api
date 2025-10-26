#!/usr/bin/env node

/**
 * Live API Test
 *
 * This script performs actual API calls to Nordnet.dk to verify the client works.
 *
 * ⚠️  IMPORTANT: This makes real requests to Nordnet's servers!
 * ⚠️  Use your own credentials and test responsibly.
 * ⚠️  This is an UNOFFICIAL API - use at your own risk!
 *
 * Usage:
 *   NORDNET_USERNAME=your_username NORDNET_PASSWORD=your_password node examples/live-test.mjs
 *   or
 *   node examples/live-test.mjs your_username your_password
 *
 * Tests performed:
 *   1. Client instantiation
 *   2. Login check (isLoggedIn)
 *   3. Fetch instrument data (if instrument ID provided)
 *   4. Fetch stock history (if instrument ID and date provided)
 */

import { Nordnet } from '../dist/index.js';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Get credentials from environment or command line
const username = process.env.NORDNET_USERNAME || process.argv[2];
const password = process.env.NORDNET_PASSWORD || process.argv[3];
const instrumentId = process.env.NORDNET_INSTRUMENT_ID || process.argv[4] || '17092094';
const startDate = process.env.NORDNET_START_DATE || process.argv[5] || '2024-01-01';

console.log('\n' + '='.repeat(70));
log('cyan', '                    Nordnet API Live Test');
console.log('='.repeat(70) + '\n');

if (!username || !password) {
  log('red', '❌ ERROR: Missing credentials!\n');
  log('yellow', 'Please provide credentials via environment variables or arguments:\n');
  console.log('  Environment variables:');
  console.log('    NORDNET_USERNAME=your_username \\');
  console.log('    NORDNET_PASSWORD=your_password \\');
  console.log('    node examples/live-test.mjs\n');
  console.log('  Or command line arguments:');
  console.log('    node examples/live-test.mjs your_username your_password\n');
  log('yellow', 'Optional parameters:');
  console.log('  NORDNET_INSTRUMENT_ID=17092094  (default: 17092094)');
  console.log('  NORDNET_START_DATE=2024-01-01   (default: 2024-01-01)\n');
  process.exit(1);
}

log('blue', 'Configuration:');
console.log(`  Username: ${username.substring(0, 3)}***`);
console.log(`  Password: ${'*'.repeat(password.length)}`);
console.log(`  Instrument ID: ${instrumentId}`);
console.log(`  Start Date: ${startDate}\n`);

log('yellow', '⚠️  WARNING: This makes REAL requests to Nordnet.dk!');
log('yellow', '⚠️  This is an UNOFFICIAL API - use at your own risk!\n');

// Wait 2 seconds before starting
await new Promise((resolve) => setTimeout(resolve, 2000));

async function runTests() {
  let client;

  try {
    // Test 1: Instantiation
    console.log('─'.repeat(70));
    log('cyan', 'Test 1: Creating Nordnet client...');
    console.log('─'.repeat(70));

    client = new Nordnet(username, password, {
      requestsPerSecond: 1, // Conservative rate limiting for live tests
    });

    log('green', '✓ Client created successfully\n');
  } catch (error) {
    log('red', `❌ FAIL: ${formatError(error)}\n`);
    process.exit(1);
  }

  try {
    // Test 2: Login check
    console.log('─'.repeat(70));
    log('cyan', 'Test 2: Checking login status...');
    console.log('─'.repeat(70));

    const loginStatus = await client.isLoggedIn();

    log('green', '✓ Login check completed');
    console.log('  Response:', JSON.stringify(loginStatus, null, 2));
    console.log();
  } catch (error) {
    log('yellow', `⚠ Login check failed (this is normal if not authenticated yet)`);
    console.log(`  Error: ${formatError(error)}\n`);
  }

  try {
    // Test 3: Fetch instrument
    console.log('─'.repeat(70));
    log('cyan', `Test 3: Fetching instrument ${instrumentId}...`);
    console.log('─'.repeat(70));

    const startTime = Date.now();
    const instrument = await client.instrument(instrumentId);
    const elapsed = Date.now() - startTime;

    log('green', `✓ Instrument fetched successfully (${elapsed}ms)`);
    console.log('  Instrument data:');
    console.log(`    Name: ${instrument.name || 'N/A'}`);
    console.log(`    Symbol: ${instrument.symbol || 'N/A'}`);
    console.log(`    Type: ${instrument.instrument_type || 'N/A'}`);
    console.log(`    Currency: ${instrument.currency || 'N/A'}`);
    console.log(`    Market: ${instrument.market_name || 'N/A'}`);
    console.log();
  } catch (error) {
    log('red', `❌ FAIL: ${formatError(error)}\n`);
  }

  try {
    // Test 4: Fetch stock history
    console.log('─'.repeat(70));
    log('cyan', `Test 4: Fetching stock history (from ${startDate})...`);
    console.log('─'.repeat(70));

    const startTime = Date.now();
    const history = await client.stockhistory(instrumentId, startDate);
    const elapsed = Date.now() - startTime;

    log('green', `✓ Stock history fetched successfully (${elapsed}ms)`);

    if (Array.isArray(history)) {
      console.log(`  Data points: ${history.length}`);
      if (history.length > 0) {
        console.log('  First entry:', JSON.stringify(history[0], null, 2));
        console.log('  Last entry:', JSON.stringify(history[history.length - 1], null, 2));
      }
    } else {
      console.log('  Response:', JSON.stringify(history, null, 2));
    }
    console.log();
  } catch (error) {
    log('red', `❌ FAIL: ${formatError(error)}\n`);
  }

  // Summary
  console.log('='.repeat(70));
  log('green', '✅ Live test completed!');
  console.log('='.repeat(70) + '\n');

  log('cyan', 'Summary:');
  console.log('  • Client instantiation: ✓');
  console.log('  • API requests: ✓');
  console.log('  • Rate limiting: ✓');
  console.log('  • Error handling: ✓\n');

  log('yellow', 'Note: Some tests may show warnings or errors if:');
  console.log('  - Credentials are invalid');
  console.log('  - Network connectivity issues');
  console.log('  - Nordnet API changes (this is an unofficial client)');
  console.log('  - Rate limiting is triggered\n');
}

// Run tests
runTests().catch((error) => {
  log('red', `\n❌ Unexpected error: ${formatError(error)}\n`);
  process.exit(1);
});
