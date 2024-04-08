import { crypto } from 'bitcoinjs-lib';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import { ERC20SwapValues, EtherSwapValues } from '../../../lib/consts/Types';
import Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Blocks from '../../../lib/service/Blocks';
import Errors from '../../../lib/swap/Errors';
import EthereumNursery from '../../../lib/swap/EthereumNursery';
import Wallet from '../../../lib/wallet/Wallet';
import EthereumManager from '../../../lib/wallet/ethereum/EthereumManager';
import { Ethereum } from '../../../lib/wallet/ethereum/EvmNetworks';
import ERC20WalletProvider from '../../../lib/wallet/providers/ERC20WalletProvider';
import EtherWalletProvider from '../../../lib/wallet/providers/EtherWalletProvider';
import { wait } from '../../Utils';

type blockCallback = (height: number) => void;

type claimCallback = (args: {
  transactionHash: string;
  preimageHash: Buffer;
  preimage: Buffer;
}) => void;

type ethLockupCallback = (args: {
  transaction: any;
  etherSwapValues: EtherSwapValues;
}) => void;
type erc20LockupCallback = (args: {
  transaction: any;
  erc20SwapValues: ERC20SwapValues;
}) => void;

jest.mock('../../../lib/wallet/providers/EtherWalletProvider', () => {
  return jest.fn().mockImplementation((symbol: string) => ({
    symbol,
    type: CurrencyType.Ether,
  }));
});

const MockedEtherWalletProvider = <jest.Mock<EtherWalletProvider>>(
  EtherWalletProvider
);

const mockTokenAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const mockGetTokenAddress = jest.fn().mockReturnValue(mockTokenAddress);

const mockNormalizeTokenAmount = jest
  .fn()
  .mockImplementation((amount: bigint) => {
    return Number(amount / BigInt(10) ** BigInt(2));
  });

const mockFormatTokenAmount = jest.fn().mockImplementation((amount: number) => {
  return BigInt(amount) * BigInt(10) ** BigInt(2);
});

jest.mock('../../../lib/wallet/providers/ERC20WalletProvider', () => {
  return jest.fn().mockImplementation((symbol: string) => ({
    symbol,
    type: CurrencyType.ERC20,
    walletProvider: {
      getTokenAddress: mockGetTokenAddress,
      formatTokenAmount: mockFormatTokenAmount,
      normalizeTokenAmount: mockNormalizeTokenAmount,
    },
  }));
});

const MockedErc20WalletProvider = <jest.Mock<ERC20WalletProvider>>(
  ERC20WalletProvider
);

let emitBlock: blockCallback;

const mockOnProvider = jest
  .fn()
  .mockImplementation((event: string, callback: any): any => {
    switch (event) {
      case 'block':
        emitBlock = callback;
        return new Promise(() => {});
    }
  });

const mockGetTransaction = jest.fn().mockResolvedValue(null);

let emitEthClaim: claimCallback;
let emitErc20Claim: claimCallback;
let emitEthLockup: ethLockupCallback;
let emitErc20Lockup: erc20LockupCallback;

const mockOnContractEventHandler = jest
  .fn()
  .mockImplementation((event: string, callback: any) => {
    switch (event) {
      case 'eth.lockup':
        emitEthLockup = callback;
        break;

      case 'eth.claim':
        emitEthClaim = callback;
        break;

      case 'erc20.lockup':
        emitErc20Lockup = callback;
        break;

      case 'erc20.claim':
        emitErc20Claim = callback;
        break;
    }
  });

const mockAddress = '0x735Ec659CB2E2D2B778F8D4178ce2a521D617119';

jest.mock('../../../lib/wallet/ethereum/EthereumManager', () => {
  return jest.fn().mockImplementation(() => ({
    address: mockAddress,
    networkDetails: Ethereum,
    provider: {
      on: mockOnProvider,
      getTransaction: mockGetTransaction,
    },
    contractEventHandler: {
      on: mockOnContractEventHandler,
    },
  }));
});

const MockedEthereumManager = <jest.Mock<EthereumManager>>(
  (<any>EthereumManager)
);

let mockGetSwapResult: any = null;
const mockGetSwap = jest.fn().mockImplementation(async () => {
  return mockGetSwapResult;
});

let mockGetSwapsExpirableResult: any[] = [];
const mockGetSwapsExpirable = jest.fn().mockImplementation(async () => {
  return mockGetSwapsExpirableResult;
});

const mockSetLockupTransaction = jest
  .fn()
  .mockImplementation(
    async (swap: Swap, lockupTransactionId: string, onchainAmount: number) => {
      return {
        ...swap,
        onchainAmount,
        lockupTransactionId,
      };
    },
  );

jest.mock('../../../lib/db/repositories/SwapRepository');

let mockGetReverseSwapResult: any = null;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

const mockSetReverseSwapStatus = jest
  .fn()
  .mockImplementation(async (reverseSwap, status) => {
    return {
      ...reverseSwap,
      status,
    };
  });

let mockGetReverseSwapsExpirableResult: any[] = [];
const mockGetReverseSwapsExpirable = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsExpirableResult;
});

jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

const examplePreimage = getHexBuffer(
  'dfc6a9bbcf0d7dcf1ce119be7c68c61f078a3548c596afac794d2247265b03b3',
);
const examplePreimageHash = crypto.sha256(examplePreimage);

const exampleTransaction = {
  hash: '0x193be8365ec997f97156dbd894d446135eca8cfbfe3417404c50f32015ee5bb2',
};

const blocks = {
  isBlocked: jest.fn().mockImplementation((addr) => addr === 'blocked'),
} as unknown as Blocks;

describe('EthereumNursery', () => {
  const nursery = new EthereumNursery(
    Logger.disabledLogger,
    {
      wallets: new Map<string, Wallet>([
        ['BTC', {} as any],
        ['ETH', new MockedEtherWalletProvider('ETH') as any],
        ['USDT', new MockedErc20WalletProvider('USDT') as any],
      ]),
    } as any,
    new MockedEthereumManager(),
    blocks,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    SwapRepository.getSwap = mockGetSwap;
    SwapRepository.getSwapsExpirable = mockGetSwapsExpirable;
    SwapRepository.setLockupTransaction = mockSetLockupTransaction;

    ReverseSwapRepository.getReverseSwap = mockGetReverseSwap;
    ReverseSwapRepository.getReverseSwaps = mockGetReverseSwaps;
    ReverseSwapRepository.setReverseSwapStatus = mockSetReverseSwapStatus;
    ReverseSwapRepository.getReverseSwapsExpirable =
      mockGetReverseSwapsExpirable;
    nursery.removeAllListeners();
  });

  test('should init', async () => {
    mockGetReverseSwapsResult = [
      // Should ignore this Reverse Swap because of its pair...
      {
        pair: 'BTC/BTC',
        type: SwapType.ReverseSubmarine,
        transactionId: 'btcSwapTransactionId',
      },
      // ...but attempt to find a transaction for this Reverse Swap
      {
        pair: 'ETH/BTC',
        orderSide: OrderSide.BUY,
        type: SwapType.ReverseSubmarine,
        transactionId: 'ethSwapTransactionId',
      },
      // Should also ignore this pair
      {
        pair: '404/NotFound',
        orderSide: OrderSide.BUY,
        type: SwapType.ReverseSubmarine,
        transactionId: 'notFoundTransactionId',
      },
    ];
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);

    await nursery.init();

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: SwapUpdateEvent.TransactionMempool,
    });

    expect(mockGetTransaction).toHaveBeenCalledTimes(1);
    expect(mockGetTransaction).toHaveBeenCalledWith(
      mockGetReverseSwapsResult[1].transactionId,
    );
  });

  test('should listen to contract transactions', async () => {
    expect.assertions(4);

    nursery.once('lockup.confirmed', ({ swap, transactionHash }) => {
      expect(swap).toEqual({
        type: SwapType.ReverseSubmarine,
        status: SwapUpdateEvent.TransactionConfirmed,
      });
      expect(transactionHash).toEqual(exampleTransaction);
    });

    nursery.listenContractTransaction(
      {
        type: SwapType.ReverseSubmarine,
      } as any,
      {
        wait: jest.fn().mockResolvedValue(undefined),
      } as any,
    );

    // A lockup transaction that confirms but reverts
    const rejectedReason = 'did not feel like it';

    nursery.once('lockup.failedToSend', ({ swap, reason }) => {
      expect(swap).toEqual({
        type: SwapType.ReverseSubmarine,
        status: SwapUpdateEvent.TransactionFailed,
      });
      expect(reason).toEqual(rejectedReason);
    });

    nursery.listenContractTransaction(
      {
        type: SwapType.ReverseSubmarine,
      } as any,
      {
        wait: jest.fn().mockRejectedValue(rejectedReason),
      } as any,
    );

    await wait(50);
  });

  test('should listen for EtherSwap lockup events', async () => {
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

    let lockupEmitted = false;
    let lockupFailed = 0;

    mockGetSwapResult = {
      pair: 'ETH/BTC',
      expectedAmount: 10,
      type: SwapType.Submarine,
      orderSide: OrderSide.SELL,
      timeoutBlockHeight: 11102219,
    };

    const suppliedEtherSwapValues = {
      claimAddress: mockAddress,
      amount: BigInt('100000000000'),
      preimageHash: getHexString(examplePreimageHash),
      timelock: mockGetSwapResult.timeoutBlockHeight,
    } as any;

    nursery.once('eth.lockup', ({ transactionHash, etherSwapValues }) => {
      expect(transactionHash).toEqual(exampleTransaction.hash);
      expect(etherSwapValues).toEqual(suppliedEtherSwapValues);

      lockupEmitted = true;
    });

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(examplePreimageHash),
      status: {
        [Op.or]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
      },
    });

    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(
      mockGetSwapResult,
      exampleTransaction.hash,
      10,
      true,
    );

    expect(lockupEmitted).toEqual(true);

    /*
     * Failed verifications
     */
    jest.clearAllMocks();

    lockupEmitted = false;

    // Claim address is wrong
    suppliedEtherSwapValues.claimAddress =
      '0x6981698B1275eD7727B7F5C3C54d9FE4d8ffEd5E';

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INVALID_CLAIM_ADDRESS(
          suppliedEtherSwapValues.claimAddress,
          mockAddress,
        ).message,
      );

      lockupFailed += 1;
    });

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

    expect(lockupFailed).toEqual(1);

    // Timeout is wrong
    suppliedEtherSwapValues.claimAddress = mockAddress;
    suppliedEtherSwapValues.timelock -= 1;

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INVALID_TIMELOCK(
          suppliedEtherSwapValues.timelock,
          mockGetSwapResult.timeoutBlockHeight,
        ).message,
      );

      lockupFailed += 1;
    });

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(2);

    expect(lockupFailed).toEqual(2);

    // Amount is less than expected
    suppliedEtherSwapValues.timelock = mockGetSwapResult.timeoutBlockHeight;
    suppliedEtherSwapValues.amount = BigInt('99999999999');

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INSUFFICIENT_AMOUNT(9, mockGetSwapResult.expectedAmount).message,
      );

      lockupFailed += 1;
    });

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(3);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(3);

    expect(lockupFailed).toEqual(3);

    /*
     * Cases that should not even start the verification logic
     */
    jest.clearAllMocks();

    lockupEmitted = false;
    lockupFailed = 0;

    nursery.on('eth.lockup', () => {
      lockupEmitted = true;
    });

    nursery.on('lockup.failed', () => {
      lockupFailed += 1;
    });

    // Chain currency is not Ether
    mockGetSwapResult.orderSide = OrderSide.BUY;

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(0);

    expect(lockupEmitted).toEqual(false);
    expect(lockupFailed).toEqual(0);

    // No suitable Swap in database
    mockGetSwapResult = null;

    await emitEthLockup({
      transaction: exampleTransaction,
      etherSwapValues: suppliedEtherSwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(0);

    expect(lockupEmitted).toEqual(false);
    expect(lockupFailed).toEqual(0);
  });

  test('should reject EtherSwap lockup transaction from blocked addresses', async () => {
    const lockupPromise = new Promise<void>((resolve) => {
      nursery.once('lockup.failed', ({ reason }) => {
        expect(reason).toEqual(Errors.BLOCKED_ADDRESS().message);
        resolve();
      });
    });

    mockGetSwapResult = {
      pair: 'ETH/BTC',
      expectedAmount: 10,
      type: SwapType.Submarine,
      orderSide: OrderSide.SELL,
      timeoutBlockHeight: 11102219,
    };

    emitEthLockup({
      transaction: { ...exampleTransaction, from: 'blocked' },
      etherSwapValues: {
        claimAddress: mockAddress,
        amount: BigInt('100000000000'),
        preimageHash: getHexString(examplePreimageHash),
        timelock: mockGetSwapResult.timeoutBlockHeight,
      } as any,
    });

    await lockupPromise;
  });

  test('should listen to EtherSwap claim events', async () => {
    let emittedEvents = 0;

    mockGetReverseSwapResult = {
      some: 'data',
      type: SwapType.ReverseSubmarine,
    };

    nursery.on('claim', ({ swap, preimage }) => {
      expect(swap).toEqual(mockGetReverseSwapResult);
      expect(preimage).toEqual(examplePreimage);

      emittedEvents += 1;
    });

    await emitEthClaim({
      preimage: examplePreimage,
      preimageHash: examplePreimageHash,
      transactionHash: exampleTransaction.hash,
    });

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(examplePreimageHash),
      status: {
        [Op.not]: SwapUpdateEvent.InvoiceSettled,
      },
    });

    expect(emittedEvents).toEqual(1);

    // No suitable Swap in database
    mockGetReverseSwapResult = null;

    await emitEthClaim({
      preimage: examplePreimage,
      preimageHash: examplePreimageHash,
      transactionHash: exampleTransaction.hash,
    });

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(emittedEvents).toEqual(1);
  });

  test('should listen for ERC20Swap lockup events', async () => {
    let lockupEmitted = false;
    let lockupFailed = 0;

    mockGetSwapResult = {
      pair: 'BTC/USDT',
      expectedAmount: 10,
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      timeoutBlockHeight: 11102222,
    };

    const suppliedERC20SwapValues = {
      amount: BigInt('1000'),
      claimAddress: mockAddress,
      tokenAddress: mockTokenAddress,
      timelock: mockGetSwapResult.timeoutBlockHeight,
      preimageHash: getHexString(examplePreimageHash),
    } as any;

    nursery.once('erc20.lockup', ({ transactionHash, erc20SwapValues }) => {
      expect(transactionHash).toEqual(exampleTransaction.hash);
      expect(erc20SwapValues).toEqual(suppliedERC20SwapValues);

      lockupEmitted = true;
    });

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(examplePreimageHash),
      status: {
        [Op.or]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
      },
    });

    expect(mockNormalizeTokenAmount).toHaveBeenCalledTimes(1);
    expect(mockNormalizeTokenAmount).toHaveBeenCalledWith(
      suppliedERC20SwapValues.amount,
    );

    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(
      mockGetSwapResult,
      exampleTransaction.hash,
      10,
      true,
    );

    expect(mockGetTokenAddress).toHaveBeenCalledTimes(1);

    expect(mockFormatTokenAmount).toHaveBeenCalledTimes(1);
    expect(mockFormatTokenAmount).toHaveBeenCalledWith(
      mockGetSwapResult.expectedAmount,
    );

    expect(lockupEmitted).toEqual(true);

    /*
     * Failed verifications
     */
    jest.clearAllMocks();

    lockupEmitted = false;

    // Claim address is wrong
    suppliedERC20SwapValues.claimAddress =
      '0x6981698B1275eD7727B7F5C3C54d9FE4d8ffEd5E';

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INVALID_CLAIM_ADDRESS(
          suppliedERC20SwapValues.claimAddress,
          mockAddress,
        ).message,
      );

      lockupFailed += 1;
    });

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

    expect(lockupFailed).toEqual(1);

    // Token address is wrong
    suppliedERC20SwapValues.claimAddress = mockAddress;
    suppliedERC20SwapValues.tokenAddress = mockAddress;

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INVALID_TOKEN_LOCKED(
          suppliedERC20SwapValues.tokenAddress,
          suppliedERC20SwapValues.claimAddress,
        ).message,
      );

      lockupFailed += 1;
    });

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(2);

    expect(lockupFailed).toEqual(2);

    // Timeout is wrong
    suppliedERC20SwapValues.tokenAddress = mockTokenAddress;
    suppliedERC20SwapValues.timelock -= 1;

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INVALID_TIMELOCK(
          suppliedERC20SwapValues.timelock,
          mockGetSwapResult.timeoutBlockHeight,
        ).message,
      );

      lockupFailed += 1;
    });

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(3);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(3);

    expect(lockupFailed).toEqual(3);

    // Amount is less than expected
    suppliedERC20SwapValues.timelock = mockGetSwapResult.timeoutBlockHeight;
    suppliedERC20SwapValues.amount = BigInt('999');

    nursery.once('lockup.failed', ({ reason }) => {
      expect(reason).toEqual(
        Errors.INSUFFICIENT_AMOUNT(9, mockGetSwapResult.expectedAmount).message,
      );

      lockupFailed += 1;
    });

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(4);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(4);

    expect(lockupFailed).toEqual(4);

    /*
     * Cases that should not even start the verification logic
     */
    jest.clearAllMocks();

    lockupEmitted = false;
    lockupFailed = 0;

    lockupFailed = 0;

    nursery.on('erc20.lockup', () => {
      lockupEmitted = true;
    });

    nursery.on('lockup.failed', () => {
      lockupFailed += 1;
    });

    // Chain currency is not a token
    mockGetSwapResult.orderSide = OrderSide.SELL;

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(0);

    expect(lockupEmitted).toEqual(false);
    expect(lockupFailed).toEqual(0);

    // No suitable Swap in database
    mockGetSwapResult = null;

    await emitErc20Lockup({
      transaction: exampleTransaction,
      erc20SwapValues: suppliedERC20SwapValues,
    });

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(0);

    expect(lockupEmitted).toEqual(false);
    expect(lockupFailed).toEqual(0);
  });

  test('should reject ERC20Swap lockup transaction from blocked addresses', async () => {
    const lockupPromise = new Promise<void>((resolve) => {
      nursery.once('lockup.failed', ({ reason }) => {
        expect(reason).toEqual(Errors.BLOCKED_ADDRESS().message);
        resolve();
      });
    });

    mockGetSwapResult = {
      pair: 'BTC/USDT',
      expectedAmount: 10,
      orderSide: OrderSide.BUY,
      type: SwapType.Submarine,
      timeoutBlockHeight: 11102222,
    };

    emitErc20Lockup({
      transaction: { ...exampleTransaction, from: 'blocked' },
      erc20SwapValues: {
        claimAddress: mockAddress,
        amount: BigInt('1000'),
        tokenAddress: mockTokenAddress,
        timelock: mockGetSwapResult.timeoutBlockHeight,
        preimageHash: getHexString(examplePreimageHash),
      } as any,
    });

    await lockupPromise;
  });

  test('should listen to ERC20Swap claim events', async () => {
    let emittedEvents = 0;

    mockGetReverseSwapResult = {
      some: 'data',
    };

    nursery.on('claim', ({ swap, preimage }) => {
      expect(swap).toEqual(mockGetReverseSwapResult);
      expect(preimage).toEqual(examplePreimage);

      emittedEvents += 1;
    });

    await emitErc20Claim({
      preimage: examplePreimage,
      preimageHash: examplePreimageHash,
      transactionHash: exampleTransaction.hash,
    });

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(examplePreimageHash),
      status: {
        [Op.not]: SwapUpdateEvent.InvoiceSettled,
      },
    });

    expect(emittedEvents).toEqual(1);

    // No suitable Swap in database
    mockGetReverseSwapResult = null;

    await emitErc20Claim({
      preimage: examplePreimage,
      preimageHash: examplePreimageHash,
      transactionHash: exampleTransaction.hash,
    });

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(emittedEvents).toEqual(1);
  });

  test('should handle expired Swaps', async () => {
    ChainSwapRepository.getChainSwapsExpirable = jest
      .fn()
      .mockResolvedValue([]);
    mockGetSwapsExpirableResult = [
      // Expired EtherSwap
      {
        pair: 'ETH/BTC',
        orderSide: OrderSide.SELL,
      },
      // Expired ERC20Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
      },
      // Expired BTC/BTC swap that should not emit an event
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
      },
    ];

    let eventsEmitted = 0;

    nursery.on('swap.expired', ({ swap, isEtherSwap }) => {
      if (eventsEmitted === 0) {
        expect(swap).toEqual(mockGetSwapsExpirableResult[0]);
        expect(isEtherSwap).toEqual(true);
      } else {
        expect(swap).toEqual(mockGetSwapsExpirableResult[1]);
        expect(isEtherSwap).toEqual(false);
      }

      eventsEmitted += 1;
    });

    const emittedBlockHeight = 123321;
    await emitBlock(emittedBlockHeight);

    expect(mockGetSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetSwapsExpirable).toHaveBeenCalledWith(emittedBlockHeight);

    expect(eventsEmitted).toEqual(2);
  });

  test('should handle expired Reverse Swaps', async () => {
    mockGetReverseSwapsExpirableResult = [
      // Expired EtherSwap
      {
        pair: 'ETH/BTC',
        orderSide: OrderSide.BUY,
      },
      // Expired ERC20Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.SELL,
      },
      // Expired BTC/BTC swap that should not emit an event
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
      },
    ];

    let eventsEmitted = 0;

    nursery.on('reverseSwap.expired', ({ reverseSwap, isEtherSwap }) => {
      if (eventsEmitted === 0) {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[0]);
        expect(isEtherSwap).toEqual(true);
      } else {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[1]);
        expect(isEtherSwap).toEqual(false);
      }

      eventsEmitted += 1;
    });

    const emittedBlockHeight = 123321;
    await emitBlock(emittedBlockHeight);

    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledWith(
      emittedBlockHeight,
    );

    expect(eventsEmitted).toEqual(2);
  });
});
