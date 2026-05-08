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
npm install -g @raidguild/moloch-agent
moloch-agent help
```

## Publish

The package is published under the public `@hausdao` npm scope.

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
moloch-agent members --dao 0xDAO
moloch-agent records --dao 0xDAO --table communityMemory
moloch-agent pin-json --file community-state.json --name community-state-v1
moloch-agent memory-post --dao 0xDAO --thread-id proposal-1 --body "Reason for vote"
moloch-agent signal --dao 0xDAO --title "Signal" --description "Body"
moloch-agent sponsor --dao 0xDAO --proposal 1
moloch-agent vote --dao 0xDAO --proposal 1 --approved true
moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x...
```

## Boundaries

- The hosted service handles Graph reads and Pinata uploads.
- The CLI owns local signing commands.
- The service must never receive private keys.
- Direct chain preflight is still required before transaction commands.

Transaction commands build unsigned summaries by default. Use `--full` to print calldata. Add `--send` to sign and broadcast locally with `PRIVATE_KEY` and `RPC_URL`.
