const assert = require('node:assert/strict');
const test = require('node:test');
const expand = require('./index.cjs');

test('preserves the callable API required by minimatch 3', () => {
  assert.deepEqual(expand('table-{one,two}'), ['table-one', 'table-two']);
});

test('also exposes the patched v5 named API', () => {
  assert.deepEqual(expand.expand('table-{one,two}'), ['table-one', 'table-two']);
  assert.equal(typeof expand.EXPANSION_MAX_LENGTH, 'number');
});
