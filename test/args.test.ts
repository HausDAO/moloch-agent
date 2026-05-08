import test from 'node:test';
import assert from 'node:assert/strict';
import { numberFlag, parseArgs, requiredFlag, stringFlag } from '../src/args.js';

test('parseArgs parses command, flags, and positionals', () => {
  const parsed = parseArgs(['records', '--dao', '0xabc', 'extra', '--compact']);

  assert.equal(parsed.command, 'records');
  assert.equal(parsed.flags.dao, '0xabc');
  assert.equal(parsed.flags.compact, true);
  assert.deepEqual(parsed.positionals, ['extra']);
});

test('requiredFlag throws on missing flag', () => {
  assert.throws(() => requiredFlag({}, 'dao'), /Missing required --dao/);
});

test('stringFlag and numberFlag return values', () => {
  const flags = { table: 'communityMemory', first: '25' };

  assert.equal(stringFlag(flags, 'table'), 'communityMemory');
  assert.equal(numberFlag(flags, 'first', 100), 25);
  assert.equal(numberFlag(flags, 'skip', 0), 0);
});
