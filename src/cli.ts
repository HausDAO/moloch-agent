#!/usr/bin/env node
import { parseArgs, numberFlag, requiredFlag, stringFlag } from './args.js';
import { readJsonFile } from './files.js';
import { helpText } from './help.js';
import { getConfig } from './config.js';
import { createServiceClient } from './service.js';
import { printCompact, printJson } from './output.js';

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const service = createServiceClient(config);
  const compact = Boolean(parsed.flags.compact);

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

    default:
      throw new Error(`Unknown command: ${parsed.command}\n\n${helpText}`);
  }

  if (compact) printCompact(output);
  else printJson(output);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
