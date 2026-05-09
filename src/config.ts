export const DEFAULT_SERVICE_URL = 'https://moloch-service-production.up.railway.app';
export const DEFAULT_CHAIN_ID = 8453;
export const DEFAULT_RPC_URL = 'https://mainnet.base.org';

export type Config = {
  serviceUrl: string;
  chainId: number;
  rpcUrl?: string;
  ipfsGatewayUrl?: string;
  privateKey?: `0x${string}`;
};

export function getConfig(env = process.env): Config {
  return {
    serviceUrl: normalizeServiceUrl(env.MOLOCH_SERVICE_URL || DEFAULT_SERVICE_URL),
    chainId: Number(env.CHAIN_ID || DEFAULT_CHAIN_ID),
    rpcUrl: env.RPC_URL || DEFAULT_RPC_URL,
    ipfsGatewayUrl: env.IPFS_GATEWAY_URL,
    privateKey: env.PRIVATE_KEY as `0x${string}` | undefined,
  };
}

export function normalizeServiceUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
