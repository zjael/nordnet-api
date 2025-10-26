#!/usr/bin/env node

/**
 * CommonJS Require Test
 *
 * This script verifies that the CommonJS build works correctly.
 * Run with: node examples/test-cjs.cjs
 */

const { Nordnet } = require('../dist/index.cjs');

console.log('✅ CommonJS Require Test\n');
console.log('Testing: const { Nordnet } = require("nordnet-api")\n');

// Test 1: Class export exists
if (typeof Nordnet !== 'function') {
  console.error('❌ FAIL: Nordnet is not a constructor function');
  process.exit(1);
}
console.log('✓ Nordnet class exported correctly');

// Test 2: Can instantiate without errors (validation will catch missing credentials)
try {
  new Nordnet('test', 'test');
  console.log('✓ Nordnet can be instantiated');
} catch (error) {
  console.error('❌ FAIL: Cannot instantiate Nordnet:', error.message);
  process.exit(1);
}

// Test 3: Instance has expected methods
const client = new Nordnet('test', 'test');
const expectedMethods = ['instrument', 'stockhistory', 'stocklist', 'fundlist', 'isLoggedIn'];

for (const method of expectedMethods) {
  if (typeof client[method] !== 'function') {
    console.error(`❌ FAIL: Missing method: ${method}`);
    process.exit(1);
  }
}
console.log('✓ All expected methods exist:', expectedMethods.join(', '));

// Test 4: Throws error on missing credentials
try {
  new Nordnet('', '');
  console.error('❌ FAIL: Should have thrown error for empty credentials');
  process.exit(1);
} catch (error) {
  console.log('✓ Correctly throws error for invalid credentials');
}

// Test 5: Default export also works
const NordnetDefault = require('../dist/index.cjs');
if (typeof NordnetDefault !== 'undefined' && NordnetDefault.Nordnet) {
  console.log('✓ Named exports work correctly');
}

console.log('\n🎉 All CommonJS require tests passed!\n');
console.log('The package can be imported using:');
console.log('  const { Nordnet } = require("nordnet-api")');
console.log('  or');
console.log('  const Nordnet = require("nordnet-api").Nordnet');
