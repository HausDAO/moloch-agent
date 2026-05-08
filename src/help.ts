export const helpText = `moloch-agent

Usage:
  moloch-agent health
  moloch-agent capabilities
  moloch-agent dao --dao 0xDAO
  moloch-agent proposals --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent proposal --dao 0xDAO --proposal 1
  moloch-agent members --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent records --dao 0xDAO [--table communityMemory] [--first 100] [--skip 0]
  moloch-agent pin-json --file artifact.json [--name artifact-name]
  moloch-agent memory-post --dao 0xDAO --thread-id topic --body "..." [--send]
  moloch-agent signal --dao 0xDAO --title "..." --description "..." [--link ipfs://...] [--send]
  moloch-agent sponsor --dao 0xDAO --proposal 1 [--send]
  moloch-agent vote --dao 0xDAO --proposal 1 --approved true [--send]
  moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x... [--send]

Environment:
  MOLOCH_SERVICE_URL  Defaults to https://moloch-service-production.up.railway.app
  CHAIN_ID            Defaults to 8453
  RPC_URL             Required for --send
  PRIVATE_KEY         Required for --send

Notes:
  The hosted service handles Graph reads and Pinata uploads.
  The service never receives private keys.
  Transaction signing runs locally when --send is used.
  Transaction commands print summaries by default; use --full for calldata.
`;
