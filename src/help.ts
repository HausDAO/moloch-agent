export const helpText = `moloch-agent

Usage:
  moloch-agent health
  moloch-agent capabilities
  moloch-agent account
  moloch-agent dao --dao 0xDAO
  moloch-agent proposals --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent proposal --dao 0xDAO --proposal 1
  moloch-agent daohaus-url --dao 0xDAO [--proposal 1]
  moloch-agent links --dao 0xDAO [--proposal 1] [--address 0xCONTRACT] [--tx 0xHASH]
  moloch-agent read-dao --dao 0xDAO
  moloch-agent balances --dao 0xDAO [--token 0xERC20]
  moloch-agent balances --address 0xADDRESS [--token 0xERC20]
  moloch-agent read-proposal --dao 0xDAO --proposal 1
  moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
  moloch-agent process-queue --dao 0xDAO [--first 100]
  moloch-agent members --dao 0xDAO [--first 100] [--skip 0]
  moloch-agent records --dao 0xDAO [--table communityMemory] [--first 100] [--skip 0]
  moloch-agent pin-json --file artifact.json [--name artifact-name]
  moloch-agent workspace-create --kind dao --dao 0xDAO --title "DAO Workspace"
  moloch-agent workspace-create --kind proposal --dao 0xDAO --title "Proposal Workspace"
  moloch-agent summon --params summon.json [--no-workspace] [--build-only]
  moloch-agent memory-post --dao 0xDAO --thread-id topic --body "..." [--build-only]
  moloch-agent signal --dao 0xDAO --title "..." --description "..." [--link ipfs://...] [--build-only]
  moloch-agent dao-meta --dao 0xDAO --community-memory-uri ipfs://... [--build-only]
  moloch-agent gov-settings --dao 0xDAO --params gov-settings.json [--build-only]
  moloch-agent token-settings --dao 0xDAO --pause-shares false --pause-loot false [--build-only]
  moloch-agent custom-proposal --dao 0xDAO --title "..." --actions actions.json [--build-only]
  moloch-agent join-dao --dao 0xDAO --token 0xERC20 --amount 1000000 --shares 10000 [--build-only]
  moloch-agent tribute --dao 0xDAO --token 0xERC20 --amount 1000000 --shares 10000 [--build-only]
  moloch-agent swap --dao 0xDAO --token 0xERC20 --amount 1000000 --shares 0 --loot 100 [--build-only]
  moloch-agent payment --dao 0xDAO --recipient 0xPAYEE --amount 0.01 [--build-only]
  moloch-agent payment --dao 0xDAO --recipient 0xPAYEE --token 0xERC20 --amount 100 --decimals 6 [--build-only]
  moloch-agent mint-shares --dao 0xDAO --to 0xMEMBER --amount 1 [--build-only]
  moloch-agent mint-loot --dao 0xDAO --to 0xMEMBER --amount 100 [--build-only]
  moloch-agent sponsor --dao 0xDAO --proposal 1 [--build-only]
  moloch-agent vote --dao 0xDAO --proposal 1 --approved true [--reason "..."] [--build-only]
  moloch-agent cancel --dao 0xDAO --proposal 1 [--build-only]
  moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x... [--gas-limit 1200000] [--build-only]
  moloch-agent process-ready --dao 0xDAO [--first 100] [--build-only]

Environment:
  MOLOCH_SERVICE_URL  Defaults to https://moloch-service-production.up.railway.app
  CHAIN_ID            Defaults to 8453
  RPC_URL             Defaults to https://mainnet.base.org; use Alchemy/Infura/etc. for always-on agents
  PRIVATE_KEY         Required for transaction commands unless --build-only is passed
  MOLOCH_SEND_DEFAULT Set false to build unsigned transactions by default
  IPFS_GATEWAY_URL    When set, auto-created proposal links use gateway URLs instead of ipfs:// URIs

Notes:
  account prints the exact signer address derived from PRIVATE_KEY.
  The hosted service handles Graph reads and Pinata uploads.
  The service never receives private keys.
  Transaction commands broadcast by default. Use --build-only for unsigned transaction JSON.
  The default public Base RPC is best-effort and can rate limit; set RPC_URL for reliable autonomous operation.
  Transaction commands print summaries by default; use --full for calldata.
  vote --reason posts a vote-reason memory record, then submits the vote.
  summon auto-pins a DAO workspace when metadata pointers are not provided.
  proposal commands auto-pin a proposal workspace when --link/--content-uri is not provided.
  Workspace links default to ipfs:// URIs. Set IPFS_GATEWAY_URL only when browser gateway links are preferred.
  gov-settings reads JSON with votingPeriodInSeconds, gracePeriodInSeconds, newOffering, quorum, sponsorThreshold, and minRetention.
  token-settings calls Baal setAdminConfig for share/loot pause state.
  custom-proposal reads an actions JSON array: [{ "to": "0x...", "value": "0", "data": "0x...", "operation": 0 }].
  Proposal commands read the DAO proposalOffering and include it as tx value unless --value/--proposal-offering is provided.
  tribute/join/swap creates a Tribute Minion ERC-20 token-swap proposal for shares and/or loot.
  tribute/join/swap --amount is raw ERC-20 token units. Native ETH tribute is not supported by the DAOhaus Tribute Minion.
  payment sends ETH from the DAO treasury with decimal ETH; ERC-20 payment requires --amount-raw or --decimals.
  mint-shares and mint-loot use human 18-decimal DAO token units by default.
  process-queue never trusts indexed passed=true as the execution gate; RPC state is used when available.
  process-ready selects the oldest ready proposal and includes a gas limit based on proposal baalGas when available.
  summon uses the Base advanced-token summoner and includes a DAOhaus metadata Poster action.
  Never expand shortened addresses such as 0x1234...abcd. Use only full addresses from account/env/chain/user input.
`;
