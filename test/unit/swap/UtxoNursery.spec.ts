import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { Transaction } from '@scure/btc-signer';
import {
  OutputType,
  Scripts,
  SwapTreeSerializer,
  detectSwap,
  swapTree,
} from 'boltz-core';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import {
  addressFromOutputScript,
  outputScriptFromAddress,
} from '../../../lib/AddressUtils';
import * as Core from '../../../lib/Core';
import { createMusig, setup, tweakMusig } from '../../../lib/Core';
import Logger from '../../../lib/Logger';
import {
  getHexBuffer,
  getHexString,
  transactionHashToId,
} from '../../../lib/Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ClaimTransactionRepository from '../../../lib/db/repositories/ClaimTransactionRepository';
import PayjoinReceiverRepository, {
  PayjoinLockupMatch,
} from '../../../lib/db/repositories/PayjoinReceiverRepository';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import type LockupTransactionTracker from '../../../lib/rates/LockupTransactionTracker';
import { TransactionStatus } from '../../../lib/sidecar/Sidecar';
import Errors from '../../../lib/swap/Errors';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import UtxoNursery from '../../../lib/swap/UtxoNursery';
import { Action } from '../../../lib/swap/hooks/CreationHook';
import type TransactionHook from '../../../lib/swap/hooks/TransactionHook';
import Wallet from '../../../lib/wallet/Wallet';
import { bitcoin as bitcoinMainnet } from '../../Networks';

type Keys = {
  privateKey: Buffer;
  publicKey: Buffer;
};

const makeKeys = (): Keys => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
  };
};

const parseTx = (hex: string) =>
  Transaction.fromRaw(hexToBytes(hex), {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
    allowLegacyWitnessUtxo: true,
  });

const cloneTx = (tx: Transaction) =>
  Transaction.fromRaw(tx.toBytes(true, true), {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
    allowLegacyWitnessUtxo: true,
  });

type blockCallback = (block: {
  symbol: string;
  height: number;
  hash: Buffer;
}) => Promise<void>;

let emitBlock: blockCallback;

const mockOnSidecar = jest
  .fn()
  .mockImplementation((event: string, callback: any) => {
    switch (event) {
      case 'block':
        emitBlock = callback;
        break;
      case 'transaction':
        // Transaction callback not used in current tests
        break;
    }
  });
const mockCheckTransaction = jest.fn().mockResolvedValue(undefined);

const sampleRedeemScript = getHexBuffer(
  'a9146575342754627fcff96fe4d186e497d88e52ebd78763210263f5775d4e5688f51f4c2fa03f75d1eee1deff2b1bc6e266dedb16c00aba160c6703d8791cb17521033b6a33a6e88da8bb44737b844b48626e5061aff2a5573167ad841d7187aac97168ac',
);

const mockEstimateFee = jest.fn().mockImplementation(async () => {
  return 2;
});

const mockGetRawTransaction = jest
  .fn()
  .mockImplementation(async (transactionId: string) => {
    switch (transactionId) {
      case 'a21b0b3763a64ce2e5da23c52e3496c70c2b3268a37633653e21325ba64d4056':
        return '0100000000010148add838e8f7ea87f02d821640798d27a8999d890d939b21ff9b07e66c5dd53f0100000000ffffffff02a08601000000000017a914dc98e4ed71744bbaa0445f31745f7dd3481a9a8687a67c42020000000016001429294a57be065aab13c86eb6a7b29a70acdbd7ad02483045022100fb51263b29542d108f7534545b03f88d1b8a1cf0d027a5da771296d28bdfb66a022026be55aaea78818f220c1110a283365475dfc64dc7f61049dff0dc82cc52bcee01210376b43cc365901c197a74f4a803efdd4d8428ef97a1ac5a9f10016924f90bc4bf00000000';
      case '62af53c6dcda51c4ebac3309b85ce2ca043a912f127250c51e19b1de82299730':
        return '01000000000101566da34f5a70fd6021949f8517defca01d35d38f6d4a2fb3485f30c161a6102000000000232200208e073b6e2fb80797035b7fdbca584c04a1b9298855f05d1cf456ce726a85c6ea0000000001702a000000000000160014ca8f8b0a6f66940dce46eea1124648b9966bc70c0347304402205932d6acc8e3d6f691fc42739922f85ae01705528269ac7ae6273ad8aaff1d7602204f9b37e331a8bfd91f6e612210b27f5b64510e8ed6a5a3dcc1fc731fb5a0fff6010065a9149e8c2755f845cabfff9ba32c47189d9ad0dc16f48763210316252738ba05c03064f7d8ea7f9abda05f067f9a91c2b407a1711c321500b5e0670341791cb17521037ee9507deb4f9a1f637097f4fadc71efa8c79b026839b3662c2d31706c87b6c368ac41791c00';
      default:
        throw 'transaction not found';
    }
  });

const sampleTransactions = {
  claim:
    '01000000000101f491d1fcf639154425857d813bed7a8164c1db22ec9e148e1dc610ddd54cbfac010000000000000000016b2620000000000016001453914945b40ec9c4ce2701a8cf4d22d97ee12eb103483045022100a6c0c4627368feccfa147adddb6992f4d8a392345af5eaf82c8a7781a9b6eec7022079d26ee7c4570069d107c19de6e17512b4fbe77ffc8af5d5ffb909bfec3b469801200c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed6a8201208763a9147c7c86826b8b5729fb3a034eca9be10a55fccd11882102c2f4d7d446e9304926e3ee4b769fed20be7f94dcb61c635867d7f37c6e8c4f08677503abff09b1752103714b3407f4085db73462bd3a21c1e4f6516d7f32b076c96cca9275faabda719568ac00000000',
  lockup:
    '0200000000010256404da65b32213e653376a368322b0cc796342ec523dae5e24ca663370b1ba2000000001716001462c3624e54b4514081681fde1ea05b15f3d1539b0000000030972982deb1191ec55072122f913a04cae25cb80933acebc451dadcc653af6200000000000000000001768701000000000017a914f57496106375de4141829b3925918d2295d080508702483045022100dbf4a4711d716b164f378aeff95b9a498cf00eac708f33a510fb84b2d3e3a21102201a15a031c44e8d67d52de9591a8f908e9e9c0ed80d999be45e9f60f528c31658012103b15acf8264f9d9df2d611c5661aff897755e4a71d868c363396f5096b565ae98024730440220343467e26a848696c42c346bf5b398ba488638a77806000852a8114146cd7c880220222a4cf261f535b5f03bdf06e2dca9a46336f5710fdfe4e5090dc697c12f9bf0012103a0fd09bab21602e66f0795e55c51236d624af1cc1f34383e157773c1ca592743b0791c00',

  rbf: '010000000001010b33cdbf485ed1516cff15b0bbe2670fa3d88b8020b65b09ee4086352803c47000000000000000000002c00e16020000000017a9142879c913239d33e0849eada775980c9e2931aee987cc35e40000000000160014f151250d70250e8b8d13410b7dd9b2863672bb7f024830450221009c4d24fcd65aae8d075b6382e39b7a259eec9c0860affe0ecb9272099c4d6f9d022000e3f68fdcaed74d196172dfda82cd7b05af991eeba7b4f882734980f61bf13801210258b05b768da0e42e01b47a7c23000682d68832e138418b92d5dca145c83ca2b400000000',
  nonRbf:
    '02000000014aa073a7737e155b9500c17c2a56a0668171fec2bda2bc75b0a41b2f36549706190000006a47304402204f7a81a09a872b498a5d4f06830aee4573834ba5f272536c22de05b3fb824f8802203842aabd9e98c5f354630342e72794347f28048f9938c7c0d58abe0bfaac22fd012103ca4a5dc16b459848c97032aa38a4331ed6b964e765eb69c9b5b75dfd83849071feffffff01b8f1090000000000160014d212c6da022ed8877f5c1be3b6307c3569e5148d38fc0900',
};

let mockGetRawTransactionVerboseResult: any = () => {
  return undefined;
};
const mockGetRawTransactionVerbose = jest
  .fn()
  .mockImplementation(async (transactionId: string) => {
    return mockGetRawTransactionVerboseResult(transactionId);
  });

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation((symbol) => ({
    symbol,
    currencyType: CurrencyType.BitcoinLike,
    estimateFee: mockEstimateFee,
    getRawTransaction: mockGetRawTransaction,
    getRawTransactionVerbose: mockGetRawTransactionVerbose,
    on: jest.fn(),
  }));
});

const MockedChainClient = <jest.Mock<ChainClient>>(<any>ChainClient);

const decodeAddress = (toDecode: string) =>
  outputScriptFromAddress(CurrencyType.BitcoinLike, toDecode, bitcoinMainnet);
const mockDecodeAddress = jest.fn().mockImplementation((toDecode: string) => {
  return decodeAddress(toDecode);
});

const encodeAddress = (script: Buffer) =>
  addressFromOutputScript(CurrencyType.BitcoinLike, script, bitcoinMainnet);
const mockEncodeAddress = jest
  .fn()
  .mockImplementation((script: Buffer) => encodeAddress(script));

let mockGetKeysByIndexResult: Keys | undefined = undefined;
const mockGetKeysByIndex = jest
  .fn()
  .mockImplementation(() => mockGetKeysByIndexResult);

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation((symbol?: string) => ({
    symbol: symbol || 'BTC',
    type: CurrencyType.BitcoinLike,
    decodeAddress: mockDecodeAddress,
    encodeAddress: mockEncodeAddress,
    getKeysByIndex: mockGetKeysByIndex,
  }));
});

const MockedWallet = <jest.Mock<Wallet>>(<any>Wallet);

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
  .mockImplementation(async (arg) => arg);

let mockGetReverseSwapResult: any = null;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

let mockGetReverseSwapsExpirableResult: any[] = [];
const mockGetReverseSwapsExpirable = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsExpirableResult;
});

const mockSetStatus = jest.fn().mockImplementation(async (arg) => arg);

jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

describe('UtxoNursery', () => {
  const btcWallet = new MockedWallet('BTC');
  const btcChainClient = new MockedChainClient('BTC');

  const transactionHook = {
    hook: jest.fn().mockReturnValue(true),
  } as unknown as TransactionHook;
  const lockupTracker = {
    zeroConfAccepted: jest.fn().mockReturnValue(true),
    isAcceptable: jest.fn().mockResolvedValue(true),
  } as unknown as LockupTransactionTracker;

  const mockSidecar = {
    on: mockOnSidecar,
    checkTransaction: mockCheckTransaction,
  } as any;

  const nursery = new UtxoNursery(
    Logger.disabledLogger,
    mockSidecar,
    {
      wallets: new Map<string, any>([['BTC', btcWallet]]),
    } as any,
    lockupTracker,
    transactionHook,
    new OverpaymentProtector(Logger.disabledLogger),
  );

  beforeAll(async () => {
    await setup();
  });

  beforeEach(() => {
    mockGetReverseSwapsResult = [];

    jest.useRealTimers();
    jest.clearAllMocks();

    SwapRepository.getSwap = mockGetSwap;
    SwapRepository.getSwapsExpirable = mockGetSwapsExpirable;
    SwapRepository.setLockupTransaction = mockSetLockupTransaction;
    PayjoinReceiverRepository.isPayjoinConsolidationLockup = jest
      .fn()
      .mockResolvedValue(PayjoinLockupMatch.NoSession);

    ReverseSwapRepository.getReverseSwap = mockGetReverseSwap;
    ReverseSwapRepository.getReverseSwaps = mockGetReverseSwaps;
    ReverseSwapRepository.getReverseSwapsExpirable =
      mockGetReverseSwapsExpirable;

    ChainSwapRepository.getChainSwapByData = jest.fn().mockResolvedValue(null);
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue([]);
    ChainSwapRepository.getChainSwapsExpirable = jest
      .fn()
      .mockResolvedValue([]);

    ClaimTransactionRepository.addTransaction = jest.fn().mockResolvedValue({});

    WrappedSwapRepository.setStatus = mockSetStatus;

    nursery.removeAllListeners();
  });

  test('should init', () => {
    nursery.bindCurrency([
      {
        symbol: 'BTC',
        chainClient: btcChainClient,
      } as any,
    ]);

    expect(mockOnSidecar).toHaveBeenCalledTimes(2);
    expect(mockOnSidecar).toHaveBeenCalledWith('block', expect.anything());
    expect(mockOnSidecar).toHaveBeenCalledWith(
      'transaction',
      expect.anything(),
    );
  });

  test('should handle confirmed Swap outputs via transaction events', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const transaction = parseTx(sampleTransactions.lockup);

    let eventEmitted = false;

    mockGetSwapResult = {
      id: 'id',
      expectedAmount: 100214,
      redeemScript: sampleRedeemScript,
      lockupAddress: encodeAddress(
        Buffer.from(transaction.getOutput(0).script!),
      ),
    };

    nursery.once('swap.lockup', (args) => {
      expect(args.swap).toEqual(mockGetSwapResult);
      expect(args.transaction).toEqual(transaction);
      expect(args.confirmed).toEqual(true);

      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      lockupAddress: encodeAddress(
        Buffer.from(transaction.getOutput(0).script!),
      ),
      status: {
        [Op.or]: [
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionZeroConfRejected,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
    });

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(
      Buffer.from(transaction.getOutput(0).script!),
    );

    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(
      mockGetSwapResult,
      transaction.id,
      Number(transaction.getOutput(0).amount),
      true,
      0,
    );

    jest.clearAllMocks();

    // Should handle transactions that lockup less coins than expected
    eventEmitted = false;

    mockGetSwapResult.expectedAmount += 1;

    nursery.once('swap.lockup.failed', ({ swap, reason }) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(reason).toEqual(
        Errors.INSUFFICIENT_AMOUNT(
          Number(transaction.getOutput(0).amount),
          mockGetSwapResult.expectedAmount,
        ).message,
      );

      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Should ignore transactions that are not lockups of Swaps
    mockGetSwapResult = null;

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).not.toHaveBeenCalled();
  });

  test('should check both swap types with correct status filters', async () => {
    const transaction = parseTx(sampleTransactions.lockup);
    const address = encodeAddress(
      Buffer.from(transaction.getOutput(0).script!),
    );
    const checkOutputs = nursery['checkOutputs'];
    await checkOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      lockupAddress: address,
      status: {
        [Op.or]: [
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionZeroConfRejected,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
    });

    expect(ChainSwapRepository.getChainSwapByData).toHaveBeenCalledTimes(1);
    expect(ChainSwapRepository.getChainSwapByData).toHaveBeenCalledWith(
      { lockupAddress: address },
      {
        status: {
          [Op.in]: ChainSwapRepository.getUserLockupTransactionStatuses(),
        },
      },
    );
  });

  test.each([
    SwapUpdateEvent.InvoicePaid,
    SwapUpdateEvent.TransactionClaimPending,
    SwapUpdateEvent.TransactionClaimed,
  ])(
    'should not emit swap.lockup when lockup update returns %s',
    async (status) => {
      const checkSwapOutputs = nursery['checkOutputs'];
      const transaction = parseTx(sampleTransactions.lockup);

      mockGetSwapResult = {
        id: 'final-status',
        type: SwapType.Submarine,
        redeemScript: sampleRedeemScript,
        expectedAmount: Number(transaction.getOutput(0).amount),
        lockupAddress: encodeAddress(
          Buffer.from(transaction.getOutput(0).script!),
        ),
      };
      mockSetLockupTransaction.mockResolvedValueOnce({
        ...mockGetSwapResult,
        status,
      });

      const lockupListener = jest.fn();
      nursery.on('swap.lockup', lockupListener);

      await checkSwapOutputs(
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.Confirmed,
      );

      expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
      expect(lockupListener).not.toHaveBeenCalled();
    },
  );

  test('should handle unconfirmed Swap outputs', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const transaction = parseTx(sampleTransactions.lockup);
    transaction.updateInput(0, { sequence: 0xffffffff }, true);
    transaction.updateInput(1, { sequence: 0xffffffff }, true);

    let eventEmitted = false;

    mockGetSwapResult = {
      id: '0conf',
      acceptZeroConf: true,
      redeemScript: sampleRedeemScript,
      type: SwapType.Submarine,
      lockupAddress: encodeAddress(
        Buffer.from(transaction.getOutput(0).script!),
      ),
    };

    mockGetRawTransactionVerboseResult = () => ({
      confirmations: 1,
    });

    nursery.once('swap.lockup', () => {
      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.ZeroConfSafe,
    );

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(lockupTracker.zeroConfAccepted).toHaveBeenCalledTimes(1);
    expect(lockupTracker.zeroConfAccepted).toHaveBeenCalledWith('BTC');
    expect(lockupTracker.isAcceptable).toHaveBeenCalledTimes(1);
    expect(lockupTracker.isAcceptable).toHaveBeenCalledWith(
      mockGetSwapResult,
      transaction.hex,
    );

    expect(eventEmitted).toEqual(true);

    jest.clearAllMocks();

    // Should reject 0-conf when the risk is not acceptable
    eventEmitted = false;

    lockupTracker.isAcceptable = jest.fn().mockResolvedValue(false);

    nursery.once('swap.lockup.zeroconf.rejected', (args) => {
      expect(args.swap).toEqual(mockGetSwapResult);
      expect(args.transaction).toEqual(transaction);
      expect(args.reason).toEqual(
        Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
      );

      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.ZeroConfSafe,
    );

    expect(eventEmitted).toEqual(true);

    lockupTracker.isAcceptable = jest.fn().mockResolvedValue(true);

    jest.clearAllMocks();

    // Should reject 0-conf for Swaps that don't allow it
    eventEmitted = false;

    mockGetSwapResult.acceptZeroConf = null;

    nursery.once('swap.lockup.zeroconf.rejected', (args) => {
      expect(args.swap).toEqual(mockGetSwapResult);
      expect(args.transaction).toEqual(transaction);
      expect(args.reason).toEqual(
        Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
      );

      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.ZeroConfSafe,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Should reject 0-conf for RBF lockup transactions
    eventEmitted = false;

    mockGetSwapResult.acceptZeroConf = true;

    const rbfTransaction = cloneTx(transaction);
    // Since the backend code doesn't verify signatures, we can modify the transaction object as we please
    rbfTransaction.updateInput(0, { sequence: 0xffffffff - 2 }, true);

    nursery.once('swap.lockup.zeroconf.rejected', (args) => {
      expect(args.swap).toEqual(mockGetSwapResult);
      expect(args.transaction).toEqual(rbfTransaction);
      expect(args.reason).toEqual(
        Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message,
      );

      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      rbfTransaction,
      TransactionStatus.ZeroConfSafe,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
  });

  test('should reject 0-conf transactions when the lockup transaction tracker does not allow for 0-conf', async () => {
    const transaction = parseTx(sampleTransactions.lockup);
    transaction.updateInput(0, { sequence: 0xffffffff }, true);
    transaction.updateInput(1, { sequence: 0xffffffff }, true);

    mockGetSwapResult = {
      id: '0conf',
      acceptZeroConf: true,
      redeemScript: sampleRedeemScript,
      type: SwapType.Submarine,
      lockupAddress: encodeAddress(
        Buffer.from(transaction.getOutput(0).script!),
      ),
    };

    expect.assertions(3);

    nursery.once('swap.lockup.zeroconf.rejected', (args) => {
      expect(args.transaction).toEqual(transaction);
      expect(args.swap.id).toEqual(mockGetSwapResult.id);
      expect(args.reason).toEqual(
        Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
      );
    });

    lockupTracker.zeroConfAccepted = jest.fn().mockReturnValue(false);

    await nursery['checkOutputs'](
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.ZeroConfSafe,
    );
  });

  test('should bind a legacy lockup to its advertised output wrapper', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const expectedAmount = 100_214;
    const triggerAmount = 1_000;
    const wrongWrapper = Buffer.from(Scripts.p2shOutput(sampleRedeemScript));
    const advertisedWrapper = Buffer.from(
      Scripts.p2shP2wshOutput(sampleRedeemScript),
    );

    const transaction = new Transaction();
    transaction.addOutput({
      script: wrongWrapper,
      amount: BigInt(expectedAmount),
    });
    transaction.addOutput({
      script: advertisedWrapper,
      amount: BigInt(triggerAmount),
    });

    const detected = detectSwap(sampleRedeemScript, transaction)!;
    expect(detected.type).toEqual(OutputType.Legacy);
    expect(detected.vout).toEqual(0);

    mockGetSwapResult = {
      id: 'cross-wrapper',
      expectedAmount,
      version: SwapVersion.Legacy,
      redeemScript: sampleRedeemScript,
      lockupAddress: encodeAddress(advertisedWrapper),
    };
    mockGetSwap
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockGetSwapResult);

    let eventEmitted = false;
    nursery.once('swap.lockup', () => {
      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockGetSwap).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        lockupAddress: mockGetSwapResult.lockupAddress,
      }),
    );
    expect(eventEmitted).toEqual(false);
    expect(mockSetLockupTransaction).not.toHaveBeenCalled();
  });

  test('should detect Taproot Swap outputs', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const ourKeys = makeKeys();
    const theirPublicKey = Buffer.from(makeKeys().publicKey);

    const tree = swapTree(
      false,
      randomBytes(32),
      Buffer.from(ourKeys.publicKey),
      theirPublicKey,
      210,
    );
    const musig = createMusig(ourKeys, theirPublicKey);
    const tweakedKey = Buffer.from(
      tweakMusig(CurrencyType.BitcoinLike, musig, tree).aggPubkey,
    );

    const transaction = new Transaction();
    transaction.addOutput({
      script: Buffer.from(Scripts.p2trOutput(tweakedKey)),
      amount: BigInt(123),
    });

    mockGetKeysByIndexResult = ourKeys;
    mockGetSwapResult = {
      id: 'taproot',
      keyIndex: 123,
      version: SwapVersion.Taproot,
      refundPublicKey: theirPublicKey,
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
      lockupAddress: encodeAddress(Buffer.from(Scripts.p2trOutput(tweakedKey))),
    };

    let eventEmitted = false;
    nursery.once('swap.lockup', () => {
      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(
      expect.anything(),
      transaction.id,
      Number(transaction.getOutput(0).amount),
      true,
      0,
    );
    expect(mockGetKeysByIndex).toHaveBeenCalledTimes(1);
    expect(mockGetKeysByIndex).toHaveBeenCalledWith(mockGetSwapResult.keyIndex);
  });

  test('should bind a Taproot Swap lockup to its advertised output wrapper', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const ourKeys = makeKeys();
    const theirPublicKey = Buffer.from(makeKeys().publicKey);

    const tree = swapTree(
      false,
      randomBytes(32),
      Buffer.from(ourKeys.publicKey),
      theirPublicKey,
      210,
    );
    const musig = createMusig(ourKeys, theirPublicKey);
    const tweakedKey = Buffer.from(
      tweakMusig(CurrencyType.BitcoinLike, musig, tree).aggPubkey,
    );

    const expectedAmount = 100_214;
    const wrongWrapper = Buffer.from(Scripts.p2wshOutput(tweakedKey));
    const advertisedWrapper = Buffer.from(Scripts.p2trOutput(tweakedKey));

    const transaction = new Transaction();
    transaction.addOutput({
      script: wrongWrapper,
      amount: BigInt(expectedAmount),
    });
    transaction.addOutput({
      script: advertisedWrapper,
      amount: 1_000n,
    });

    const detected = detectSwap(tweakedKey, transaction)!;
    expect(detected.type).toEqual(OutputType.Bech32);
    expect(detected.vout).toEqual(0);

    mockGetKeysByIndexResult = ourKeys;
    mockGetSwapResult = {
      id: 'cross-wrapper-taproot',
      expectedAmount,
      keyIndex: 123,
      version: SwapVersion.Taproot,
      refundPublicKey: theirPublicKey,
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
      lockupAddress: encodeAddress(advertisedWrapper),
    };
    mockGetSwap
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockGetSwapResult);

    let eventEmitted = false;
    nursery.once('swap.lockup', () => {
      eventEmitted = true;
    });

    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockGetSwap).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        lockupAddress: mockGetSwapResult.lockupAddress,
      }),
    );
    expect(mockGetKeysByIndex).toHaveBeenCalledWith(mockGetSwapResult.keyIndex);
    expect(eventEmitted).toEqual(false);
    expect(mockSetLockupTransaction).not.toHaveBeenCalled();
  });

  test('should bind a chain swap lockup to its Taproot output wrapper', async () => {
    const ourKeys = makeKeys();
    const theirPublicKey = Buffer.from(makeKeys().publicKey);
    const tree = swapTree(
      false,
      randomBytes(32),
      Buffer.from(ourKeys.publicKey),
      theirPublicKey,
      210,
    );
    const tweakedKey = Buffer.from(
      tweakMusig(
        CurrencyType.BitcoinLike,
        createMusig(ourKeys, theirPublicKey),
        tree,
      ).aggPubkey,
    );

    const transaction = new Transaction();
    transaction.addOutput({
      script: Buffer.from(Scripts.p2wshOutput(tweakedKey)),
      amount: 123n,
    });
    transaction.addOutput({
      script: Buffer.from(Scripts.p2trOutput(tweakedKey)),
      amount: 1_000n,
    });

    const detected = detectSwap(tweakedKey, transaction)!;
    expect(detected.type).toEqual(OutputType.Bech32);
    expect(detected.vout).toEqual(0);

    mockGetKeysByIndexResult = ourKeys;
    const mockChainSwap = {
      id: 'cross-wrapper-chain',
      type: SwapType.Chain,
      receivingData: {
        keyIndex: 123,
        expectedAmount: 123,
        theirPublicKey: theirPublicKey.toString('hex'),
        swapTree: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
      },
    };
    ChainSwapRepository.setUserLockupTransaction = jest.fn();

    let eventEmitted = false;
    nursery.once('chainSwap.lockup', () => {
      eventEmitted = true;
    });

    await nursery.checkChainSwapTransaction(
      mockChainSwap as any,
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(eventEmitted).toEqual(false);
    expect(ChainSwapRepository.setUserLockupTransaction).not.toHaveBeenCalled();
  });

  test('should ignore transactions in which no swap output is detected', async () => {
    const ourKeys = makeKeys();
    const theirPublicKey = Buffer.from(makeKeys().publicKey);
    const tree = swapTree(
      false,
      randomBytes(32),
      Buffer.from(ourKeys.publicKey),
      theirPublicKey,
      210,
    );

    const transaction = new Transaction();
    transaction.addOutput({
      script: Buffer.from(
        Scripts.p2trOutput(Buffer.from(makeKeys().publicKey)),
      ),
      amount: 1_000n,
    });

    mockGetKeysByIndexResult = ourKeys;
    const mockChainSwap = {
      id: 'no-output',
      type: SwapType.Chain,
      receivingData: {
        keyIndex: 123,
        expectedAmount: 123,
        theirPublicKey: theirPublicKey.toString('hex'),
        swapTree: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
      },
    };
    ChainSwapRepository.setUserLockupTransaction = jest.fn();

    let eventEmitted = false;
    nursery.once('chainSwap.lockup', () => {
      eventEmitted = true;
    });

    await nursery.checkChainSwapTransaction(
      mockChainSwap as any,
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.Confirmed,
    );

    expect(eventEmitted).toEqual(false);
    expect(ChainSwapRepository.setUserLockupTransaction).not.toHaveBeenCalled();
  });

  test('should reject transactions from blocked addresses', async () => {
    const checkSwapOutputs = nursery['checkOutputs'];

    const transaction = parseTx(sampleTransactions.lockup);
    transaction.updateInput(0, { sequence: 0xffffffff }, true);
    transaction.updateInput(1, { sequence: 0xffffffff }, true);

    mockGetSwapResult = {
      id: '0conf',
      acceptZeroConf: true,
      redeemScript: sampleRedeemScript,
      type: SwapType.Submarine,
      lockupAddress: encodeAddress(
        Buffer.from(transaction.getOutput(0).script!),
      ),
    };

    mockGetRawTransactionVerboseResult = () => ({
      confirmations: 1,
    });

    const failPromise = new Promise<void>((resolve) => {
      nursery.once('swap.lockup.failed', ({ swap, reason }) => {
        expect(swap).toEqual(mockGetSwapResult);
        expect(reason).toEqual(Errors.BLOCKED_ADDRESS().message);
        resolve();
      });
    });

    transactionHook.hook = jest.fn().mockReturnValue(Action.Reject);
    await checkSwapOutputs(
      btcChainClient,
      btcWallet,
      transaction,
      TransactionStatus.ZeroConfSafe,
    );

    expect(transactionHook.hook).toHaveBeenCalledTimes(1);
    expect(transactionHook.hook).toHaveBeenCalledWith(
      mockGetSwapResult.id,
      btcWallet.symbol,
      transaction.id,
      Buffer.from(transaction.toBytes(true, true)),
      false,
      SwapType.Submarine,
      0,
    );

    transactionHook.hook = jest.fn().mockReturnValue(true);

    await failPromise;
  });

  test('should handle claimed Reverse Swaps', async () => {
    RefundTransactionRepository.getTransaction = jest
      .fn()
      .mockResolvedValue(null);

    const checkReverseSwapsClaims = nursery['checkSwapClaims'];

    const transaction = parseTx(sampleTransactions.claim);

    mockGetReverseSwapResult = {
      id: 'id',
      preimageHash: getHexString(
        sha256(
          getHexBuffer(
            '0c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed',
          ),
        ),
      ),
    };

    let eventEmitted = false;

    nursery.once('reverseSwap.claimed', ({ reverseSwap, preimage }) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      expect(preimage).toEqual(
        getHexBuffer(
          '0c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed',
        ),
      );

      eventEmitted = true;
    });

    await checkReverseSwapsClaims(btcChainClient, transaction);

    expect(eventEmitted).toEqual(true);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
          SwapUpdateEvent.TransactionRefunded,
        ],
      },
      transactionVout: transaction.getInput(0).index,
      transactionId: Buffer.from(transaction.getInput(0).txid!).toString('hex'),
    });

    expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(1);
    expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
      swapId: mockGetReverseSwapResult.id,
      symbol: btcChainClient.symbol,
      id: transaction.id,
    });

    jest.clearAllMocks();

    // Should ignore transactions that are refunds of a Reverse Swap
    RefundTransactionRepository.getTransaction = jest.fn().mockResolvedValue({
      id: 'refund',
    });

    await checkReverseSwapsClaims(btcChainClient, transaction);

    expect(mockGetReverseSwap).not.toHaveBeenCalled();

    jest.clearAllMocks();

    // Should ignore transactions that are not claims of a Reverse Swap
    mockGetReverseSwapResult = null;

    await checkReverseSwapsClaims(btcChainClient, transaction);

    expect(mockGetReverseSwap).not.toHaveBeenCalled();
  });

  test('should still emit reverseSwap.claimed when persistence fails', async () => {
    RefundTransactionRepository.getTransaction = jest
      .fn()
      .mockResolvedValue(null);

    const transaction = parseTx(sampleTransactions.claim);

    mockGetReverseSwapResult = {
      id: 'reverseClaimResilience',
      preimageHash: getHexString(
        sha256(
          getHexBuffer(
            '0c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed',
          ),
        ),
      ),
    };

    ClaimTransactionRepository.addTransaction = jest
      .fn()
      .mockRejectedValue(new Error('db down'));

    let eventEmitted = false;
    nursery.once('reverseSwap.claimed', () => {
      eventEmitted = true;
    });

    try {
      await expect(
        nursery['checkSwapClaims'](btcChainClient, transaction),
      ).resolves.toBeUndefined();

      expect(eventEmitted).toEqual(true);
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
    } finally {
      mockGetReverseSwapResult = null;
    }
  });

  test('should emit reverseSwap.claimed with the stored preimage for cooperative claims', async () => {
    RefundTransactionRepository.getTransaction = jest
      .fn()
      .mockResolvedValue(null);
    ChainSwapRepository.getChainSwapByData = jest.fn().mockResolvedValue(null);

    const preimage = Buffer.alloc(32, 21);
    mockGetReverseSwapResult = {
      id: 'reverseCoopClaim',
      preimage: getHexString(preimage),
    };

    const coopClaimTransaction = {
      getId: () => 'reverseCoopClaimTxId',
      ins: [
        {
          hash: Buffer.alloc(32, 20),
          index: 1,
          witness: [Buffer.alloc(64, 1)],
        },
      ],
    } as any;

    const claimed = jest.fn();
    nursery.once('reverseSwap.claimed', claimed);

    try {
      await nursery['checkSwapClaims'](btcChainClient, coopClaimTransaction);

      expect(claimed).toHaveBeenCalledTimes(1);
      expect(claimed).toHaveBeenCalledWith({
        reverseSwap: mockGetReverseSwapResult,
        preimage,
      });
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: 'reverseCoopClaim',
        symbol: btcChainClient.symbol,
        id: 'reverseCoopClaimTxId',
      });
    } finally {
      mockGetReverseSwapResult = null;
    }
  });

  describe('chain swap claim persistence', () => {
    const spentHash = Buffer.alloc(32, 7);
    const spentVout = 3;
    const transactionId = 'chainClaimTxId';
    const claimPreimage = Buffer.alloc(32, 1);
    const fakeTransaction = {
      getId: () => transactionId,
      ins: [
        {
          hash: spentHash,
          index: spentVout,
          witness: [
            Buffer.alloc(64, 1),
            claimPreimage,
            Buffer.alloc(35, 2),
            Buffer.alloc(33, 3),
          ],
        },
      ],
    } as any;

    const expectFilteredUserClaim = async (
      id: string,
      witness: Buffer[],
      preimageHash: string,
    ) => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id,
        preimage: null,
        preimageHash,
        chainSwap: { id },
        sendingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
        receivingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      const filteredTransaction = {
        getId: () => transactionId,
        ins: [
          {
            hash: spentHash,
            index: spentVout,
            witness,
          },
        ],
      } as any;

      const claimed = jest.fn();
      nursery.once('chainSwap.claimed', claimed);

      await nursery['checkSwapClaims'](btcChainClient, filteredTransaction);

      expect(claimed).not.toHaveBeenCalled();
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: id,
        symbol: btcChainClient.symbol,
        id: transactionId,
      });
    };

    const expectEmittedUserClaim = async (
      id: string,
      witness: Buffer[],
      preimage: Buffer,
    ) => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id,
        preimage: null,
        preimageHash: getHexString(sha256(preimage)),
        chainSwap: { id },
        sendingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
        receivingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      const claimTransaction = {
        getId: () => transactionId,
        ins: [
          {
            hash: spentHash,
            index: spentVout,
            witness,
          },
        ],
      } as any;

      const claimed = jest.fn();
      nursery.once('chainSwap.claimed', claimed);

      await nursery['checkSwapClaims'](btcChainClient, claimTransaction);

      expect(claimed).toHaveBeenCalledTimes(1);
      expect(claimed).toHaveBeenCalledWith({
        swap: mockChainSwap,
        preimage,
      });
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: id,
        symbol: btcChainClient.symbol,
        id: transactionId,
      });
    };

    test('should persist when spend matches sendingData (user claim)', async () => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id: 'chainSwapId',
        preimage: getHexString(claimPreimage),
        preimageHash: getHexString(sha256(claimPreimage)),
        chainSwap: { id: 'chainSwapId' },
        sendingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
        receivingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      let eventEmitted = false;
      nursery.once('chainSwap.claimed', ({ swap }) => {
        expect(swap).toEqual(mockChainSwap);
        eventEmitted = true;
      });

      await nursery['checkSwapClaims'](btcChainClient, fakeTransaction);

      expect(eventEmitted).toEqual(true);
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: mockChainSwap.id,
        symbol: btcChainClient.symbol,
        id: transactionId,
      });
    });

    test('should recognize a Taproot script claim with a final annex', async () => {
      const preimage = Buffer.alloc(32, 11);
      await expectEmittedUserClaim(
        'chainSwapAnnexClaim',
        [
          Buffer.alloc(64, 1),
          preimage,
          Buffer.alloc(35, 2),
          Buffer.alloc(33, 3),
          Buffer.from([0x50, 0x01]),
        ],
        preimage,
      );
    });

    test('should recognize a claim regardless of extra witness elements', async () => {
      const preimage = Buffer.alloc(32, 12);
      await expectEmittedUserClaim(
        'chainSwapExtraWitness',
        [
          Buffer.alloc(64, 1),
          preimage,
          Buffer.alloc(35, 2),
          Buffer.alloc(33, 3),
          Buffer.from([0x51, 0x01]),
        ],
        preimage,
      );
    });

    test('should recognize a covenant claim with the preimage as the first element', async () => {
      const preimage = Buffer.alloc(32, 17);
      await expectEmittedUserClaim(
        'chainSwapCovenantClaim',
        [preimage, Buffer.alloc(35, 2), Buffer.alloc(33, 3)],
        preimage,
      );
    });

    test('should filter a refund transaction', async () => {
      await expectFilteredUserClaim(
        'chainSwapRefund',
        [Buffer.alloc(64, 1), Buffer.alloc(35, 2), Buffer.alloc(33, 3)],
        getHexString(sha256(Buffer.alloc(32, 13))),
      );
    });

    test('should filter a Taproot refund with a final annex', async () => {
      await expectFilteredUserClaim(
        'chainSwapRefundAnnex',
        [
          Buffer.alloc(64, 1),
          Buffer.alloc(35, 2),
          Buffer.alloc(33, 3),
          Buffer.from([0x50, 0x01]),
        ],
        getHexString(sha256(Buffer.alloc(32, 13))),
      );
    });

    test('should filter a Taproot key-path spend with a final annex', async () => {
      await expectFilteredUserClaim(
        'chainSwapKeyPathAnnex',
        [Buffer.alloc(64, 1), Buffer.from([0x50, 0x01])],
        getHexString(sha256(Buffer.alloc(32, 14))),
      );
    });

    test('should filter a claim with a mismatched preimage', async () => {
      const preimage = Buffer.alloc(32, 15);
      await expectFilteredUserClaim(
        'chainSwapPreimageMismatch',
        [
          Buffer.alloc(64, 1),
          preimage,
          Buffer.alloc(35, 2),
          Buffer.alloc(33, 3),
        ],
        getHexString(sha256(Buffer.alloc(32, 16))),
      );
    });

    test('should not persist when spend matches receivingData (server claim)', async () => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id: 'chainSwapId',
        preimage: getHexString(claimPreimage),
        preimageHash: getHexString(sha256(claimPreimage)),
        chainSwap: { id: 'chainSwapId' },
        sendingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
        receivingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      let eventEmitted = false;
      nursery.once('chainSwap.claimed', () => {
        eventEmitted = true;
      });

      await nursery['checkSwapClaims'](btcChainClient, fakeTransaction);

      expect(eventEmitted).toEqual(true);
      expect(ClaimTransactionRepository.addTransaction).not.toHaveBeenCalled();
    });

    test('should still emit when persistence fails (sendingData)', async () => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id: 'chainSwapId',
        preimage: getHexString(claimPreimage),
        preimageHash: getHexString(sha256(claimPreimage)),
        chainSwap: { id: 'chainSwapId' },
        sendingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
        receivingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      ClaimTransactionRepository.addTransaction = jest
        .fn()
        .mockRejectedValue(new Error('db down'));

      let eventEmitted = false;
      nursery.once('chainSwap.claimed', () => {
        eventEmitted = true;
      });

      await expect(
        nursery['checkSwapClaims'](btcChainClient, fakeTransaction),
      ).resolves.toBeUndefined();

      expect(eventEmitted).toEqual(true);
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
    });

    test('should persist cooperative user claims (witness length 1)', async () => {
      RefundTransactionRepository.getTransaction = jest
        .fn()
        .mockResolvedValue(null);

      const mockChainSwap = {
        id: 'chainSwapId',
        preimage: getHexString(claimPreimage),
        preimageHash: getHexString(sha256(claimPreimage)),
        chainSwap: { id: 'chainSwapId' },
        sendingData: {
          transactionId: transactionHashToId(spentHash),
          transactionVout: spentVout,
        },
        receivingData: {
          transactionId: 'other',
          transactionVout: 0,
        },
      };
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(mockChainSwap);

      const coopTransaction = {
        getId: () => transactionId,
        ins: [
          {
            hash: spentHash,
            index: spentVout,
            // Cooperative musig aggregated signature has one witness element
            witness: [Buffer.alloc(0)],
          },
        ],
      } as any;

      let eventEmitted = false;
      nursery.once('chainSwap.claimed', () => {
        eventEmitted = true;
      });

      await nursery['checkSwapClaims'](btcChainClient, coopTransaction);

      // Cooperative claims are filtered from the emit, but still persisted
      expect(eventEmitted).toEqual(false);
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledTimes(
        1,
      );
      expect(ClaimTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: mockChainSwap.id,
        symbol: btcChainClient.symbol,
        id: transactionId,
      });
    });
  });

  test('should handle confirmed Reverse Swap lockups via block events', async () => {
    mockGetReverseSwapsResult = [
      // The transaction of this Reverse Swap is still in the mempool
      {
        id: 'mempool',
        pair: 'BTC/BTC',
        type: SwapType.ReverseSubmarine,
        lockupAddress: 'bc1ql279ggjjsy40nr2acmlmtcc95sexg8ty92pth5',
        transactionId: parseTx(sampleTransactions.rbf).id,
      },
      // This ones transaction was confirmed but the transaction event was not properly emitted for it
      {
        pair: 'BTC/BTC',
        id: 'nonMempool',
        type: SwapType.ReverseSubmarine,
        lockupAddress: '3CxjzKKkxSa1eCRegA1KNS7KjXu1Hjhoqg',
        transactionId: parseTx(sampleTransactions.nonRbf).id,
      },
    ];

    mockGetRawTransactionVerboseResult = (transactionId: string) => {
      if (transactionId === parseTx(sampleTransactions.nonRbf).id) {
        return {
          confirmations: 1,
          hex: sampleTransactions.nonRbf,
        };
      }

      return {};
    };

    let eventsEmitted = 0;

    nursery.on('server.lockup.confirmed', (args) => {
      expect(args.swap).toEqual(mockGetReverseSwapsResult[1]);
      expect(args.transaction).toEqual(parseTx(sampleTransactions.nonRbf));

      eventsEmitted += 1;
    });

    await emitBlock({ symbol: 'BTC', height: 1, hash: Buffer.alloc(32) });

    expect(eventsEmitted).toEqual(1);

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: SwapUpdateEvent.TransactionMempool,
    });

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(2);
    expect(mockGetRawTransactionVerbose).toHaveBeenNthCalledWith(
      1,
      mockGetReverseSwapsResult[0].transactionId,
    );
    expect(mockGetRawTransactionVerbose).toHaveBeenNthCalledWith(
      2,
      mockGetReverseSwapsResult[1].transactionId,
    );
  });

  test('should handle expired Swaps', async () => {
    mockGetSwapsExpirableResult = [
      // Expired Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.SELL,
        lockupAddress: '1DuELuuVMPPw5gGcS7uq9eFsPMknj9tQNc',
      },
      // Expired Swap with an onchain HTLC on the Ethereum chain that should not emit an event
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
      },
    ];

    let eventEmitted = false;

    nursery.on('swap.expired', (swap) => {
      expect(swap).toEqual(mockGetSwapsExpirableResult[0]);

      eventEmitted = true;
    });

    const emittedBlockHeight = 123321;
    await emitBlock({
      symbol: 'BTC',
      height: emittedBlockHeight,
      hash: Buffer.alloc(32),
    });

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetSwapsExpirable).toHaveBeenCalledWith(emittedBlockHeight);

    mockGetSwapsExpirableResult = [];
  });

  test('should handle expired Reverse Swaps', async () => {
    mockGetReverseSwapsExpirableResult = [
      // Expired Reverse Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
        lockupAddress: '1DuELuuVMPPw5gGcS7uq9eFsPMknj9tQNc',
      },
      // Expired Reverse Swap with a transaction id (lockup transaction)
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
        lockupAddress: '1DtQRpZCbX42rxRmkZ8pvS3rytPyV92aVQ',
        transactionId:
          'aab14a840e63b6ad3134d9b8d651eee9e95ab793fddff4bc3ab5392fcf7854e2',
      },
      // Expired Reverse Swap with an onchain HTLC on the Ethereum chain that should not emit an event
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.SELL,
      },
    ];

    let eventsEmitted = 0;

    nursery.on('reverseSwap.expired', (reverseSwap) => {
      if (eventsEmitted === 0) {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[0]);
      } else {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[1]);
      }

      eventsEmitted += 1;
    });

    const emittedBlockHeight = 123321;
    await emitBlock({
      symbol: 'BTC',
      height: emittedBlockHeight,
      hash: Buffer.alloc(32),
    });

    expect(eventsEmitted).toEqual(2);

    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledWith(
      emittedBlockHeight,
    );

    mockGetReverseSwapsExpirableResult = [];
  });

  test('should detect when transactions signal RBF explicitly', async () => {
    const transaction = parseTx(sampleTransactions.rbf);
    expect(
      await nursery['transactionSignalsRbf'](btcChainClient, transaction),
    ).toEqual(true);

    expect(mockGetRawTransactionVerbose).not.toHaveBeenCalled();
  });

  test('should detect when transactions signal RBF inherently', async () => {
    const transactionSignalsRbf = nursery['transactionSignalsRbf'];

    mockGetRawTransactionVerboseResult = () => ({
      confirmations: undefined,
      hex: sampleTransactions.rbf,
    });
    const transaction = parseTx(sampleTransactions.nonRbf);

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(
      true,
    );

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(1);

    // Should handle confirmed inputs
    mockGetRawTransactionVerboseResult = () => ({
      confirmations: 21,
      hex: sampleTransactions.rbf,
    });

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(
      false,
    );

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(2);

    // Should handle unconfirmed non RBF inputs
    let returned = false;

    mockGetRawTransactionVerboseResult = () => {
      const toReturn = {
        confirmations: returned ? 1 : undefined,
        hex: sampleTransactions.nonRbf,
      };

      returned = true;

      return toReturn;
    };

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(
      false,
    );
  });

  describe('amount error messages', () => {
    test.each([
      {
        testName: 'INCORRECT_ASSET_SENT when outputValue is 0',
        expectedAmount: 100214,
        outputValue: 0,
        expectedError: Errors.INCORRECT_ASSET_SENT(),
      },
      {
        testName: 'INSUFFICIENT_AMOUNT when outputValue is less than expected',
        expectedAmount: 100214,
        outputValue: 50000,
        expectedError: Errors.INSUFFICIENT_AMOUNT(50000, 100214),
      },
      {
        testName: 'OVERPAID_AMOUNT when outputValue is more than expected',
        expectedAmount: 100214,
        outputValue: 200000,
        expectedError: Errors.OVERPAID_AMOUNT(200000, 100214),
      },
    ])(
      'should emit swap.lockup.failed with $testName',
      async ({ expectedAmount, outputValue, expectedError }) => {
        const checkSwapOutputs = nursery['checkOutputs'];

        const transaction = parseTx(sampleTransactions.lockup);

        let eventEmitted = false;

        mockGetSwapResult = {
          id: 'testSwap',
          expectedAmount,
          redeemScript: sampleRedeemScript,
          lockupAddress: encodeAddress(
            Buffer.from(transaction.getOutput(0).script!),
          ),
        };

        mockSetLockupTransaction.mockImplementationOnce(async (swap) => ({
          ...swap,
          expectedAmount,
        }));

        const getOutputValueSpy = jest
          .spyOn(Core, 'getOutputValue')
          .mockReturnValue(outputValue);

        nursery.once('swap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(mockGetSwapResult.id);
          expect(reason).toEqual(expectedError.message);

          eventEmitted = true;
        });

        await checkSwapOutputs(
          btcChainClient,
          btcWallet,
          transaction,
          TransactionStatus.Confirmed,
        );

        expect(eventEmitted).toEqual(true);

        expect(mockGetSwap).toHaveBeenCalledTimes(1);
        expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
        expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

        getOutputValueSpy.mockRestore();
      },
    );

    test('should accept Payjoin consolidation overpayment after receiver session closed', async () => {
      const checkSwapOutputs = nursery['checkOutputs'];
      const transaction = parseTx(sampleTransactions.lockup);

      const expectedAmount = 100214;
      const outputValue = 200000;

      mockGetSwapResult = {
        id: 'payjoinSwap',
        expectedAmount,
        redeemScript: sampleRedeemScript,
        type: SwapType.Submarine,
      };

      mockSetLockupTransaction.mockImplementationOnce(async (swap) => ({
        ...swap,
        expectedAmount,
      }));
      (
        PayjoinReceiverRepository.isPayjoinConsolidationLockup as jest.Mock
      ).mockResolvedValueOnce(PayjoinLockupMatch.Success);

      const getOutputValueSpy = jest
        .spyOn(Core, 'getOutputValue')
        .mockReturnValue(outputValue);

      let lockupEmitted = false;
      let failedEmitted = false;

      nursery.once('swap.lockup', ({ swap, transaction: emitted }) => {
        expect(swap.id).toEqual(mockGetSwapResult.id);
        expect(emitted).toEqual(transaction);

        lockupEmitted = true;
      });
      nursery.once('swap.lockup.failed', () => {
        failedEmitted = true;
      });

      await checkSwapOutputs(
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.Confirmed,
      );

      expect(lockupEmitted).toEqual(true);
      expect(failedEmitted).toEqual(false);
      expect(
        PayjoinReceiverRepository.isPayjoinConsolidationLockup,
      ).toHaveBeenCalledWith(
        mockGetSwapResult.id,
        transaction.id,
        outputValue,
        expectedAmount,
      );

      getOutputValueSpy.mockRestore();
    });

    test('should defer Payjoin consolidation overpayment while receiver session is pending and schedule a retry', async () => {
      jest.useFakeTimers();
      const checkSwapTransaction = nursery['checkSwapTransaction'];
      const transaction = parseTx(sampleTransactions.lockup);

      const expectedAmount = 100214;
      const outputValue = 200000;

      const swap = {
        id: 'payjoinSwap',
        expectedAmount,
        redeemScript: sampleRedeemScript,
        type: SwapType.Submarine,
      };

      mockSetLockupTransaction.mockImplementationOnce(async (swap) => ({
        ...swap,
        expectedAmount,
      }));
      (
        PayjoinReceiverRepository.isPayjoinConsolidationLockup as jest.Mock
      ).mockResolvedValueOnce(PayjoinLockupMatch.Pending);

      const getOutputValueSpy = jest
        .spyOn(Core, 'getOutputValue')
        .mockReturnValue(outputValue);

      let lockupEmitted = false;
      let failedEmitted = false;

      nursery.once('swap.lockup', () => {
        lockupEmitted = true;
      });
      nursery.once('swap.lockup.failed', () => {
        failedEmitted = true;
      });

      await checkSwapTransaction(
        swap as any,
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.ZeroConfSafe,
      );

      expect(lockupEmitted).toEqual(false);
      expect(failedEmitted).toEqual(false);
      expect(mockCheckTransaction).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(2_000);

      expect(mockCheckTransaction).toHaveBeenCalledTimes(1);
      expect(mockCheckTransaction).toHaveBeenCalledWith(
        btcWallet.symbol,
        transaction.id,
      );

      getOutputValueSpy.mockRestore();
    });

    test('should accept unconfirmed Payjoin consolidation overpayment after receiver session closes', async () => {
      jest.useFakeTimers();
      const checkSwapTransaction = nursery['checkSwapTransaction'];
      const transaction = parseTx(sampleTransactions.lockup);

      const expectedAmount = 100214;
      const outputValue = 200000;

      const swap = {
        id: 'payjoinSwap',
        expectedAmount,
        redeemScript: sampleRedeemScript,
        type: SwapType.Submarine,
        acceptZeroConf: true,
      };

      mockSetLockupTransaction.mockImplementation(async (swap) => ({
        ...swap,
        expectedAmount,
      }));
      (PayjoinReceiverRepository.isPayjoinConsolidationLockup as jest.Mock)
        .mockResolvedValueOnce(PayjoinLockupMatch.Pending)
        .mockResolvedValueOnce(PayjoinLockupMatch.Success);

      const getOutputValueSpy = jest
        .spyOn(Core, 'getOutputValue')
        .mockReturnValue(outputValue);
      const acceptsZeroConfSpy = jest
        .spyOn(nursery as any, 'acceptsZeroConf')
        .mockResolvedValue(undefined);

      let lockupEmitted = false;
      let failedEmitted = false;

      nursery.once('swap.lockup', ({ swap, transaction: emitted }) => {
        expect(swap.id).toEqual('payjoinSwap');
        expect(emitted).toEqual(transaction);

        lockupEmitted = true;
      });
      nursery.once('swap.lockup.failed', () => {
        failedEmitted = true;
      });

      await checkSwapTransaction(
        swap as any,
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.ZeroConfSafe,
      );

      expect(lockupEmitted).toEqual(false);
      expect(failedEmitted).toEqual(false);

      await jest.advanceTimersByTimeAsync(2_000);

      expect(mockCheckTransaction).toHaveBeenCalledWith(
        btcWallet.symbol,
        transaction.id,
      );

      await checkSwapTransaction(
        swap as any,
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.ZeroConfSafe,
      );

      expect(lockupEmitted).toEqual(true);
      expect(failedEmitted).toEqual(false);

      getOutputValueSpy.mockRestore();
      acceptsZeroConfSpy.mockRestore();
    });

    test('should reject Payjoin-linked overpayment when transaction does not match session', async () => {
      const checkSwapOutputs = nursery['checkOutputs'];
      const transaction = parseTx(sampleTransactions.lockup);

      const expectedAmount = 100214;
      const outputValue = 200000;

      mockGetSwapResult = {
        id: 'payjoinSwap',
        expectedAmount,
        redeemScript: sampleRedeemScript,
        type: SwapType.Submarine,
      };

      mockSetLockupTransaction.mockImplementationOnce(async (swap) => ({
        ...swap,
        expectedAmount,
      }));
      (
        PayjoinReceiverRepository.isPayjoinConsolidationLockup as jest.Mock
      ).mockResolvedValueOnce(PayjoinLockupMatch.TxMismatch);

      const getOutputValueSpy = jest
        .spyOn(Core, 'getOutputValue')
        .mockReturnValue(outputValue);

      let eventEmitted = false;

      nursery.once('swap.lockup.failed', ({ swap, reason }) => {
        expect(swap.id).toEqual(mockGetSwapResult.id);
        expect(reason).toEqual(
          Errors.OVERPAID_AMOUNT(outputValue, expectedAmount).message,
        );

        eventEmitted = true;
      });

      await checkSwapOutputs(
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.Confirmed,
      );

      expect(eventEmitted).toEqual(true);

      getOutputValueSpy.mockRestore();
    });

    test.each([
      {
        testName: 'INCORRECT_ASSET_SENT when outputValue is 0',
        expectedAmount: 123,
        outputValue: 0,
        expectedError: Errors.INCORRECT_ASSET_SENT(),
      },
      {
        testName: 'INCORRECT_ASSET_SENT when outputValue is 0',
        expectedAmount: 0,
        outputValue: 0,
        expectedError: Errors.INCORRECT_ASSET_SENT(),
      },
      {
        testName: 'INSUFFICIENT_AMOUNT when outputValue is less than expected',
        expectedAmount: 123,
        outputValue: 50,
        expectedError: Errors.INSUFFICIENT_AMOUNT(50, 123),
      },
      {
        testName: 'OVERPAID_AMOUNT when outputValue is more than expected',
        expectedAmount: 123,
        outputValue: 500,
        expectedError: Errors.OVERPAID_AMOUNT(500, 123),
      },
    ])(
      'should emit chainSwap.lockup.failed with $testName',
      async ({ expectedAmount, outputValue, expectedError }) => {
        const checkChainSwapTransaction = nursery['checkChainSwapTransaction'];

        const ourKeys = makeKeys();
        const theirPublicKey = Buffer.from(makeKeys().publicKey);

        const tree = swapTree(
          false,
          randomBytes(32),
          Buffer.from(ourKeys.publicKey),
          theirPublicKey,
          210,
        );

        const transaction = new Transaction();
        transaction.addOutput({
          script: Buffer.from(
            Scripts.p2trOutput(
              Buffer.from(
                tweakMusig(
                  CurrencyType.BitcoinLike,
                  createMusig(ourKeys, theirPublicKey),
                  tree,
                ).aggPubkey,
              ),
            ),
          ),
          amount: BigInt(123),
        });

        mockGetKeysByIndexResult = ourKeys;

        const mockChainSwap = {
          id: 'testChainSwap',
          type: SwapType.Chain,
          receivingData: {
            keyIndex: 123,
            expectedAmount,
            theirPublicKey: theirPublicKey.toString('hex'),
            swapTree: JSON.stringify(
              SwapTreeSerializer.serializeSwapTree(tree),
            ),
          },
        };

        ChainSwapRepository.setUserLockupTransaction = jest
          .fn()
          .mockResolvedValue(mockChainSwap);

        const getOutputValueSpy = jest
          .spyOn(Core, 'getOutputValue')
          .mockReturnValue(outputValue);

        let eventEmitted = false;

        nursery.once('chainSwap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(mockChainSwap.id);
          expect(reason).toEqual(expectedError.message);

          eventEmitted = true;
        });

        await checkChainSwapTransaction(
          mockChainSwap as any,
          btcChainClient,
          btcWallet,
          transaction,
          TransactionStatus.Confirmed,
        );

        expect(eventEmitted).toEqual(true);

        expect(
          ChainSwapRepository.setUserLockupTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          ChainSwapRepository.setUserLockupTransaction,
        ).toHaveBeenCalledWith(
          mockChainSwap,
          transaction.id,
          outputValue,
          true,
          0,
          undefined,
        );

        getOutputValueSpy.mockRestore();
      },
    );

    test('should ignore duplicate lockup checks after chain swap lockup failed', async () => {
      const checkChainSwapTransaction = nursery['checkChainSwapTransaction'];

      const ourKeys = makeKeys();
      const theirPublicKey = Buffer.from(makeKeys().publicKey);

      const tree = swapTree(
        false,
        randomBytes(32),
        Buffer.from(ourKeys.publicKey),
        theirPublicKey,
        210,
      );

      const transaction = new Transaction();
      transaction.addOutput({
        script: Buffer.from(
          Scripts.p2trOutput(
            Buffer.from(
              tweakMusig(
                CurrencyType.BitcoinLike,
                createMusig(ourKeys, theirPublicKey),
                tree,
              ).aggPubkey,
            ),
          ),
        ),
        amount: BigInt(123),
      });

      mockGetKeysByIndexResult = ourKeys;

      const mockChainSwap = {
        id: 'testChainSwap',
        type: SwapType.Chain,
        receivingData: {
          keyIndex: 123,
          expectedAmount: 100,
          theirPublicKey: theirPublicKey.toString('hex'),
          swapTree: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
        },
      };

      ChainSwapRepository.setUserLockupTransaction = jest
        .fn()
        .mockResolvedValue({
          ...mockChainSwap,
          status: SwapUpdateEvent.TransactionLockupFailed,
        });

      const getOutputValueSpy = jest
        .spyOn(Core, 'getOutputValue')
        .mockReturnValue(500);

      const emitSpy = jest.spyOn(nursery, 'emit');

      await checkChainSwapTransaction(
        mockChainSwap as any,
        btcChainClient,
        btcWallet,
        transaction,
        TransactionStatus.Confirmed,
      );

      expect(ChainSwapRepository.setUserLockupTransaction).toHaveBeenCalledWith(
        mockChainSwap,
        transaction.id,
        500,
        true,
        0,
        undefined,
      );
      expect(emitSpy).not.toHaveBeenCalledWith(
        'chainSwap.lockup.failed',
        expect.anything(),
      );
      expect(emitSpy).not.toHaveBeenCalledWith(
        'chainSwap.lockup',
        expect.anything(),
      );

      emitSpy.mockRestore();
      getOutputValueSpy.mockRestore();
    });
  });
});
