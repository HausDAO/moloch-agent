export const helpText = `moloch-agent

Usage:
  moloch-agent health
  moloch-agent capabilities
  moloch-agent account
  moloch-agent guild --guild 0xGUILD
  moloch-agent proposals --guild 0xGUILD [--first 100] [--skip 0]
  moloch-agent proposal --guild 0xGUILD --proposal 1
  moloch-agent guild-url --guild 0xGUILD [--proposal 1]
  moloch-agent links --guild 0xGUILD [--proposal 1] [--address 0xCONTRACT] [--tx 0xHASH]
  moloch-agent read-guild --guild 0xGUILD
  moloch-agent balances --guild 0xGUILD [--token 0xERC20]
  moloch-agent balances --address 0xADDRESS [--token 0xERC20]
  moloch-agent treasury-tokens --guild 0xGUILD
  moloch-agent read-proposal --guild 0xGUILD --proposal 1
  moloch-agent proposal-lifecycle --guild 0xGUILD --proposal 1
  moloch-agent process-queue --guild 0xGUILD [--first 100]
  moloch-agent wrap-eth --amount 0.01 [--build-only]
  moloch-agent approve-token --token 0xERC20 --amount 1000000 --spender 0xSPENDER [--build-only]
  moloch-agent ragequit --guild 0xGUILD --to 0xRECIPIENT --shares 1 --loot 0 --tokens ETH,0xERC20 --confirm-ragequit [--build-only]
  moloch-agent members --guild 0xGUILD [--first 100] [--skip 0]
  moloch-agent records --guild 0xGUILD [--table communityMemory] [--first 100] [--skip 0]
  moloch-agent pin-json --file artifact.json [--name artifact-name]
  moloch-agent workspace-create --kind guild --guild 0xGUILD --title "Guild Workspace"
  moloch-agent workspace-create --kind proposal --guild 0xGUILD --title "Proposal Workspace"
  moloch-agent summon --params summon.json [--no-workspace] [--build-only]
  moloch-agent memory-post --guild 0xGUILD --thread-id topic --body "..." [--build-only]
  moloch-agent signal --guild 0xGUILD --title "..." --description "..." [--link ipfs://...] [--build-only]
  moloch-agent guild-meta --guild 0xGUILD --community-memory-uri ipfs://... [--build-only]
  moloch-agent gov-settings --guild 0xGUILD --params gov-settings.json [--build-only]
  moloch-agent token-settings --guild 0xGUILD --pause-shares false --pause-loot false [--build-only]
  moloch-agent custom-proposal --guild 0xGUILD --title "..." --actions actions.json [--build-only]
  moloch-agent join-guild --guild 0xGUILD --token 0xERC20 --amount 1000000 --shares 10000 [--build-only]
  moloch-agent tribute --guild 0xGUILD --token 0xERC20 --amount 1000000 --shares 10000 [--build-only]
  moloch-agent swap --guild 0xGUILD --token 0xERC20 --amount 1000000 --shares 0 --loot 100 [--build-only]
  moloch-agent payment --guild 0xGUILD --recipient 0xPAYEE --amount 0.01 [--build-only]
  moloch-agent payment --guild 0xGUILD --recipient 0xPAYEE --token 0xERC20 --amount 100 --decimals 6 [--build-only]
  moloch-agent mint-shares --guild 0xGUILD --to 0xMEMBER --amount 1 [--build-only]
  moloch-agent mint-loot --guild 0xGUILD --to 0xMEMBER --amount 100 [--build-only]
  moloch-agent sponsor --guild 0xGUILD --proposal 1 [--build-only]
  moloch-agent vote --guild 0xGUILD --proposal 1 --approved true [--reason "..."] [--build-only]
  moloch-agent cancel --guild 0xGUILD --proposal 1 [--build-only]
  moloch-agent process --guild 0xGUILD --proposal 1 --proposal-data 0x... [--gas-limit 1200000] [--build-only]
  moloch-agent process-ready --guild 0xGUILD [--first 100] [--build-only]

Environment:
  MOLOCH_SERVICE_URL  Defaults to https://moloch-service-production.up.railway.app
  CHAIN_ID            Defaults to 8453
  RPC_URL             Defaults to https://mainnet.base.org; use Alchemy/Infura/etc. for always-on agents
  PRIVATE_KEY         Required for transaction commands unless --build-only is passed
  MOLOCH_SEND_DEFAULT Set false to build unsigned transactions by default
  MOLOCH_WAIT_DEFAULT Fallback wait default; prefer --wait, --no-wait, or --confirmations
  IPFS_GATEWAY_URL    When set, auto-created proposal links use gateway URLs instead of ipfs:// URIs

Notes:
  account prints the exact signer address derived from PRIVATE_KEY.
  The hosted service handles Graph reads and Pinata uploads.
  The service never receives private keys.
  Guild is the operator-facing term for a DAOhaus/Moloch V3/Baal DAO. Legacy --dao flags and dao/read-dao/dao-meta/join-dao commands still work.
  Transaction commands broadcast by default. Use --build-only for unsigned transaction JSON.
  Transaction commands wait for receipts by default to reduce stale nonce races between back-to-back actions. Use --confirmations N to wait longer, or --no-wait for fire-and-forget.
  The default public Base RPC is best-effort and can rate limit; set RPC_URL for reliable autonomous operation.
  Transaction commands print summaries by default; use --full for calldata.
  vote --reason posts a vote-reason memory record, then submits the vote.
  summon auto-pins a Guild workspace when metadata pointers are not provided.
  proposal commands auto-pin a proposal workspace when --link/--content-uri is not provided.
  Workspace links default to ipfs:// URIs. Set IPFS_GATEWAY_URL only when browser gateway links are preferred.
  gov-settings reads JSON with votingPeriodInSeconds, gracePeriodInSeconds, newOffering, quorum, sponsorThreshold, and minRetention.
  token-settings calls Baal setAdminConfig for share/loot pause state.
  custom-proposal reads an actions JSON array: [{ "to": "0x...", "value": "0", "data": "0x...", "operation": 0 }].
  Proposal commands read the Guild proposalOffering and include it as tx value unless --value/--proposal-offering is provided.
  tribute/join/swap creates a Tribute Minion ERC-20 token-swap proposal for shares and/or loot.
  tribute/join/swap --amount is raw ERC-20 token units. Native ETH tribute is not supported by the DAOhaus Tribute Minion.
  For native ETH-to-shares flows, wrap ETH to Base WETH, approve Tribute Minion, then use tribute/join/swap with --token 0x4200000000000000000000000000000000000006.
  approve-token defaults spender to the DAOhaus Tribute Minion and token to Base WETH. Use --amount-raw or --decimals for non-WETH ERC-20s.
  payment sends ETH from the Guild treasury with decimal ETH; ERC-20 payment requires --amount-raw or --decimals.
  treasury-tokens returns a sorted ragequitTokensCsv value for the Guild Safe.
  ragequit is a direct member action, not a proposal. It burns caller shares/loot and claims proportional treasury assets. Treat it as an irreversible Guild exit action. Broadcast requires --confirm-ragequit.
  mint-shares and mint-loot use human 18-decimal Guild token units by default.
  process-queue never trusts indexed passed=true as the execution gate; RPC state is used when available.
  process-ready selects the oldest ready proposal and includes a gas limit based on proposal baalGas when available.
  summon uses the Base advanced-token summoner and includes a DAOhaus metadata Poster action.
  Never expand shortened addresses such as 0x1234...abcd. Use only full addresses from account/env/chain/user input.
`;
