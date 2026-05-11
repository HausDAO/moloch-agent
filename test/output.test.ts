import test from 'node:test';
import assert from 'node:assert/strict';
import { jsonReplacer } from '../src/output.js';

test('jsonReplacer serializes BigInt values', () => {
  const serialized = JSON.stringify({ blockNumber: 123n, gasUsed: 456n }, jsonReplacer);

  assert.equal(serialized, '{"blockNumber":"123","gasUsed":"456"}');
});
