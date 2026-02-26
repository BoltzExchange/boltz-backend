import { crypto } from 'bitcoinjs-lib';
import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import Logger from '../../../../../lib/Logger';
import { generateSwapId, getHexString } from '../../../../../lib/Utils';
import { etherDecimals } from '../../../../../lib/consts/Consts';
import {
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../../lib/consts/Enums';
import type Database from '../../../../../lib/db/Database';
import Commitment from '../../../../../lib/db/models/Commitment';
import Pair from '../../../../../lib/db/models/Pair';
import Swap from '../../../../../lib/db/models/Swap';
import CommitmentRepository from '../../../../../lib/db/repositories/CommitmentRepository';
import PairRepository from '../../../../../lib/db/repositories/PairRepository';
import SwapRepository from '../../../../../lib/db/repositories/SwapRepository';
import TimeoutDeltaProvider from '../../../../../lib/service/TimeoutDeltaProvider';
import type ConsolidatedEventHandler from '../../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import { networks } from '../../../../../lib/wallet/ethereum/EvmNetworks';
import Commitments from '../../../../../lib/wallet/ethereum/contracts/Commitments';
import type Contracts from '../../../../../lib/wallet/ethereum/contracts/Contracts';
import { Feature } from '../../../../../lib/wallet/ethereum/contracts/Contracts';
import { getPostgresDatabase, wait } from '../../../../Utils';
import type { EthereumSetup } from '../../EthereumTools';
import {
  etherSwapCommitTypes,
  fundSignerWallet,
  getContracts,
  getEtherSwapDomain,
  getSigner,
} from '../../EthereumTools';

describe('Commitments', () => {
  let database: Database;
  let setup: EthereumSetup;
  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;
  let token: ERC20;
  let nextSignerNonce: number | undefined;

  const eventHandler = {
    handleEvent: jest.fn(),
  } as unknown as ConsolidatedEventHandler;

  const fetchSignerNonce = async () => {
    const address = await setup.signer.getAddress();
    const nonceHex = await setup.provider.send('eth_getTransactionCount', [
      address,
      'pending',
    ]);
    return Number(BigInt(nonceHex));
  };

  const syncSignerNonce = async () => {
    nextSignerNonce = await fetchSignerNonce();
  };

  const getSignerNonce = async () => {
    const pendingNonce = await fetchSignerNonce();
    if (nextSignerNonce === undefined || pendingNonce > nextSignerNonce) {
      nextSignerNonce = pendingNonce;
    }

    const nonce = nextSignerNonce!;
    nextSignerNonce = nonce + 1;
    return nonce;
  };

  beforeAll(async () => {
    database = getPostgresDatabase();
    await database.init();

    await PairRepository.addPair({
      id: 'ETH/BTC',
      base: 'ETH',
      quote: 'BTC',
    });

    setup = await getSigner();
    const contracts = await getContracts(setup.signer);
    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;
    token = contracts.token;

    await fundSignerWallet(setup.signer, setup.etherBase, token);
  });

  afterAll(async () => {
    setup.provider.destroy();

    await Commitment.destroy({ truncate: true, cascade: true });
    await Swap.destroy({ truncate: true, cascade: true });
    await Pair.destroy({ truncate: true, cascade: true });

    await database.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Wait until all pending transactions are confirmed to avoid nonce conflicts
    const address = await setup.signer.getAddress();
    let pendingCount: number;
    let latestCount: number;
    do {
      pendingCount = await setup.provider.getTransactionCount(
        address,
        'pending',
      );
      latestCount = await setup.provider.getTransactionCount(address, 'latest');
      if (pendingCount !== latestCount) {
        await wait(100);
      }
    } while (pendingCount !== latestCount);

    await syncSignerNonce();
  });

  describe('constructor', () => {
    test('should use default commitment timelock when not specified', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      expect(commitments['commitmentTimelockMinutes']).toEqual(14 * 24 * 60);
    });

    test('should use custom commitment timelock when specified', () => {
      const customTimelock = 60;
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
        customTimelock,
      );

      expect(commitments['commitmentTimelockMinutes']).toEqual(customTimelock);
    });
  });

  describe('init', () => {
    test('should initialize with provider, signer, and wallets', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const wallets = new Map();
      const contracts: Contracts[] = [];

      commitments.init(setup.provider as any, setup.signer, contracts, wallets);

      expect(commitments['provider']).toBe(setup.provider);
      expect(commitments['signer']).toBe(setup.signer);
      expect(commitments['wallets']).toBe(wallets);
      expect(commitments['contracts']).toEqual([]);
    });

    test('should filter contracts to only include those with CommitmentSwap feature', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const wallets = new Map();

      const contractWithCommitment = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap, Feature.BatchClaim]),
      } as Contracts;

      const contractWithoutCommitment = {
        version: 4n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.BatchClaim]),
      } as Contracts;

      const contractWithNoFeatures = {
        version: 3n,
        etherSwap,
        erc20Swap,
        features: new Set(),
      } as Contracts;

      const allContracts = [
        contractWithCommitment,
        contractWithoutCommitment,
        contractWithNoFeatures,
      ];

      commitments.init(
        setup.provider as any,
        setup.signer,
        allContracts,
        wallets,
      );

      expect(commitments['contracts']).toHaveLength(1);
      expect(commitments['contracts'][0]).toBe(contractWithCommitment);
    });

    test('should keep multiple contracts with CommitmentSwap feature', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const wallets = new Map();

      const contractV5 = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      const contractV6 = {
        version: 6n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contractV5, contractV6],
        wallets,
      );

      expect(commitments['contracts']).toHaveLength(2);
      expect(commitments['contracts']).toContain(contractV5);
      expect(commitments['contracts']).toContain(contractV6);
    });
  });

  describe('lockupDetails', () => {
    const createInitializedCommitments = (
      commitmentTimelockMinutes?: number,
    ) => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
        commitmentTimelockMinutes,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      return commitments;
    };

    test('should return EtherSwap address for native currency', async () => {
      const commitments = createInitializedCommitments();

      const details = await commitments.lockupDetails(networks.Ethereum.symbol);

      expect(details.contract).toEqual(await etherSwap.getAddress());
      expect(details.claimAddress).toEqual(await setup.signer.getAddress());
    });

    test('should return ERC20Swap address for token currency', async () => {
      const commitments = createInitializedCommitments();

      const details = await commitments.lockupDetails('USDT');

      expect(details.contract).toEqual(await erc20Swap.getAddress());
      expect(details.claimAddress).toEqual(await setup.signer.getAddress());
    });

    test('should calculate timelock based on commitment timelock minutes', async () => {
      const commitmentTimelockMinutes = 60;
      const commitments = createInitializedCommitments(
        commitmentTimelockMinutes,
      );

      const currentBlock = await setup.provider.getBlockNumber();
      const details = await commitments.lockupDetails(networks.Ethereum.symbol);

      const blockTime = TimeoutDeltaProvider.blockTimes.get(
        networks.Ethereum.symbol,
      )!;
      const expectedTimelock = Math.ceil(
        currentBlock + commitmentTimelockMinutes / blockTime,
      );

      expect(details.timelock).toEqual(expectedTimelock);
    });

    test('should use default timelock when not specified', async () => {
      const commitments = createInitializedCommitments();

      const currentBlock = await setup.provider.getBlockNumber();
      const details = await commitments.lockupDetails(networks.Ethereum.symbol);

      const defaultTimelockMinutes = 14 * 24 * 60;
      const blockTime = TimeoutDeltaProvider.blockTimes.get(
        networks.Ethereum.symbol,
      )!;
      const expectedTimelock = Math.ceil(
        currentBlock + defaultTimelockMinutes / blockTime,
      );

      expect(details.timelock).toEqual(expectedTimelock);
    });
  });

  describe('highestContractsVersion', () => {
    test('should return the contract with the highest version', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contractV5 = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      const contractV6 = {
        version: 6n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      const contractV7 = {
        version: 7n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contractV5, contractV7, contractV6],
        new Map(),
      );

      const highest = commitments['highestContractsVersion']();

      expect(highest).toBe(contractV7);
    });

    test('should return single contract when only one available', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      const highest = commitments['highestContractsVersion']();

      expect(highest).toBe(contract);
    });

    test('should throw when no contracts available', () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      commitments.init(setup.provider as any, setup.signer, [], new Map());

      expect(() => commitments['highestContractsVersion']()).toThrow(
        'no contracts with commitment swap support available',
      );
    });
  });

  describe('findContractForAddress', () => {
    test('should find EtherSwap contract by address', async () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      const etherSwapAddress = await etherSwap.getAddress();
      const result =
        await commitments['findContractForAddress'](etherSwapAddress);

      expect(result.version).toEqual(5n);
      expect(result.contract).toBe(etherSwap);
    });

    test('should find ERC20Swap contract by address', async () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      const erc20SwapAddress = await erc20Swap.getAddress();
      const result =
        await commitments['findContractForAddress'](erc20SwapAddress);

      expect(result.version).toEqual(5n);
      expect(result.contract).toBe(erc20Swap);
    });

    test('should find correct contract among multiple versions', async () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contractV5 = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      const otherEtherSwap = {
        getAddress: jest.fn().mockResolvedValue('0xOtherEtherSwap'),
      } as unknown as EtherSwap;
      const otherErc20Swap = {
        getAddress: jest.fn().mockResolvedValue('0xOtherErc20Swap'),
      } as unknown as ERC20Swap;

      const contractV6 = {
        version: 6n,
        etherSwap: otherEtherSwap,
        erc20Swap: otherErc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contractV6, contractV5],
        new Map(),
      );

      const etherSwapAddress = await etherSwap.getAddress();
      const result =
        await commitments['findContractForAddress'](etherSwapAddress);

      expect(result.version).toEqual(5n);
      expect(result.contract).toBe(etherSwap);
    });

    test('should throw when contract not found for address', async () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      const unknownAddress = '0x1234567890123456789012345678901234567890';

      await expect(
        commitments['findContractForAddress'](unknownAddress),
      ).rejects.toThrow(`contract not found for address: ${unknownAddress}`);
    });

    test('should throw when no contracts available', async () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      commitments.init(setup.provider as any, setup.signer, [], new Map());

      await expect(
        commitments['findContractForAddress']('0xAny'),
      ).rejects.toThrow('contract not found for address: 0xAny');
    });
  });

  describe('findLockupEvent', () => {
    const createInitializedCommitments = () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      return commitments;
    };

    test('should find EtherSwap lockup event', async () => {
      const commitments = createInitializedCommitments();

      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      const amount = 1000n;
      const timelock = 100n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const event = await commitments['findLockupEvent'](etherSwap, tx.hash);

      expect(event.amount).toEqual(amount);
      expect(event.timelock).toEqual(timelock);
      expect(event.refundAddress).toEqual(await setup.signer.getAddress());
      expect(event.preimageHash).toEqual(preimageHash);
      expect(event.tokenAddress).toBeUndefined();
      expect(event.logIndex).toBeGreaterThanOrEqual(0);
    });

    test('should find ERC20Swap lockup event', async () => {
      const commitments = createInitializedCommitments();

      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      const amount = 1000n;
      const timelock = 100n;

      const approveTx = await token.approve(
        await erc20Swap.getAddress(),
        amount,
        { nonce: await getSignerNonce() },
      );
      await approveTx.wait(1);

      const tx = await erc20Swap[
        'lock(bytes32,uint256,address,address,uint256)'
      ](
        preimageHash,
        amount,
        await token.getAddress(),
        await setup.signer.getAddress(),
        timelock,
        { nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const event = await commitments['findLockupEvent'](erc20Swap, tx.hash);

      expect(event.amount).toEqual(amount);
      expect(event.timelock).toEqual(timelock);
      expect(event.refundAddress).toEqual(await setup.signer.getAddress());
      expect(event.preimageHash).toEqual(preimageHash);
      expect(event.tokenAddress).toEqual(await token.getAddress());
      expect(event.logIndex).toBeGreaterThanOrEqual(0);
    });

    test('should find lockup event by logIndex when specified', async () => {
      const commitments = createInitializedCommitments();

      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      const amount = 1000n;
      const timelock = 100n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      const receipt = await tx.wait(1);

      const lockupLog = receipt!.logs.find(
        (log) =>
          log.topics[0] === etherSwap.interface.getEvent('Lockup').topicHash,
      )!;

      const event = await commitments['findLockupEvent'](
        etherSwap,
        tx.hash,
        lockupLog.index,
      );

      expect(event.logIndex).toEqual(lockupLog.index);
      expect(event.amount).toEqual(amount);
    });

    test('should throw when transaction not found', async () => {
      const commitments = createInitializedCommitments();

      const fakeTxHash =
        '0x1234567890123456789012345678901234567890123456789012345678901234';

      await expect(
        commitments['findLockupEvent'](etherSwap, fakeTxHash),
      ).rejects.toThrow('transaction not found');
    });

    test('should throw when lockup event not found in transaction', async () => {
      const commitments = createInitializedCommitments();

      const tx = await setup.signer.sendTransaction({
        to: await setup.etherBase.getAddress(),
        value: 1n,
        nonce: await getSignerNonce(),
      });
      await tx.wait(1);

      await expect(
        commitments['findLockupEvent'](etherSwap, tx.hash),
      ).rejects.toThrow('lockup event not found');
    });

    test('should throw when logIndex specified but not found', async () => {
      const commitments = createInitializedCommitments();

      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        await setup.signer.getAddress(),
        100,
        { value: 1000n, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const invalidLogIndex = 9999;

      await expect(
        commitments['findLockupEvent'](etherSwap, tx.hash, invalidLogIndex),
      ).rejects.toThrow('lockup event not found');
    });

    test('should not match lockup event from different contract address', async () => {
      const commitments = createInitializedCommitments();

      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      const amount = 1000n;
      const timelock = 100n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      // Create a mock EtherSwap with a different address but same interface
      // This simulates a scenario where another contract emits a Lockup event
      // with the same topic hash but from a different address
      const differentAddressEtherSwap = {
        getAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567890'),
        interface: etherSwap.interface,
      } as unknown as EtherSwap;

      await expect(
        commitments['findLockupEvent'](differentAddressEtherSwap, tx.hash),
      ).rejects.toThrow('lockup event not found');
    });
  });

  describe('commit', () => {
    const zeroPreimageHash = Buffer.alloc(32);

    const createInitializedCommitments = () => {
      const commitments = new Commitments(
        Logger.disabledLogger,
        networks.Ethereum,
        eventHandler,
      );

      const contract = {
        version: 5n,
        etherSwap,
        erc20Swap,
        features: new Set([Feature.CommitmentSwap]),
      } as Contracts;

      commitments.init(
        setup.provider as any,
        setup.signer,
        [contract],
        new Map(),
      );

      return commitments;
    };

    const createSwap = async (
      lockupAddress: string,
      expectedAmount: number,
      timeoutBlockHeight: number,
    ) => {
      const preimage = randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      const id = generateSwapId(SwapVersion.Taproot);

      await SwapRepository.addSwap({
        id,
        lockupAddress,
        expectedAmount,
        timeoutBlockHeight,
        pair: 'ETH/BTC',
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        preimageHash: getHexString(preimageHash),
        status: SwapUpdateEvent.SwapCreated,
        createdRefundSignature: false,
      });

      return {
        id,
        preimage,
        preimageHash,
      };
    };

    test('should create commitment for valid Ether swap', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await commitments.commit(
        networks.Ethereum.symbol,
        id,
        signature,
        tx.hash,
      );

      const commitment = await CommitmentRepository.getBySwapId(id);
      expect(commitment).not.toBeNull();
      expect(commitment!.swapId).toEqual(id);
      expect(commitment!.transactionHash).toEqual(tx.hash);

      const expectedLockupHash = await etherSwap.hashValues(
        zeroPreimageHash,
        amount,
        await setup.signer.getAddress(),
        await setup.signer.getAddress(),
        timelock,
      );
      expect(commitment!.lockupHash).toEqual(expectedLockupHash);

      expect(eventHandler.handleEvent).toHaveBeenCalledTimes(1);
      expect(eventHandler.handleEvent).toHaveBeenCalledWith(
        'eth.lockup',
        expect.objectContaining({
          version: 5n,
          etherSwapValues: expect.objectContaining({
            amount,
            timelock,
            claimAddress: await setup.signer.getAddress(),
            refundAddress: await setup.signer.getAddress(),
          }),
        }),
      );
    });

    test('should create commitment when lockup amount has extra precision', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const lockupAmount = BigInt(expectedAmount) * etherDecimals + 1n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: lockupAmount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: lockupAmount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await commitments.commit(
        networks.Ethereum.symbol,
        id,
        signature,
        tx.hash,
      );

      const commitment = await CommitmentRepository.getBySwapId(id);
      expect(commitment).not.toBeNull();
      expect(commitment!.swapId).toEqual(id);
      expect(commitment!.transactionHash).toEqual(tx.hash);
    });

    test('should throw when lockup amount is below expected amount', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 2;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const insufficientAmount = BigInt(expectedAmount) * etherDecimals - 1n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: insufficientAmount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: insufficientAmount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('insufficient amount:');
    });

    test('should throw when lockup amount is unacceptable overpay', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 100;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const overpaidAmount = BigInt(expectedAmount * 3) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: overpaidAmount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: overpaidAmount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('overpaid amount:');
    });

    test('should accept overpay at always-allowed boundary', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 100;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const overpaidAmount = BigInt(expectedAmount + 121) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: overpaidAmount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: overpaidAmount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await commitments.commit(
        networks.Ethereum.symbol,
        id,
        signature,
        tx.hash,
      );

      const commitment = await CommitmentRepository.getBySwapId(id);
      expect(commitment).not.toBeNull();
      expect(commitment!.swapId).toEqual(id);
    });

    test('should throw when swap not found', async () => {
      const commitments = createInitializedCommitments();

      await expect(
        commitments.commit(
          networks.Ethereum.symbol,
          'nonexistent-swap-id',
          '0x123',
          '0x456',
        ),
      ).rejects.toThrow('swap not found');
    });

    test('should throw when preimage hash is not all zeros', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('commitment preimage hash has to be all zeros');
    });

    test('should throw when commitment timelock expires before swap timeout', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const currentBlock = await setup.provider.getBlockNumber();
      const swapTimeout = currentBlock + 1000;
      const commitmentTimelock = currentBlock + 500;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        swapTimeout,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        commitmentTimelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock: commitmentTimelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('commitment timelock expires before swap timeout');
    });

    test('should throw when commitment already exists', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await commitments.commit(
        networks.Ethereum.symbol,
        id,
        signature,
        tx.hash,
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('commitment exists already');
    });

    test('should throw when signature is invalid', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      // Sign with wrong amount to make signature invalid
      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: amount + 1n,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('invalid signature');
    });

    test('should throw when signature format is invalid', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const amount = BigInt(expectedAmount) * etherDecimals;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: amount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      await expect(
        commitments.commit(
          networks.Ethereum.symbol,
          id,
          'invalid-signature',
          tx.hash,
        ),
      ).rejects.toThrow('invalid signature:');
    });

    test('should throw when contract not found for lockup address', async () => {
      const commitments = createInitializedCommitments();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id } = await createSwap(
        '0x1234567890123456789012345678901234567890',
        expectedAmount,
        timelock - 100,
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, '0x123', '0x456'),
      ).rejects.toThrow('contract not found for address:');
    });

    test('should throw when signed amount does not match lockup event amount', async () => {
      const commitments = createInitializedCommitments();
      const etherSwapAddress = await etherSwap.getAddress();

      const expectedAmount = 1;
      const timelock = (await setup.provider.getBlockNumber()) + 1000;

      const { id, preimageHash } = await createSwap(
        etherSwapAddress,
        expectedAmount,
        timelock - 100,
      );

      const expectedAmountWei = BigInt(expectedAmount) * etherDecimals;
      const lockedAmount = expectedAmountWei + 1n;

      const tx = await etherSwap['lock(bytes32,address,uint256)'](
        zeroPreimageHash,
        await setup.signer.getAddress(),
        timelock,
        { value: lockedAmount, nonce: await getSignerNonce() },
      );
      await tx.wait(1);

      const signature = await setup.signer.signTypedData(
        await getEtherSwapDomain(setup.provider, etherSwap),
        etherSwapCommitTypes,
        {
          preimageHash,
          amount: expectedAmountWei,
          claimAddress: await setup.signer.getAddress(),
          refundAddress: await setup.signer.getAddress(),
          timelock,
        },
      );

      await expect(
        commitments.commit(networks.Ethereum.symbol, id, signature, tx.hash),
      ).rejects.toThrow('invalid signature');
    });
  });
});
