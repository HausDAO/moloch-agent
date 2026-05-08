export const DEFAULT_SERVICE_URL = 'https://moloch-service-production.up.railway.app';
export const DEFAULT_CHAIN_ID = 8453;

export type Config = {
  serviceUrl: string;
  chainId: number;
};

export function getConfig(env = process.env): Config {
  return {
    serviceUrl: normalizeServiceUrl(env.MOLOCH_SERVICE_URL || DEFAULT_SERVICE_URL),
    chainId: Number(env.CHAIN_ID || DEFAULT_CHAIN_ID),
  };
}

export function normalizeServiceUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
