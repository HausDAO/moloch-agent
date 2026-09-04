import { defaultRpcUrl } from './networks.js';
export const DEFAULT_SERVICE_URL = 'https://moloch-service-production.up.railway.app';
export const DEFAULT_CHAIN_ID = 8453;
export const DEFAULT_RPC_URL = 'https://mainnet.base.org';
export function getConfig(env = process.env) {
    const chainId = Number(env.CHAIN_ID || DEFAULT_CHAIN_ID);
    return {
        serviceUrl: normalizeServiceUrl(env.MOLOCH_SERVICE_URL || DEFAULT_SERVICE_URL),
        chainId,
        rpcUrl: env.RPC_URL || defaultRpcUrl(chainId),
        ipfsGatewayUrl: env.IPFS_GATEWAY_URL,
        privateKey: env.PRIVATE_KEY,
    };
}
export function normalizeServiceUrl(value) {
    return value.replace(/\/+$/, '');
}
