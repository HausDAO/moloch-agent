#!/usr/bin/env node
import { parseArgs, numberFlag, requiredFlag, stringFlag } from './args.js';
import { readJsonFile } from './files.js';
import { helpText } from './help.js';
import { getConfig } from './config.js';
import { createServiceClient } from './service.js';
import { printCompact, printJson } from './output.js';
import { buildOldestReadyProcessTx, processQueue, proposalLifecycle, readDaoDirect, readProposalDirect } from './chain.js';
import {
  asAddress,
  asHex,
  asProposalId,
  buildDaoMetaTx,
  buildMemoryPostTx,
  buildMintSharesTx,
  buildProcessTx,
  buildSignalTx,
  buildSponsorTx,
  buildSummonTx,
  buildTributeTx,
  buildVoteTx,
  maybeSend,
  parseBaalTokenUnits,
  parseBigint,
} from './tx.js';

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const service = createServiceClient(config);
  const compact = Boolean(parsed.flags.compact);
  const full = Boolean(parsed.flags.full);
  const send = !parsed.flags['build-only'] && process.env.MOLOCH_SEND_DEFAULT !== 'false';

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

    case 'read-dao':
      output = await readDaoDirect(config, asAddress(requiredFlag(parsed.flags, 'dao')));
      break;

    case 'read-proposal':
      output = await readProposalDirect(config, asAddress(requiredFlag(parsed.flags, 'dao')), asProposalId(requiredFlag(parsed.flags, 'proposal')));
      break;

    case 'proposal-lifecycle':
      output = await proposalLifecycle({
        config,
        service,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        proposal: asProposalId(requiredFlag(parsed.flags, 'proposal')),
      });
      break;

    case 'process-queue':
      output = await processQueue({
        config,
        service,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        first: numberFlag(parsed.flags, 'first', 100),
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

    case 'summon':
      output = await maybeSend(config, buildSummonTx({
        chainId: config.chainId,
        params: readJsonFile(requiredFlag(parsed.flags, 'params')) as Parameters<typeof buildSummonTx>[0]['params'],
      }), send);
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
        gasLimit: optionalBigint(parsed.flags, 'gas-limit') || optionalBigint(parsed.flags, 'process-gas-limit'),
      }), send);
      break;

    case 'process-ready':
      output = await maybeSend(config, await buildOldestReadyProcessTx({
        config,
        service,
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        first: numberFlag(parsed.flags, 'first', 100),
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
        expiration: numberFlag(parsed.flags, 'expiration', 0),
        baalGas: optionalBigint(parsed.flags, 'baal-gas'),
        proposalOffering: optionalBigint(parsed.flags, 'value'),
      }), send);
      break;

    case 'dao-meta':
      output = await maybeSend(config, buildDaoMetaTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        title: stringFlag(parsed.flags, 'title'),
        description: stringFlag(parsed.flags, 'description'),
        link: stringFlag(parsed.flags, 'link') || stringFlag(parsed.flags, 'content-uri'),
        name: stringFlag(parsed.flags, 'name'),
        daoDescription: stringFlag(parsed.flags, 'dao-description'),
        communityMemoryURI: stringFlag(parsed.flags, 'community-memory-uri'),
        proposalWorkspaceURI: stringFlag(parsed.flags, 'proposal-workspace-uri'),
        sharedStateURI: stringFlag(parsed.flags, 'shared-state-uri'),
        web: stringFlag(parsed.flags, 'web'),
        expiration: numberFlag(parsed.flags, 'expiration', 0),
        baalGas: optionalBigint(parsed.flags, 'baal-gas'),
        proposalOffering: optionalBigint(parsed.flags, 'value'),
      }), send);
      break;

    case 'tribute':
    case 'join-dao':
      output = await maybeSend(config, buildTributeTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        title: stringFlag(parsed.flags, 'title'),
        description: stringFlag(parsed.flags, 'description'),
        link: stringFlag(parsed.flags, 'link') || stringFlag(parsed.flags, 'content-uri'),
        token: stringFlag(parsed.flags, 'token', 'ETH'),
        amount: optionalBigint(parsed.flags, 'amount-raw') || parseBigint(stringFlag(parsed.flags, 'amount', '0') || '0'),
        shares: optionalBigint(parsed.flags, 'shares-raw') || parseBaalTokenUnits(stringFlag(parsed.flags, 'shares', '0') || '0'),
        loot: optionalBigint(parsed.flags, 'loot-raw') || parseBaalTokenUnits(stringFlag(parsed.flags, 'loot', '0') || '0'),
        expiration: numberFlag(parsed.flags, 'expiration', 0),
        baalGas: optionalBigint(parsed.flags, 'baal-gas'),
      }), send);
      break;

    case 'mint-shares':
      output = await maybeSend(config, buildMintSharesTx({
        chainId: config.chainId,
        dao: asAddress(requiredFlag(parsed.flags, 'dao')),
        recipients: listFlag(requiredFlag(parsed.flags, 'to')).map(asAddress),
        amounts: parseAmountList(parsed.flags),
        title: stringFlag(parsed.flags, 'title'),
        description: stringFlag(parsed.flags, 'description'),
        link: stringFlag(parsed.flags, 'link') || stringFlag(parsed.flags, 'content-uri'),
        expiration: numberFlag(parsed.flags, 'expiration', 0),
        baalGas: optionalBigint(parsed.flags, 'baal-gas'),
        proposalOffering: optionalBigint(parsed.flags, 'value'),
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

function optionalBigint(flags: Record<string, string | boolean>, name: string): bigint | undefined {
  const value = stringFlag(flags, name);
  return value == null ? undefined : parseBigint(value);
}

function listFlag(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseAmountList(flags: Record<string, string | boolean>): bigint[] {
  const raw = stringFlag(flags, 'amount-raw');
  if (raw) return listFlag(raw).map(parseBigint);
  const amount = requiredFlag(flags, 'amount');
  return listFlag(amount).map(parseBaalTokenUnits);
}

function summarizeTxOutput(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if ('summary' in value) {
    const result = value as { summary: Record<string, unknown>; sent?: boolean; hash?: string };
    const summary = { ...result.summary };
    delete summary.proposalData;
    return {
      summary,
      sent: result.sent || false,
      hash: result.hash,
      note: 'Use --full to print unsigned transaction calldata.',
    };
  }
  return value;
}
