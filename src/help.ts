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

Environment:
  MOLOCH_SERVICE_URL  Defaults to https://moloch-service-production.up.railway.app
  CHAIN_ID            Defaults to 8453

Notes:
  The hosted service handles Graph reads and Pinata uploads.
  The service never receives private keys.
  Transaction signing commands will run locally when added.
`;
