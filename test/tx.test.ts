import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMemoryPostTx, buildSignalTx, buildSponsorTx, buildVoteTx } from '../src/tx.js';

const dao = '0x0000000000000000000000000000000000000001';

test('buildVoteTx creates vote transaction summary', () => {
  const built = buildVoteTx({ chainId: 8453, dao, proposal: 12, approved: true });

  assert.equal(built.tx.to, dao);
  assert.equal(built.tx.value, '0');
  assert.match(built.tx.data, /^0x/);
  assert.equal(built.summary.action, 'vote');
  assert.equal(built.summary.proposalId, 12);
});

test('buildSponsorTx creates sponsor transaction summary', () => {
  const built = buildSponsorTx({ chainId: 8453, dao, proposal: 12 });

  assert.equal(built.tx.to, dao);
  assert.match(built.tx.data, /^0x/);
  assert.equal(built.summary.action, 'sponsor');
});

test('buildMemoryPostTx uses community memory defaults', () => {
  const built = buildMemoryPostTx({
    chainId: 8453,
    dao,
    table: 'communityMemory',
    threadId: 'proposal-12',
    body: 'Vote reason.',
  });

  assert.equal(built.tx.to, '0x000000000000cd17345801aa8147b8D3950260FF');
  assert.equal(built.summary.recordTable, 'communityMemory');
  assert.equal(built.summary.threadId, 'proposal-12');
});

test('buildSignalTx creates submitProposal transaction', () => {
  const built = buildSignalTx({
    chainId: 8453,
    dao,
    title: 'Signal',
    description: 'Body',
    link: 'ipfs://example',
  });

  assert.equal(built.tx.to, dao);
  assert.equal(built.summary.proposalKind, 'SIGNAL');
  assert.equal(built.summary.contentURI, 'ipfs://example');
});
