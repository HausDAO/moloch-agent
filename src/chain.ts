import { createPublicClient, formatEther, formatUnits, http } from 'viem';
import { base } from 'viem/chains';
import type { Config } from './config.js';
import type { ServiceClient } from './service.js';
import { BAAL_ABI, type BuiltTx } from './tx.js';
import { buildProcessTx } from './tx.js';

export const STATE_NAMES = ['unborn', 'submitted', 'voting', 'cancelled', 'grace', 'ready', 'processed', 'defeated'];
const PREV_PROCESS_ELIGIBLE = new Set([0, 3, 6, 7]);
const PROCESS_PROPOSAL_GAS_LIMIT_ADDITION = 400000n;
const DEFAULT_PROCESS_GAS_LIMIT = 800000n;

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

export async function readDaoDirect(config: Config, dao: `0x${string}`): Promise<Record<string, unknown>> {
  const client = publicClient(config);
  const [proposalCount, proposalOffering, sponsorThreshold, latestSponsoredProposalId] = await Promise.all([
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposalCount' }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposalOffering' }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'sponsorThreshold' }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'latestSponsoredProposalId' }),
  ]);
  return {
    dao,
    proposalCount: proposalCount.toString(),
    proposalOffering: proposalOffering.toString(),
    sponsorThreshold: sponsorThreshold.toString(),
    latestSponsoredProposalId: latestSponsoredProposalId.toString(),
  };
}

export async function readProposalDirect(config: Config, dao: `0x${string}`, proposal: number): Promise<Record<string, unknown>> {
  const client = publicClient(config);
  const [raw, status, state] = await Promise.all([
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposals', args: [BigInt(proposal)] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'getProposalStatus', args: [proposal] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'state', args: [proposal] }),
  ]);
  return {
    dao,
    proposal,
    raw: namedProposalTuple(raw),
    status: namedProposalStatus(status),
    state: Number(state),
    stateName: STATE_NAMES[Number(state)] || `unknown-${state}`,
  };
}

export async function readBalances(input: {
  config: Config;
  service: ServiceClient;
  dao?: `0x${string}`;
  address?: `0x${string}`;
  token?: `0x${string}`;
}): Promise<Record<string, unknown>> {
  const client = publicClient(input.config);
  let safeAddress: `0x${string}` | undefined;
  if (!input.address && input.dao) {
    safeAddress = await safeAddressForDao(input.service, input.dao);
  }
  const address = input.address || safeAddress;
  if (!address) throw new Error('Provide --address, or provide --dao for DAO Safe balance lookup.');
  const wei = await client.getBalance({ address });
  const result: Record<string, unknown> = {
    chainId: input.config.chainId,
    dao: input.dao || '',
    safeAddress: safeAddress || '',
    address,
    native: {
      symbol: 'ETH',
      wei: wei.toString(),
      eth: formatEther(wei),
    },
    explorerUrl: `${explorerBaseUrl(input.config.chainId)}/address/${address}`,
  };
  if (input.token) {
    const [rawBalance, decimals, symbol] = await Promise.all([
      client.readContract({ address: input.token, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] }),
      client.readContract({ address: input.token, abi: ERC20_ABI, functionName: 'decimals' }),
      client.readContract({ address: input.token, abi: ERC20_ABI, functionName: 'symbol' }),
    ]);
    result.erc20 = {
      token: input.token,
      symbol,
      decimals,
      raw: rawBalance.toString(),
      formatted: formatUnits(rawBalance, decimals),
      explorerUrl: `${explorerBaseUrl(input.config.chainId)}/token/${input.token}?a=${address}`,
    };
  }
  return result;
}

export async function proposalLifecycle(input: {
  config: Config;
  service: ServiceClient;
  dao: `0x${string}`;
  proposal: number;
}): Promise<Record<string, unknown>> {
  let indexed: unknown;
  let indexedError: string | undefined;
  try {
    indexed = await input.service.proposal({ dao: input.dao, proposal: String(input.proposal) });
  } catch (error) {
    indexedError = compactError(error);
  }
  const proposal = extractProposal(indexed) || await chainOnlyProposal(input.config, input.dao, input.proposal);
  let chain: Record<string, unknown> = {};
  if (input.config.rpcUrl) {
    try {
      chain = await chainProposalContext(input.config, input.dao, proposal);
    } catch (error) {
      chain = { error: compactError(error) };
    }
  }
  return {
    proposal: compactProposal(proposal),
    lifecycle: deriveProposalLifecycle(proposal, Math.floor(Date.now() / 1000), chain),
    chain,
    indexedError,
    mode: indexedError ? 'chain-fallback' : 'indexed+chain',
  };
}

export async function processQueue(input: {
  config: Config;
  service: ServiceClient;
  dao: `0x${string}`;
  first: number;
}): Promise<Record<string, unknown>> {
  let indexed: unknown;
  let indexedError: string | undefined;
  try {
    indexed = await input.service.proposals({ dao: input.dao, first: input.first, skip: 0 });
  } catch (error) {
    indexedError = compactError(error);
  }
  const proposals = extractProposals(indexed);
  if (!proposals.length && indexedError) {
    return {
      dao: input.dao,
      queue: [],
      indexedError,
      mode: 'chain-fallback-unavailable',
      note: 'Indexed proposal list failed. process-queue needs indexed proposalData to build process transactions.',
    };
  }
  const candidates = proposals
    .filter((proposal) => (
      proposal.proposalId != null &&
      Number(proposal.graceEnds || 0) < Math.floor(Date.now() / 1000) &&
      Boolean(proposal.proposalData) &&
      !Boolean(proposal.cancelled) &&
      !Boolean(proposal.processed)
    ));

  if (!input.config.rpcUrl) {
    return {
      dao: input.dao,
      queue: candidates
        .sort((a, b) => Number(a.proposalId) - Number(b.proposalId))
        .map((proposal, index) => ({
          ...queueItem(proposal, deriveProposalLifecycle(proposal)),
          queueIndex: index,
          processFirst: index === 0,
          status: 'needsChainPreflight',
          note: 'Set RPC_URL to verify direct chain processability.',
        })),
    };
  }

  const checked = await Promise.all(candidates.map(async (proposal) => {
    try {
      const chain = await chainProposalContext(input.config, input.dao, proposal);
      return { proposal, lifecycle: deriveProposalLifecycle(proposal, Math.floor(Date.now() / 1000), chain), chain };
    } catch (error) {
      return {
        proposal,
        lifecycle: {
          status: 'chainPreflightError',
          processableNow: false,
          error: compactError(error),
        },
      };
    }
  }));

  const queue = checked
    .filter((item) => item.lifecycle.processableNow)
    .sort((a, b) => Number(a.proposal.proposalId) - Number(b.proposal.proposalId))
    .map((item, index) => ({ ...queueItem(item.proposal, item.lifecycle), queueIndex: index, processFirst: index === 0 }));

  return { dao: input.dao, queue, indexedError, mode: indexedError ? 'chain-fallback' : 'indexed+chain' };
}

export async function buildOldestReadyProcessTx(input: {
  config: Config;
  service: ServiceClient;
  chainId: number;
  dao: `0x${string}`;
  first: number;
}): Promise<BuiltTx> {
  const result = await processQueue(input);
  const queue = Array.isArray(result.queue) ? result.queue : [];
  const oldest = queue.find((item): item is { proposalId: string; proposalData: `0x${string}`; processGasLimit: string } => (
    typeof item === 'object' &&
    item !== null &&
    'processFirst' in item &&
    Boolean(item.processFirst) &&
    'proposalData' in item &&
    typeof item.proposalData === 'string'
  ));
  if (!oldest) throw new Error('No ready-to-process proposal found.');
  return buildProcessTx({
    chainId: input.chainId,
    dao: input.dao,
    proposal: Number(oldest.proposalId),
    proposalData: oldest.proposalData,
    gasLimit: BigInt(oldest.processGasLimit || DEFAULT_PROCESS_GAS_LIMIT),
  });
}

function publicClient(config: Config) {
  if (!config.rpcUrl) throw new Error('RPC_URL is required for direct chain reads.');
  if (config.chainId !== 8453) throw new Error('Only Base chainId 8453 is currently supported for direct chain reads.');
  return createPublicClient({ chain: base, transport: http(config.rpcUrl) });
}

async function safeAddressForDao(service: ServiceClient, dao: `0x${string}`): Promise<`0x${string}`> {
  const indexed = await service.dao({ dao });
  if (isRecord(indexed) && isRecord(indexed.dao) && typeof indexed.dao.safeAddress === 'string') {
    return indexed.dao.safeAddress.toLowerCase() as `0x${string}`;
  }
  throw new Error('Could not resolve DAO Safe address from indexed DAO data. Pass --address 0xSAFE.');
}

function explorerBaseUrl(chainId: number): string {
  if (chainId === 8453) return 'https://basescan.org';
  if (chainId === 1) return 'https://etherscan.io';
  return 'https://basescan.org';
}

async function chainProposalContext(config: Config, dao: `0x${string}`, proposal: IndexedProposal): Promise<Record<string, unknown>> {
  const client = publicClient(config);
  const id = Number(proposal.proposalId);
  const prevId = Number(proposal.prevProposalId || 0);
  const [rawStatus, state, prevState, raw] = await Promise.all([
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'getProposalStatus', args: [id] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'state', args: [id] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'state', args: [prevId] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposals', args: [BigInt(id)] }),
  ]);
  const tuple = namedProposalTuple(raw);
  const baalGas = BigInt(tuple.baalGas || '0');
  return {
    namedStatus: namedProposalStatus(rawStatus),
    state: Number(state),
    prevState: Number(prevState),
    proposal: tuple,
    processGasLimit: (baalGas > 0n ? baalGas + PROCESS_PROPOSAL_GAS_LIMIT_ADDITION : DEFAULT_PROCESS_GAS_LIMIT).toString(),
  };
}

async function chainOnlyProposal(config: Config, dao: `0x${string}`, proposalId: number): Promise<IndexedProposal> {
  const client = publicClient(config);
  const [raw, rawStatus, state] = await Promise.all([
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposals', args: [BigInt(proposalId)] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'getProposalStatus', args: [proposalId] }),
    client.readContract({ address: dao, abi: BAAL_ABI, functionName: 'state', args: [proposalId] }),
  ]);
  const tuple = namedProposalTuple(raw);
  const status = namedProposalStatus(rawStatus);
  return {
    id: `${dao}-proposal-${proposalId}`,
    proposalId,
    prevProposalId: tuple.prevProposalId,
    sponsored: Number(tuple.votingStarts || '0') > 0,
    processed: Boolean(status.processed),
    cancelled: Boolean(status.cancelled),
    passed: Boolean(status.passed),
    actionFailed: Boolean(status.actionFailed),
    votingStarts: tuple.votingStarts,
    votingEnds: tuple.votingEnds,
    graceEnds: tuple.graceEnds,
    expiration: tuple.expiration,
    yesVotes: tuple.yesVotes,
    noVotes: tuple.noVotes,
    title: `Proposal ${proposalId}`,
    proposalType: 'UNKNOWN_CHAIN_ONLY',
    chainState: Number(state),
  };
}

function deriveProposalLifecycle(proposal: IndexedProposal, now = Math.floor(Date.now() / 1000), chain: Record<string, unknown> = {}) {
  const sponsored = Boolean(proposal.sponsored);
  const chainStatus = isRecord(chain.namedStatus) ? chain.namedStatus : {};
  const hasChainStatus = Array.isArray(chainStatus.raw);
  const cancelled = hasChainStatus ? Boolean(chainStatus.cancelled) : Boolean(proposal.cancelled);
  const processed = hasChainStatus ? Boolean(chainStatus.processed) : Boolean(proposal.processed);
  const passed = hasChainStatus ? Boolean(chainStatus.passed) : Boolean(proposal.passed);
  const actionFailed = hasChainStatus ? Boolean(chainStatus.actionFailed) : Boolean(proposal.actionFailed);
  const votingStarts = Number(proposal.votingStarts || 0);
  const votingEnds = Number(proposal.votingEnds || 0);
  const graceEnds = Number(proposal.graceEnds || 0);
  const yes = BigInt(String(proposal.yesBalance || proposal.yesVotes || '0'));
  const no = BigInt(String(proposal.noBalance || proposal.noVotes || '0'));
  const quorum = hasQuorum(proposal);
  const afterGrace = sponsored && !cancelled && !processed && now > graceEnds;
  const needsSponsor = !sponsored && !cancelled;
  const inVoting = sponsored && !cancelled && !processed && votingStarts < now && votingEnds > now;
  const inGrace = sponsored && !cancelled && !processed && votingEnds < now && graceEnds > now;
  const graphReady = afterGrace && yes > no && quorum;
  const prevState = typeof chain.prevState === 'number' ? chain.prevState : undefined;
  const state = typeof chain.state === 'number' ? chain.state : undefined;
  const prevStateEligible = prevState == null ? undefined : PREV_PROCESS_ELIGIBLE.has(prevState);
  const stateReady = state == null ? undefined : state === 5;
  const stateDefeated = state == null ? undefined : state === 7;
  const failedQuorum = afterGrace && state == null && !quorum;
  const failedVote = afterGrace && (stateDefeated == null ? yes <= no : stateDefeated);
  const processableNow = Boolean((stateReady == null ? graphReady : stateReady) && proposal.proposalData && prevStateEligible !== false);

  let status = 'unknown';
  if (needsSponsor) status = 'unsponsored';
  if (cancelled) status = 'cancelled';
  else if (actionFailed) status = 'actionFailed';
  else if (processed && passed) status = 'processedPassed';
  else if (processed && !passed) status = 'processedFailed';
  else if (inVoting) status = 'voting';
  else if (inGrace) status = 'grace';
  else if (processableNow) status = 'needsProcessing';
  else if (stateDefeated || failedQuorum || failedVote) status = 'failed';

  return {
    proposalId: String(proposal.proposalId ?? ''),
    status,
    needsSponsor,
    needsVote: inVoting,
    inVoting,
    inGrace,
    graphReady,
    chainReady: stateReady,
    processableNow,
    failedQuorum,
    failedVote,
    processed,
    passed,
    actionFailed,
    hasProposalData: Boolean(proposal.proposalData),
    chainState: state == null ? undefined : STATE_NAMES[state] || `unknown-${state}`,
    prevProposalId: String(proposal.prevProposalId ?? ''),
    prevState: prevState == null ? undefined : STATE_NAMES[prevState] || `unknown-${prevState}`,
    prevStateEligible,
    processGasLimit: typeof chain.processGasLimit === 'string' ? chain.processGasLimit : undefined,
  };
}

function queueItem(proposal: IndexedProposal, lifecycle: Record<string, unknown>) {
  return {
    proposalId: String(proposal.proposalId),
    title: proposal.title,
    proposalType: proposal.proposalType,
    prevProposalId: proposal.prevProposalId,
    status: lifecycle.status,
    chainReady: lifecycle.chainReady,
    processableNow: lifecycle.processableNow,
    previousProposalProcessed: lifecycle.prevStateEligible,
    indexedPassed: Boolean(proposal.passed),
    indexedProcessed: Boolean(proposal.processed),
    indexedCancelled: Boolean(proposal.cancelled),
    proposalData: proposal.proposalData,
    processGasLimit: isRecord(lifecycle) && typeof lifecycle.processGasLimit === 'string' ? lifecycle.processGasLimit : undefined,
  };
}

function hasQuorum(proposal: IndexedProposal): boolean {
  const totalShares = BigInt(String(proposal.dao?.totalShares || '0'));
  const quorumPercent = BigInt(String(proposal.dao?.quorumPercent || '0'));
  const yes = BigInt(String(proposal.yesBalance || proposal.yesVotes || '0'));
  if (totalShares === 0n) return false;
  return yes * 100n >= quorumPercent * totalShares;
}

function namedProposalStatus(status: readonly boolean[]): Record<string, unknown> {
  const values = Array.from(status || []);
  return {
    cancelled: Boolean(values[0]),
    processed: Boolean(values[1]),
    passed: Boolean(values[2]),
    actionFailed: Boolean(values[3]),
    raw: values.map(Boolean),
  };
}

function namedProposalTuple(raw: readonly unknown[]): Record<string, string> {
  const names = ['id', 'prevProposalId', 'votingStarts', 'votingEnds', 'graceEnds', 'expiration', 'baalGas', 'yesVotes', 'noVotes', 'maxTotalSharesAndLootAtVote', 'maxTotalSharesAtSponsor', 'sponsor', 'proposalDataHash'];
  return Object.fromEntries(names.map((name, index) => [name, stringifyValue(raw[index])]));
}

function stringifyValue(value: unknown): string {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function extractProposal(value: unknown): IndexedProposal | undefined {
  if (isRecord(value) && isRecord(value.proposal)) return value.proposal as IndexedProposal;
  return undefined;
}

function extractProposals(value: unknown): IndexedProposal[] {
  if (isRecord(value) && Array.isArray(value.proposals)) return value.proposals as IndexedProposal[];
  return [];
}

function compactProposal(proposal: IndexedProposal) {
  return {
    id: proposal.id,
    proposalId: proposal.proposalId,
    title: proposal.title,
    proposalType: proposal.proposalType,
    sponsored: proposal.sponsored,
    processed: proposal.processed,
    cancelled: proposal.cancelled,
    passed: proposal.passed,
    votingStarts: proposal.votingStarts,
    votingEnds: proposal.votingEnds,
    graceEnds: proposal.graceEnds,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function compactError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const schemaMessages = Array.from(raw.matchAll(/Type `[^`]+` has no field `[^`]+`/g)).map((match) => match[0]);
  if (schemaMessages.length) return Array.from(new Set(schemaMessages)).join('; ');
  const firstLine = raw.split('\n').find((line) => line.trim());
  return (firstLine || raw).slice(0, 500);
}

type IndexedProposal = Record<string, unknown> & {
  id?: string;
  proposalId?: string | number;
  title?: string;
  proposalType?: string;
  proposalData?: `0x${string}`;
  prevProposalId?: string | number;
  sponsored?: boolean;
  processed?: boolean;
  cancelled?: boolean;
  passed?: boolean;
  actionFailed?: boolean;
  votingStarts?: string | number;
  votingEnds?: string | number;
  graceEnds?: string | number;
  yesBalance?: string;
  noBalance?: string;
  yesVotes?: string;
  noVotes?: string;
  dao?: {
    totalShares?: string;
    quorumPercent?: string;
  };
};
