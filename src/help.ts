export const helpText = `moloch-agent

Usage:
  moloch-agent health
  moloch-agent capabilities
  moloch-agent dao --dao 0xDAO
  moloch-agent proposals --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent proposal --dao 0xDAO --proposal 1
  moloch-agent read-dao --dao 0xDAO
  moloch-agent read-proposal --dao 0xDAO --proposal 1
  moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
  moloch-agent process-queue --dao 0xDAO [--first 100]
  moloch-agent members --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent records --dao 0xDAO [--table communityMemory] [--first 100] [--skip 0]
  moloch-agent pin-json --file artifact.json [--name artifact-name]
  moloch-agent summon --params summon.json [--build-only]
  moloch-agent memory-post --dao 0xDAO --thread-id topic --body "..." [--build-only]
  moloch-agent signal --dao 0xDAO --title "..." --description "..." [--link ipfs://...] [--build-only]
  moloch-agent dao-meta --dao 0xDAO --community-memory-uri ipfs://... [--build-only]
  moloch-agent join-dao --dao 0xDAO --amount 10000000000000000 --shares 10000 [--build-only]
  moloch-agent tribute --dao 0xDAO --token ETH --amount 10000000000000000 --shares 10000 [--build-only]
  moloch-agent mint-shares --dao 0xDAO --to 0xMEMBER --amount 1 [--build-only]
  moloch-agent sponsor --dao 0xDAO --proposal 1 [--build-only]
  moloch-agent vote --dao 0xDAO --proposal 1 --approved true [--build-only]
  moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x... [--gas-limit 1200000] [--build-only]
  moloch-agent process-ready --dao 0xDAO [--first 100] [--build-only]

Environment:
  MOLOCH_SERVICE_URL  Defaults to https://moloch-service-production.up.railway.app
  CHAIN_ID            Defaults to 8453
  RPC_URL             Required for transaction commands unless --build-only is passed
  PRIVATE_KEY         Required for transaction commands unless --build-only is passed
  MOLOCH_SEND_DEFAULT Set false to build unsigned transactions by default

Notes:
  The hosted service handles Graph reads and Pinata uploads.
  The service never receives private keys.
  Transaction commands broadcast by default. Use --build-only for unsigned transaction JSON.
  Transaction commands print summaries by default; use --full for calldata.
  process-queue never trusts indexed passed=true as the execution gate; RPC state is used when available.
  process-ready selects the oldest ready proposal and includes a gas limit based on proposal baalGas when available.
  summon uses the Base advanced-token summoner and includes a DAOhaus metadata Poster action.
`;
