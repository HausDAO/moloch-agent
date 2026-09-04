import { base, gnosis } from 'viem/chains';
export const GNOSIS_CHAIN_ID = 100;
export const BASE_CHAIN_ID = 8453;
export function transactionChain(chainId) {
    if (chainId === BASE_CHAIN_ID)
        return base;
    if (chainId === GNOSIS_CHAIN_ID)
        return gnosis;
    throw new Error(`Direct chain operations are not configured for chainId ${chainId}.`);
}
export function defaultRpcUrl(chainId) {
    if (chainId === BASE_CHAIN_ID)
        return 'https://mainnet.base.org';
    if (chainId === GNOSIS_CHAIN_ID)
        return 'https://rpc.gnosischain.com';
    return undefined;
}
export function explorerBaseUrl(chainId) {
    if (chainId === BASE_CHAIN_ID)
        return 'https://basescan.org';
    if (chainId === GNOSIS_CHAIN_ID)
        return 'https://gnosisscan.io';
    if (chainId === 1)
        return 'https://etherscan.io';
    throw new Error(`Explorer links are not configured for chainId ${chainId}.`);
}
export function safeApiBaseUrl(chainId) {
    if (chainId === BASE_CHAIN_ID)
        return 'https://safe-transaction-base.safe.global';
    if (chainId === GNOSIS_CHAIN_ID)
        return 'https://safe-transaction-gnosis-chain.safe.global';
    if (chainId === 1)
        return 'https://safe-transaction-mainnet.safe.global';
    throw new Error(`Safe balance lookup is not configured for chainId ${chainId}.`);
}
