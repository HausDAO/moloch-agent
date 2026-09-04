import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultRpcUrl,
  explorerBaseUrl,
  safeApiBaseUrl,
  transactionChain,
} from '../src/networks.js';

test('Gnosis chain services resolve consistently', () => {
  assert.equal(transactionChain(100).id, 100);
  assert.equal(defaultRpcUrl(100), 'https://rpc.gnosischain.com');
  assert.equal(explorerBaseUrl(100), 'https://gnosisscan.io');
  assert.equal(safeApiBaseUrl(100), 'https://safe-transaction-gnosis-chain.safe.global');
});

test('direct operations reject unconfigured chains', () => {
  assert.throws(() => transactionChain(10), /not configured/);
  assert.throws(() => explorerBaseUrl(10), /not configured/);
  assert.throws(() => safeApiBaseUrl(10), /not configured/);
});
