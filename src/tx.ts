import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import type { Config } from './config.js';

export const POSTER = '0x000000000000cd17345801aa8147b8D3950260FF';
export const POSTER_TAG_DAO_DB = 'daohaus.proposal.database';
export const POSTER_TAG_MEMBER_DB = 'daohaus.member.database';

export const BAAL_ABI = [
  { type: 'function', name: 'submitProposal', stateMutability: 'payable', inputs: [{ name: 'proposalData', type: 'bytes' }, { name: 'expiration', type: 'uint32' }, { name: 'baalGas', type: 'uint256' }, { name: 'details', type: 'string' }], outputs: [] },
  { type: 'function', name: 'sponsorProposal', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }], outputs: [] },
  { type: 'function', name: 'submitVote', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }, { name: 'approved', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'processProposal', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }, { name: 'proposalData', type: 'bytes' }], outputs: [] },
] as const;

export const POSTER_ABI = [
  { type: 'function', name: 'post', stateMutability: 'nonpayable', inputs: [{ name: 'content', type: 'string' }, { name: 'tag', type: 'string' }], outputs: [] },
] as const;

export type UnsignedTx = {
  chainId: number;
  to: `0x${string}`;
  value: string;
  data: Hex;
};

export type BuiltTx = {
  summary: Record<string, unknown>;
  tx: UnsignedTx;
};

export type SendResult = BuiltTx & {
  sent: true;
  hash: Hex;
};

export function buildVoteTx(input: { chainId: number; dao: `0x${string}`; proposal: number; approved: boolean }): BuiltTx {
  const data = encodeFunctionData({
    abi: BAAL_ABI,
    functionName: 'submitVote',
    args: [input.proposal, input.approved],
  });
  return withSummary(tx(input.chainId, input.dao, data), {
    action: 'vote',
    dao: input.dao,
    proposalId: input.proposal,
    approved: input.approved,
  });
}

export function buildSponsorTx(input: { chainId: number; dao: `0x${string}`; proposal: number }): BuiltTx {
  const data = encodeFunctionData({
    abi: BAAL_ABI,
    functionName: 'sponsorProposal',
    args: [input.proposal],
  });
  return withSummary(tx(input.chainId, input.dao, data), {
    action: 'sponsor',
    dao: input.dao,
    proposalId: input.proposal,
  });
}

export function buildProcessTx(input: { chainId: number; dao: `0x${string}`; proposal: number; proposalData: Hex }): BuiltTx {
  const data = encodeFunctionData({
    abi: BAAL_ABI,
    functionName: 'processProposal',
    args: [input.proposal, input.proposalData],
  });
  return withSummary(tx(input.chainId, input.dao, data), {
    action: 'process',
    dao: input.dao,
    proposalId: input.proposal,
    note: 'Use exact indexed proposalData. Processing is mechanical settlement after governance is complete.',
  });
}

export function buildMemoryPostTx(input: {
  chainId: number;
  dao: `0x${string}`;
  table: string;
  type?: string;
  threadId?: string;
  topicId?: string;
  proposalId?: string;
  draftId?: string;
  title?: string;
  body?: string;
  contentURI?: string;
  contentHash?: string;
  workspaceURI?: string;
  stateURI?: string;
  agent?: string;
  version?: string;
  tag?: string;
}): BuiltTx {
  const content = compactObject({
    daoId: input.dao,
    table: input.table,
    queryType: 'list',
    schema: 'community-memory/v1',
    type: input.type || 'thread-post',
    title: input.title,
    body: input.body,
    threadId: input.threadId || input.topicId,
    topicId: input.topicId,
    proposalId: input.proposalId,
    draftId: input.draftId,
    contentURI: input.contentURI,
    contentHash: input.contentHash,
    workspaceURI: input.workspaceURI,
    stateURI: input.stateURI,
    agent: input.agent,
    version: input.version,
    createdAt: new Date().toISOString(),
  });
  const tag = input.tag || POSTER_TAG_MEMBER_DB;
  const data = encodeFunctionData({
    abi: POSTER_ABI,
    functionName: 'post',
    args: [JSON.stringify(content), tag],
  });
  return withSummary(tx(input.chainId, POSTER, data), {
    action: 'memory-post',
    dao: input.dao,
    recordTable: input.table,
    tag,
    type: content.type,
    threadId: content.threadId,
    proposalId: content.proposalId,
    contentURI: content.contentURI,
    note: 'Sender must satisfy DAOhaus database tag permissions for the record to index.',
  });
}

export function buildSignalTx(input: {
  chainId: number;
  dao: `0x${string}`;
  title: string;
  description: string;
  link?: string;
  expiration?: number;
  baalGas?: bigint;
  proposalOffering?: bigint;
}): BuiltTx {
  const postData = encodeFunctionData({
    abi: POSTER_ABI,
    functionName: 'post',
    args: [
      JSON.stringify({
        daoId: input.dao,
        table: 'signal',
        queryType: 'list',
        title: input.title,
        description: input.description,
        link: input.link || '',
      }),
      POSTER_TAG_DAO_DB,
    ],
  });
  const proposalData = encodeFunctionData({
    abi: BAAL_ABI,
    functionName: 'submitProposal',
    args: [
      postData,
      input.expiration || 0,
      input.baalGas || 0n,
      JSON.stringify({
        title: input.title,
        description: input.description,
        contentURI: input.link || '',
        contentURIType: input.link ? 'url' : '',
        proposalType: 'SIGNAL',
      }),
    ],
  });
  return withSummary(tx(input.chainId, input.dao, proposalData, input.proposalOffering || 0n), {
    action: 'signal',
    dao: input.dao,
    proposalKind: 'SIGNAL',
    title: input.title,
    contentURI: input.link || '',
    baalGas: String(input.baalGas || 0n),
  });
}

export async function maybeSend(config: Config, built: BuiltTx, send: boolean): Promise<BuiltTx | SendResult> {
  if (!send) return built;
  if (!config.rpcUrl) throw new Error('RPC_URL is required for --send.');
  if (!config.privateKey) throw new Error('PRIVATE_KEY is required for --send.');
  if (config.chainId !== 8453) throw new Error('Only Base chainId 8453 is currently supported for --send.');

  const account = privateKeyToAccount(config.privateKey);
  const publicClient = createPublicClient({ chain: base, transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({ account, chain: base, transport: http(config.rpcUrl) });
  const request = await publicClient.prepareTransactionRequest({
    account,
    to: built.tx.to,
    value: BigInt(built.tx.value),
    data: built.tx.data,
  });
  const hash = await walletClient.sendTransaction(request);
  return { ...built, sent: true, hash };
}

export function asAddress(value: string): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) throw new Error(`Invalid address: ${value}`);
  return value.toLowerCase() as `0x${string}`;
}

export function asHex(value: string): Hex {
  if (!/^0x[a-fA-F0-9]*$/.test(value)) throw new Error('Expected hex data.');
  return value as Hex;
}

export function asProposalId(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error('Proposal id must be a non-negative integer.');
  return parsed;
}

function tx(chainId: number, to: `0x${string}`, data: Hex, value = 0n): UnsignedTx {
  return { chainId, to, value: value.toString(), data };
}

function withSummary(txObject: UnsignedTx, summary: Record<string, unknown>): BuiltTx {
  return {
    summary: {
      chainId: txObject.chainId,
      to: txObject.to,
      value: txObject.value,
      ...summary,
    },
    tx: txObject,
  };
}

function compactObject<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}
