import { BIP32Factory } from 'bip32';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Transaction, crypto } from 'bitcoinjs-lib';
import {
  Networks,
  OutputType,
  SwapTreeSerializer,
  detectSwap,
  swapTree,
} from 'boltz-core';
import { p2trOutput } from 'boltz-core/dist/lib/swap/Scripts';
import { randomBytes } from 'crypto';
import * as ecc from 'tiny-secp256k1';
import { createMusig, setup, tweakMusig } from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import Logger from '../../../../lib/Logger';
import {
  generateSwapId,
  getHexBuffer,
  getHexString,
} from '../../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Swap from '../../../../lib/db/models/Swap';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import DeferredClaimer from '../../../../lib/service/cooperative/DeferredClaimer';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletManager, { Currency } from '../../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  clnClient,
} from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChannelCreationRepository');
jest.mock('../../../../lib/db/repositories/ChainTipRepository');
jest.mock('../../../../lib/db/repositories/KeyRepository', () => ({
  setHighestUsedIndex: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwapsClaimable: jest.fn().mockResolvedValue([]),
  setMinerFee: jest.fn().mockImplementation(async (swap, fee) => ({
    ...swap,
    minerFee: fee,
  })),
  setSwapStatus: jest
    .fn()
    .mockImplementation(async (swap: Swap, status: string) => ({
      ...swap,
      status,
    })),
}));

describe('DeferredClaimer', () => {
  const bip32 = BIP32Factory(ecc);

  const btcCurrency = {
    clnClient,
    symbol: 'BTC',
    chainClient: bitcoinClient,
    lndClient: bitcoinLndClient,
    type: CurrencyType.BitcoinLike,
  } as Currency;

  const btcWallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
  );
  const walletManager = {
    wallets: new Map<string, Wallet>([['BTC', btcWallet]]),
  } as WalletManager;

  const claimer = new DeferredClaimer(
    Logger.disabledLogger,
    new Map<string, Currency>([['BTC', btcCurrency]]),
    walletManager,
    new SwapOutputType(OutputType.Bech32),
    {
      deferredClaimSymbols: ['BTC', 'DOGE'],
      expiryTolerance: 10,
      batchClaimInterval: '*/15 * * * *',
    },
  );

  const createClaimableOutput = async (
    timeoutBlockHeight?: number,
    preimage?: Buffer,
    pair?: string,
    invoice?: string,
  ) => {
    const swap = {
      invoice,
      pair: pair || 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      id: generateSwapId(SwapVersion.Taproot),
      refundPublicKey: getHexString(ECPair.makeRandom().publicKey),
      timeoutBlockHeight:
        timeoutBlockHeight ||
        (await bitcoinClient.getBlockchainInfo()).blocks + 100,
    } as Partial<Swap> as Swap;

    preimage = preimage || randomBytes(32);
    swap.preimageHash = getHexString(crypto.sha256(preimage));
    const claimKeys = btcWallet.getNewKeys();
    swap.keyIndex = claimKeys.index;

    const musig = createMusig(
      claimKeys.keys,
      getHexBuffer(swap.refundPublicKey!),
    );
    const tree = swapTree(
      false,
      crypto.sha256(preimage),
      claimKeys.keys.publicKey,
      getHexBuffer(swap.refundPublicKey!),
      1,
    );
    swap.redeemScript = JSON.stringify(
      SwapTreeSerializer.serializeSwapTree(tree),
    );

    const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);
    const tx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          btcWallet.encodeAddress(p2trOutput(tweakedKey)),
          100_000,
        ),
      ),
    );
    swap.lockupTransactionId = tx.getId();
    swap.lockupTransactionVout = detectSwap(tweakedKey, tx)!.vout;

    return { swap, preimage };
  };

  beforeAll(async () => {
    btcWallet.initKeyProvider(
      Networks.bitcoinRegtest,
      'm/0/0',
      0,
      bip32.fromSeed(mnemonicToSeedSync(generateMnemonic())),
    );

    await Promise.all([
      setup(),
      bitcoinClient.connect(),
      clnClient.connect(true),
      bitcoinLndClient.connect(false),
      bitcoinLndClient2.connect(false),
    ]);

    await bitcoinClient.generate(1);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    claimer['swapsToClaim'].get('BTC')?.clear();
  });

  afterAll(() => {
    claimer.close();

    bitcoinClient.disconnect();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
  });

  test('should init', async () => {
    await claimer.init();

    expect(SwapRepository.getSwapsClaimable).toHaveBeenCalledTimes(1);
    expect(claimer['batchClaimSchedule']).not.toBeUndefined();
  });

  test('should close', () => {
    expect(claimer['batchClaimSchedule']).not.toBeUndefined();
    claimer.close();
    expect(claimer['batchClaimSchedule']).toBeUndefined();
  });

  test('should defer claim transactions', async () => {
    const swap = {
      id: 'swapId',
      pair: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
    } as Partial<Swap> as Swap;
    const preimage = randomBytes(32);

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

    expect(SwapRepository.setSwapStatus).toHaveBeenCalledTimes(1);
    expect(SwapRepository.setSwapStatus).toHaveBeenCalledWith(
      swap,
      SwapUpdateEvent.TransactionClaimPending,
    );

    expect(claimer['swapsToClaim'].get('BTC')!.size).toEqual(1);
    expect(claimer['swapsToClaim'].get('BTC')!.get(swap.id)).toEqual({
      preimage,
      swap: {
        ...swap,
        status: SwapUpdateEvent.TransactionClaimPending,
      },
    });
  });

  test('should trigger sweep when deferring claim transaction with close expiry', async () => {
    const { swap, preimage } = await createClaimableOutput(
      (await bitcoinClient.getBlockchainInfo()).blocks,
    );

    const emitPromise = new Promise<void>((resolve) => {
      claimer.once('claim', (emittedSwap, channelCreation) => {
        expect(emittedSwap).toEqual({
          ...swap,
          status: SwapUpdateEvent.TransactionClaimPending,
          minerFee: expect.anything(),
        });
        expect(channelCreation).toBeUndefined();
        resolve();
      });
    });

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
    await emitPromise;

    expect(claimer.pendingSweeps().get('BTC')!.length).toEqual(0);
  });

  test('should not defer claim transactions on chains that were not configured', async () => {
    const swap = {
      pair: 'L-BTC/BTC',
      orderSide: OrderSide.SELL,
    } as Partial<Swap> as Swap;
    const preimage = randomBytes(32);

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(false);
  });

  test('should not defer claim transactions of legacy swaps', async () => {
    const swap = {
      pair: 'BTC/BTC',
      orderSide: OrderSide.SELL,
      version: SwapVersion.Legacy,
    } as Partial<Swap> as Swap;
    const preimage = randomBytes(32);

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(false);
  });

  test('should get ids of pending sweeps', async () => {
    const swap = {
      id: 'swapId',
      pair: 'L-BTC/BTC',
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
    } as Partial<Swap> as Swap;
    const preimage = randomBytes(32);

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

    expect(claimer.pendingSweeps()).toEqual(
      new Map<string, string[]>([
        ['DOGE', []],
        ['BTC', [swap.id]],
      ]),
    );
  });

  test('should sweep all configured currencies', async () => {
    const spy = jest.spyOn(claimer, 'sweepSymbol');
    await expect(claimer.sweep()).resolves.toEqual(new Map());

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('BTC');
    expect(spy).toHaveBeenCalledWith('DOGE');
  });

  test('should sweep multiple swaps of a currency currency', async () => {
    await bitcoinClient.generate(1);
    const swaps = await Promise.all([
      createClaimableOutput(),
      createClaimableOutput(),
    ]);

    for (const { swap, preimage } of swaps) {
      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
    }

    await claimer.sweepSymbol('BTC');

    const lockupTxs = swaps.map(({ swap }) => swap.lockupTransactionId!);
    const claimTx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        (await bitcoinClient.getRawMempool()).find(
          (txId) => !lockupTxs.includes(txId),
        )!,
      ),
    );

    expect(claimTx.ins.length).toEqual(swaps.length);
  });

  test('should sweep currency with no pending swaps', async () => {
    await expect(claimer.sweepSymbol('BTC')).resolves.toEqual([]);
  });

  test('should sweep currency that is not configured', async () => {
    await expect(claimer.sweepSymbol('notConfigured')).resolves.toEqual([]);
  });

  test('should claim leftovers on startup', async () => {
    await bitcoinClient.generate(1);

    // Wait for CLN to catch up with the chain
    await new Promise<void>((resolve) => {
      const timeout = setInterval(async () => {
        if (
          (await bitcoinClient.getBlockchainInfo()).blocks ===
          (await clnClient.getInfo()).blockHeight
        ) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    const clnInvoicePreimage = randomBytes(32);
    const clnInvoice = await btcCurrency.clnClient!.addHoldInvoice(
      10_000,
      crypto.sha256(clnInvoicePreimage),
    );
    btcCurrency.clnClient!.once('htlc.accepted', async () => {
      await btcCurrency.clnClient!.settleHoldInvoice(clnInvoicePreimage);
    });

    await btcCurrency.lndClient!.sendPayment(clnInvoice);

    const lndInvoice = await btcCurrency.lndClient!.addInvoice(10_00);
    const clnPayRes = await btcCurrency.clnClient!.sendPayment(
      lndInvoice.paymentRequest,
      100,
      lndInvoice.paymentRequest,
    );

    const lndPaidSwap = await createClaimableOutput(
      undefined,
      clnInvoicePreimage,
      'BTC/BTC',
      clnInvoice,
    );
    const clnPaidSwap = await createClaimableOutput(
      undefined,
      clnPayRes.preimage,
      'BTC/BTC',
      lndInvoice.paymentRequest,
    );

    SwapRepository.getSwapsClaimable = jest
      .fn()
      .mockResolvedValue([lndPaidSwap.swap, clnPaidSwap.swap]);

    await claimer.init();

    const lockupTxs = [lndPaidSwap, clnPaidSwap].map(
      ({ swap }) => swap.lockupTransactionId!,
    );
    const claimTx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        (await bitcoinClient.getRawMempool()).find(
          (txId) => !lockupTxs.includes(txId),
        )!,
      ),
    );

    expect(claimTx.ins.length).toEqual(2);
  });

  test('should keep pending swaps in map when claim fails', async () => {
    const rejection = 'no good';
    btcCurrency.chainClient!.sendRawTransaction = jest
      .fn()
      .mockRejectedValue(rejection);

    const { swap, preimage } = await createClaimableOutput();
    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

    await expect(claimer.sweep()).rejects.toEqual(rejection);
    expect(claimer['swapsToClaim'].get('BTC')!.size).toEqual(1);
    expect(claimer['swapsToClaim'].get('BTC')!.get(swap.id)).toEqual({
      preimage,
      swap: {
        ...swap,
        status: SwapUpdateEvent.TransactionClaimPending,
      },
    });
  });
});
