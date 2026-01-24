import type { Transaction } from 'bitcoinjs-lib';
import { crypto, networks } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { OutputType } from 'boltz-core';
import { randomBytes } from 'crypto';
import fs from 'fs';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { networks as liquidNetworks } from 'liquidjs-lib';
import path from 'path';
import { parseTransaction, setup } from '../../../lib/Core';
import { ECPair } from '../../../lib/ECPairHelper';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString, getPairId } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapVersion,
} from '../../../lib/consts/Enums';
import Database from '../../../lib/db/Database';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import FundingAddressRepository from '../../../lib/db/repositories/FundingAddressRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import type ClnPendingPaymentTracker from '../../../lib/lightning/paymentTrackers/ClnPendingPaymentTracker';
import LockupTransactionTracker from '../../../lib/rates/LockupTransactionTracker';
import PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';
import type TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import Sidecar, { TransactionStatus } from '../../../lib/sidecar/Sidecar';
import Errors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import SwapManager from '../../../lib/swap/SwapManager';
import SwapOutputType from '../../../lib/swap/SwapOutputType';
import UtxoNursery from '../../../lib/swap/UtxoNursery';
import { Action } from '../../../lib/swap/hooks/CreationHook';
import type TransactionHook from '../../../lib/swap/hooks/TransactionHook';
import type { Currency } from '../../../lib/wallet/WalletManager';
import WalletManager from '../../../lib/wallet/WalletManager';
import { wait } from '../../Utils';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  elementsClient,
} from '../Nodes';
import { sidecar, startSidecar } from '../sidecar/Utils';

RefundTransactionRepository.getTransaction = jest.fn().mockResolvedValue(null);

const emitTransaction = (
  symbol: string,
  transaction: Transaction | LiquidTransaction,
  status: TransactionStatus = TransactionStatus.ZeroConfSafe,
) => {
  sidecar.emit('transaction', {
    symbol,
    transaction,
    status,
    swapIds: [],
    fundingAddressIds: [],
  });
};

describe('UtxoNursery', () => {
  let db: Database;

  const currencies = [
    {
      network: networks.regtest,
      chainClient: bitcoinClient,
      lndClient: bitcoinLndClient,
      symbol: bitcoinClient.symbol,
      type: CurrencyType.BitcoinLike,
      limits: {
        minWalletBalance: 1,
      },
    },
    {
      type: CurrencyType.Liquid,
      chainClient: elementsClient,
      symbol: elementsClient.symbol,
      network: liquidNetworks.regtest,
      limits: {
        minWalletBalance: 1,
      },
    },
  ] as Currency[];

  const mnemonicPath = path.join(__dirname, 'seed.dat');
  const walletManager = new WalletManager(
    Logger.disabledLogger,
    mnemonicPath,
    mnemonicPath,
    currencies,
    [],
  );

  const lockupTracker = new LockupTransactionTracker(
    Logger.disabledLogger,
    {
      currencies: [
        {
          symbol: 'BTC',
          maxZeroConfAmount: 10_000_000,
        },
      ],
      liquid: {
        maxZeroConfAmount: 10_000_000,
      },
    } as any,
    new Map<string, Currency>(currencies.map((cur) => [cur.symbol, cur])),
    {} as any,
    sidecar,
  );

  const transactionHook = {
    hook: jest.fn().mockReturnValue(true),
  } as unknown as TransactionHook;

  const nursery = new UtxoNursery(
    Logger.disabledLogger,
    sidecar,
    walletManager,
    lockupTracker,
    transactionHook,
    new OverpaymentProtector(Logger.disabledLogger),
  );

  const nodeSwitch = new NodeSwitch(Logger.disabledLogger, {
    swapNode: 'LND',
  });
  const timeoutDeltaProvider = {} as TimeoutDeltaProvider;
  const swapManager = new SwapManager(
    Logger.disabledLogger,
    undefined,
    walletManager,
    nodeSwitch,
    {} as any,
    timeoutDeltaProvider,
    new PaymentRequestUtils(),
    new SwapOutputType(OutputType.Compatibility),
    100_000,
    {
      batchClaimInterval: '',
      expiryTolerance: 10_000,
      deferredClaimSymbols: [],
      cltvDelta: 20,
    },
    lockupTracker,
    sidecar,
    {} as any,
  );

  beforeAll(async () => {
    await startSidecar();

    await setup();

    db = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await db.init();
    await PairRepository.addPair({
      base: elementsClient.symbol,
      quote: bitcoinClient.symbol,
      id: getPairId({
        base: elementsClient.symbol,
        quote: bitcoinClient.symbol,
      }),
    });

    await bitcoinClient.connect();
    await elementsClient.connect();
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    await Promise.all([
      sidecar.connect(
        { on: jest.fn(), removeAllListeners: jest.fn() } as any,
        {} as any,
        false,
      ),
      bitcoinLndClient.connect(false),
      bitcoinLndClient2.connect(false),
    ]);

    await walletManager.init([
      {
        symbol: bitcoinClient.symbol,
        preferredWallet: 'core',
      } as any,
    ]);
    currencies.forEach((currency) => {
      swapManager['currencies'].set(currency.symbol, currency);
    });

    nursery.bindCurrency(currencies);
  });

  afterAll(async () => {
    (
      swapManager.nursery['pendingPaymentTracker'].lightningTrackers[
        NodeType.CLN
      ] as ClnPendingPaymentTracker
    ).stop();

    swapManager.deferredClaimer.close();

    sidecar.disconnect();
    await Sidecar.stop();

    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();

    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    bitcoinClient.disconnect();
    elementsClient.disconnect();

    // Wait a little to make sure no queries are pending anymore
    await wait(500);
    await db.close();

    fs.unlinkSync(mnemonicPath);
  });

  afterEach(() => {
    transactionHook.hook = jest.fn().mockReturnValue(true);
  });

  describe('checkChainSwapTransaction', () => {
    const createChainSwap = async (acceptZeroConf = false) => {
      const preimage = randomBytes(32);
      const claimKeys = ECPair.makeRandom();
      const refundKeys = ECPair.makeRandom();

      const created = await swapManager.createChainSwap({
        acceptZeroConf,
        baseCurrency: 'L-BTC',
        quoteCurrency: 'BTC',
        orderSide: OrderSide.BUY,
        percentageFee: 100,
        preimageHash: crypto.sha256(preimage),
        claimPublicKey: Buffer.from(claimKeys.publicKey),
        refundPublicKey: Buffer.from(refundKeys.publicKey),
        sendingTimeoutBlockDelta: 102,
        receivingTimeoutBlockDelta: 101,
        userLockAmount: 101_000,
        serverLockAmount: 100_000,
      });

      return {
        created,
        preimage,
        claimKeys,
        refundKeys,
      };
    };

    test('should fail when too little was sent', async () => {
      const { created } = await createChainSwap();
      const actualAmount = created.lockupDetails.amount - 1;

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('chainSwap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.INSUFFICIENT_AMOUNT(
              actualAmount,
              created.lockupDetails.amount,
            ).message,
          );
          resolve();
        });
      });

      const txId = await bitcoinClient.sendToAddress(
        created.lockupDetails.lockupAddress,
        actualAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<Transaction>(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getRawTransaction(txId),
      );
      emitTransaction(bitcoinClient.symbol, tx);

      await emitPromise;
    });

    test('should fail on unacceptable overpay', async () => {
      const { created } = await createChainSwap();
      const actualAmount = Math.round(created.lockupDetails.amount * 1.2);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('chainSwap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.OVERPAID_AMOUNT(actualAmount, created.lockupDetails.amount)
              .message,
          );
          resolve();
        });
      });

      const txId = await bitcoinClient.sendToAddress(
        created.lockupDetails.lockupAddress,
        actualAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<Transaction>(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getRawTransaction(txId),
      );
      emitTransaction(bitcoinClient.symbol, tx);

      await emitPromise;
    });

    test('should fail when input address is blocked', async () => {
      const { created } = await createChainSwap();

      transactionHook.hook = jest.fn().mockReturnValue(Action.Reject);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('chainSwap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(Errors.BLOCKED_ADDRESS().message);
          resolve();
        });
      });

      const txId = await bitcoinClient.sendToAddress(
        created.lockupDetails.lockupAddress,
        created.lockupDetails.amount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<Transaction>(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getRawTransaction(txId),
      );
      emitTransaction(bitcoinClient.symbol, tx);

      await emitPromise;
    });

    test('should fail when 0-conf is not accepted', async () => {
      const { created } = await createChainSwap();

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once(
          'chainSwap.lockup.zeroconf.rejected',
          ({ swap, reason }) => {
            expect(swap.id).toEqual(created.id);
            expect(reason).toEqual(
              Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
            );
            resolve();
          },
        );
      });

      const txId = await bitcoinClient.sendToAddress(
        created.lockupDetails.lockupAddress,
        created.lockupDetails.amount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<Transaction>(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getRawTransaction(txId),
      );
      emitTransaction(bitcoinClient.symbol, tx);

      await emitPromise;
    });

    test('should emit lockup', async () => {
      const { created } = await createChainSwap(true);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('chainSwap.lockup', ({ swap, confirmed }) => {
          expect(swap.id).toEqual(created.id);
          expect(confirmed).toEqual(false);
          resolve();
        });
      });

      const txId = await bitcoinClient.sendToAddress(
        created.lockupDetails.lockupAddress,
        created.lockupDetails.amount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<Transaction>(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getRawTransaction(txId),
      );
      emitTransaction(bitcoinClient.symbol, tx);

      await emitPromise;
    });
  });

  describe('checkSwapTransaction', () => {
    const createSubmarine = async (
      acceptZeroConf = false,
      version = SwapVersion.Taproot,
    ) => {
      swapManager['rateProvider'].acceptZeroConf = jest
        .fn()
        .mockReturnValue(acceptZeroConf);

      const invoiceAmount = 100_000;
      const invoice = await bitcoinLndClient2.addInvoice(invoiceAmount);
      const preimageHash = bolt11
        .decode(invoice.paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const refundKeys = ECPair.makeRandom();

      const created = await swapManager.createSwap({
        version,
        timeoutBlockDelta: 1024,
        orderSide: OrderSide.SELL,
        baseCurrency: elementsClient.symbol,
        quoteCurrency: bitcoinClient.symbol,
        refundPublicKey: Buffer.from(refundKeys.publicKey),
        preimageHash: getHexBuffer(preimageHash),
      });

      const { expectedAmount } = await swapManager.setSwapInvoice(
        (await SwapRepository.getSwap({ id: created.id }))!,
        invoice.paymentRequest,
        1,
        {
          baseFee: 1000,
          percentageFee: 1000,
          percentageFeeRate: 0,
        },
        true,
        () => {},
      );

      return {
        created,
        refundKeys,
        expectedAmount,
      };
    };

    test('should fail when too little was sent', async () => {
      const { created, expectedAmount } = await createSubmarine();
      const actualAmount = expectedAmount - 1;

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.INSUFFICIENT_AMOUNT(actualAmount, expectedAmount).message,
          );
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        actualAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitTransaction(elementsClient.symbol, tx);

      await emitPromise;
    });

    test('should fail on unacceptable overpay', async () => {
      const { created, expectedAmount } = await createSubmarine();
      const actualAmount = Math.round(expectedAmount * 1.2);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.OVERPAID_AMOUNT(actualAmount, expectedAmount).message,
          );
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        actualAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitTransaction(elementsClient.symbol, tx);

      await emitPromise;
    });

    test('should fail when input address is blocked', async () => {
      const { created, expectedAmount } = await createSubmarine();

      transactionHook.hook = jest.fn().mockReturnValue(Action.Reject);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup.failed', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(Errors.BLOCKED_ADDRESS().message);
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitTransaction(elementsClient.symbol, tx);

      await emitPromise;
    });

    test('should fail when 0-conf is not accepted', async () => {
      const { created, expectedAmount } = await createSubmarine();

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup.zeroconf.rejected', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
          );
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        undefined,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitTransaction(elementsClient.symbol, tx);

      await emitPromise;
    });

    test.each`
      version
      ${SwapVersion.Taproot}
      ${SwapVersion.Legacy}
    `('should emit lockup for version $version', async ({ version }) => {
      const { created, expectedAmount } = await createSubmarine(true, version);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup', ({ swap, confirmed }) => {
          expect(swap.id).toEqual(created.id);
          expect(confirmed).toEqual(false);
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        2,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitTransaction(elementsClient.symbol, tx);

      await emitPromise;
    });
  });

  describe('checkFundingAddresses', () => {
    const emitFundingAddressTransaction = (
      symbol: string,
      transaction: Transaction | LiquidTransaction,
      fundingAddressIds: string[],
      status: TransactionStatus = TransactionStatus.ZeroConfSafe,
    ) => {
      sidecar.emit('transaction', {
        symbol,
        transaction,
        status,
        swapIds: [],
        fundingAddressIds,
      });
    };

    const createSubmarineWithFundingAddress = async (
      acceptZeroConf = false,
    ) => {
      swapManager['rateProvider'].acceptZeroConf = jest
        .fn()
        .mockReturnValue(acceptZeroConf);

      const invoiceAmount = 100_000;
      const invoice = await bitcoinLndClient2.addInvoice(invoiceAmount);
      const preimageHash = bolt11
        .decode(invoice.paymentRequest)
        .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

      const refundKeys = ECPair.makeRandom();
      const refundPublicKey = Buffer.from(refundKeys.publicKey);

      const created = await swapManager.createSwap({
        version: SwapVersion.Taproot,
        timeoutBlockDelta: 1024,
        orderSide: OrderSide.SELL,
        baseCurrency: elementsClient.symbol,
        quoteCurrency: bitcoinClient.symbol,
        refundPublicKey,
        preimageHash: getHexBuffer(preimageHash),
      });

      const { expectedAmount } = await swapManager.setSwapInvoice(
        (await SwapRepository.getSwap({ id: created.id }))!,
        invoice.paymentRequest,
        1,
        {
          baseFee: 1000,
          percentageFee: 1000,
          percentageFeeRate: 0,
        },
        true,
        () => {},
      );

      // Create a funding address for this swap
      const fundingAddress = await FundingAddressRepository.addFundingAddress({
        id: `funding_${created.id}`,
        symbol: elementsClient.symbol,
        keyIndex: 0,
        theirPublicKey: getHexString(refundPublicKey),
        timeoutBlockHeight: created.timeoutBlockHeight!,
        lockupAmount: expectedAmount,
        lockupTransactionVout: 0,
        swapId: created.id,
      });

      return {
        created,
        refundKeys,
        expectedAmount,
        fundingAddress,
      };
    };

    test('should emit swap.lockup when transaction is sent to funding address', async () => {
      const { created, expectedAmount, fundingAddress } =
        await createSubmarineWithFundingAddress(true);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup', ({ swap, confirmed }) => {
          expect(swap.id).toEqual(created.id);
          expect(confirmed).toEqual(false);
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        2,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitFundingAddressTransaction(elementsClient.symbol, tx, [
        fundingAddress.id,
      ]);

      await emitPromise;
    });

    test('should emit swap.lockup with confirmed true when transaction is confirmed', async () => {
      const { created, expectedAmount, fundingAddress } =
        await createSubmarineWithFundingAddress(true);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup', ({ swap, confirmed }) => {
          expect(swap.id).toEqual(created.id);
          expect(confirmed).toEqual(true);
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        2,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitFundingAddressTransaction(
        elementsClient.symbol,
        tx,
        [fundingAddress.id],
        TransactionStatus.Confirmed,
      );

      await emitPromise;
    });

    test('should reject 0-conf when swap does not accept it via funding address', async () => {
      const { created, expectedAmount, fundingAddress } =
        await createSubmarineWithFundingAddress(false);

      const emitPromise = new Promise<void>((resolve) => {
        nursery.once('swap.lockup.zeroconf.rejected', ({ swap, reason }) => {
          expect(swap.id).toEqual(created.id);
          expect(reason).toEqual(
            Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message,
          );
          resolve();
        });
      });

      const txId = await elementsClient.sendToAddress(
        created.address,
        expectedAmount,
        2,
        false,
        '',
      );
      const tx = parseTransaction<LiquidTransaction>(
        CurrencyType.Liquid,
        await elementsClient.getRawTransaction(txId),
      );
      emitFundingAddressTransaction(elementsClient.symbol, tx, [
        fundingAddress.id,
      ]);

      await emitPromise;
    });
  });
});
