#!/usr/bin/env node
import { parseArgs, numberFlag, requiredFlag, stringFlag } from './args.js';
import { readJsonFile } from './files.js';
import { helpText } from './help.js';
import { getConfig } from './config.js';
import { createServiceClient } from './service.js';
import { printCompact, printJson } from './output.js';
import {
  asAddress,
  asHex,
  asProposalId,
  buildMemoryPostTx,
  buildProcessTx,
  buildSignalTx,
  buildSponsorTx,
  buildVoteTx,
  maybeSend,
} from './tx.js';

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const service = createServiceClient(config);
  const compact = Boolean(parsed.flags.compact);
  const full = Boolean(parsed.flags.full);
  const send = Boolean(parsed.flags.send);

  let output: unknown;

  switch (parsed.command) {
    case 'help':
    case '--help':
    case '-h':
      process.stdout.write(helpText);
      return;

    case 'health':
      output = await service.health();
      break;

    case 'capabilities':
      output = await service.capabilities();
      break;

    case 'dao':
      output = await service.dao({ dao: requiredFlag(parsed.flags, 'dao') });
      break;

    case 'proposals':
      output = await service.proposals({
        dao: requiredFlag(parsed.flags, 'dao'),
        first: numberFlag(parsed.flags, 'first', 100),
        skip: numberFlag(parsed.flags, 'skip', 0),
      });
      break;

    case 'proposal':
      output = await service.proposal({
        dao: requiredFlag(parsed.flags, 'dao'),
        proposal: requiredFlag(parsed.flags, 'proposal'),
      });
      break;

    case 'members':
      output = await service.members({
        dao: requiredFlag(parsed.flags, 'dao'),
        first: numberFlag(parsed.flags, 'first', 100),
        skip: numberFlag(parsed.flags, 'skip', 0),
      });
      break;

    case 'records':
      output = await service.records({
        dao: requiredFlag(parsed.flags, 'dao'),
        table: stringFlag(parsed.flags, 'table', 'communityMemory') || 'communityMemory',
        first: numberFlag(parsed.flags, 'first', 100),
        skip: numberFlag(parsed.flags, 'skip', 0),
      });
      break;

    case 'pin-json':
      output = await service.pinJson({
        name: stringFlag(parsed.flags, 'name'),
        data: readJsonFile(requiredFlag(parsed.flags, 'file')),
      });
      break;

    case 'vote':
      output = await maybeSend(config, buildVoteTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        proposal: asProposalId(requiredFlag(parsed.flags, 'proposal')),
        approved: parseBool(requiredFlag(parsed.flags, 'approved')),
      }), send);
      break;

    case 'sponsor':
      output = await maybeSend(config, buildSponsorTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        proposal: asProposalId(requiredFlag(parsed.flags, 'proposal')),
      }), send);
      break;

    case 'process':
      output = await maybeSend(config, buildProcessTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        proposal: asProposalId(requiredFlag(parsed.flags, 'proposal')),
        proposalData: asHex(requiredFlag(parsed.flags, 'proposal-data')),
      }), send);
      break;

    case 'memory-post':
      output = await maybeSend(config, buildMemoryPostTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        table: stringFlag(parsed.flags, 'table', 'communityMemory') || 'communityMemory',
        type: stringFlag(parsed.flags, 'type'),
        threadId: stringFlag(parsed.flags, 'thread-id'),
        topicId: stringFlag(parsed.flags, 'topic-id'),
        proposalId: stringFlag(parsed.flags, 'proposal'),
        draftId: stringFlag(parsed.flags, 'draft-id'),
        title: stringFlag(parsed.flags, 'title'),
        body: stringFlag(parsed.flags, 'body') || stringFlag(parsed.flags, 'description'),
        contentURI: stringFlag(parsed.flags, 'content-uri') || stringFlag(parsed.flags, 'link'),
        contentHash: stringFlag(parsed.flags, 'content-hash'),
        workspaceURI: stringFlag(parsed.flags, 'workspace-uri'),
        stateURI: stringFlag(parsed.flags, 'state-uri'),
        agent: stringFlag(parsed.flags, 'agent'),
        version: stringFlag(parsed.flags, 'version'),
        tag: stringFlag(parsed.flags, 'tag'),
      }), send);
      break;

    case 'signal':
      output = await maybeSend(config, buildSignalTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        title: requiredFlag(parsed.flags, 'title'),
        description: stringFlag(parsed.flags, 'description', '') || '',
        link: stringFlag(parsed.flags, 'link') || stringFlag(parsed.flags, 'content-uri'),
      }), send);
      break;

    default:
      throw new Error(`Unknown command: ${parsed.command}\n\n${helpText}`);
  }

  const printable = full ? output : summarizeTxOutput(output);
  if (compact) printCompact(printable);
  else printJson(printable);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});

function parseBool(value: string): boolean {
  if (/^(true|1|yes|y)$/i.test(value)) return true;
  if (/^(false|0|no|n)$/i.test(value)) return false;
  throw new Error('Expected boolean true/false.');
}

function summarizeTxOutput(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if ('summary' in value) {
    const result = value as { summary: unknown; sent?: boolean; hash?: string };
    return {
      summary: result.summary,
      sent: result.sent || false,
      hash: result.hash,
      note: 'Use --full to print unsigned transaction calldata.',
    };
  }
  return value;
}
