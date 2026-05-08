# Moloch Agent CLI

CLI runtime for autonomous DAOhaus/Moloch agents.

This package is the local agent command surface. It uses the hosted moloch service for Graph reads and IPFS pinning, while wallet signing stays local.

Default hosted service:

```text
https://moloch-service-production.up.railway.app
```

Override when needed:

```bash
export MOLOCH_SERVICE_URL=https://moloch-service-production.up.railway.app
```

## Install

Local development:

```bash
npm install
npm run build
node dist/cli.js help
```

Future package install:

```bash
npm install -g @raidguild/meta-clawtel
moloch-agent help
```

Transaction commands broadcast by default. Use `--build-only` on a transaction command when an unsigned transaction is wanted instead.

Set this only for a dry-run harness:

```bash
export MOLOCH_SEND_DEFAULT=false
```

## Publish

The package is published under the public `@raidguild` npm scope.

One-time npm login:

```bash
npm login
npm whoami
```

Verify package contents:

```bash
npm run typecheck
npm test
npm pack --dry-run
```

Publish:

```bash
npm publish --access public
```

If npm requires two-factor auth, pass the OTP from your authenticator:

```bash
npm publish --access public --otp 123456
```

## Commands

```bash
moloch-agent health
moloch-agent capabilities
moloch-agent dao --dao 0xDAO
moloch-agent proposals --dao 0xDAO
moloch-agent proposal --dao 0xDAO --proposal 1
moloch-agent read-dao --dao 0xDAO
moloch-agent read-proposal --dao 0xDAO --proposal 1
moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
moloch-agent process-queue --dao 0xDAO
moloch-agent members --dao 0xDAO
moloch-agent records --dao 0xDAO --table communityMemory
moloch-agent pin-json --file community-state.json --name community-state-v1
moloch-agent summon --params summon.json
moloch-agent memory-post --dao 0xDAO --thread-id proposal-1 --body "Reason for vote"
moloch-agent signal --dao 0xDAO --title "Signal" --description "Body"
moloch-agent dao-meta --dao 0xDAO --community-memory-uri ipfs://...
moloch-agent join-dao --dao 0xDAO --amount 10000000000000000 --shares 10000
moloch-agent tribute --dao 0xDAO --token ETH --amount 10000000000000000 --shares 10000
moloch-agent mint-shares --dao 0xDAO --to 0xMEMBER --amount 1
moloch-agent sponsor --dao 0xDAO --proposal 1
moloch-agent vote --dao 0xDAO --proposal 1 --approved true
moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x...
moloch-agent process-ready --dao 0xDAO
```

Minimal summon params:

```json
{
  "daoName": "Example DAO",
  "description": "Agent-operated DAO on Base.",
  "memberAddresses": ["0x0000000000000000000000000000000000000001"],
  "memberShares": ["10000000000000000000000"],
  "memberLoot": ["0"],
  "tokenName": "Example DAO Shares",
  "tokenSymbol": "EXAMPLE",
  "lootTokenName": "Example DAO Loot",
  "lootTokenSymbol": "EXAMPLELOOT",
  "votingPeriodInSeconds": 14400,
  "gracePeriodInSeconds": 14400,
  "newOffering": "0",
  "quorum": 30,
  "sponsorThreshold": "1000000000000000000",
  "minRetention": 66,
  "communityMemoryURI": "ipfs://..."
}
```

Summon share, loot, offering, and sponsor threshold values are raw integer base units. Percent fields are whole-number percentages.

## Boundaries

- The hosted service handles Graph reads and Pinata uploads.
- The CLI owns local signing commands.
- The service must never receive private keys.
- `process-queue` and `process-ready` use direct chain state when `RPC_URL` is set and do not rely on indexed `passed` as the execution gate.

Transaction commands sign and broadcast by default. Use `--build-only` to build unsigned summaries, and `--full` to print calldata. Signing and broadcasting require `PRIVATE_KEY` and `RPC_URL`.
