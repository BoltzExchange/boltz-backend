import { randomBytes } from 'crypto';
import { Transaction } from 'ethers';
import Logger from '../../../lib/Logger';
import { generateSwapId, getHexString } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import Database from '../../../lib/db/Database';
import Pair from '../../../lib/db/models/Pair';
import Swap from '../../../lib/db/models/Swap';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import Errors from '../../../lib/swap/Errors';
import EthereumNursery from '../../../lib/swap/EthereumNursery';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import { Action } from '../../../lib/swap/hooks/CreationHook';
import type TransactionHook from '../../../lib/swap/hooks/TransactionHook';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';

describe('EthereumNursery', () => {
  let database: Database;

  const mockAddress = '0x735Ec659CB2E2D2B778F8D4178ce2a521D617119';

  const exampleTransaction = Transaction.from(
    '0x02f8732103843b9aca0084a6fb2cd482520894f39fd6e51aad88f6f4ce6ab8827279cfffb92266893635c9adc5dea0000080c001a03321cede5d110b71d670aaea8353427dea69e67b74f3f3f0fb85c3b682b3cbf4a0240a9787a8807fe07255f0e541ad94b271821660aa3e786699c29c9dd1399d56',
  );

  let releaseHook: () => void;
  let hookGate: Promise<void>;

  const transactionHook = {
    hook: jest.fn(),
  } as unknown as TransactionHook;

  const nursery = new EthereumNursery(
    Logger.disabledLogger,
    {
      wallets: new Map<string, any>([
        ['ETH', { symbol: 'ETH', type: CurrencyType.Ether }],
      ]),
    } as any,
    {
      address: mockAddress,
      networkDetails: networks.Ethereum,
      hasSymbol: () => true,
      provider: {},
      contractEventHandler: { on: () => {} },
    } as any,
    transactionHook,
    new OverpaymentProtector(Logger.disabledLogger),
  );

  const validEtherSwapValues = (timeoutBlockHeight: number) =>
    ({
      claimAddress: mockAddress,
      refundAddress: mockAddress,
      amount: BigInt('100000000000'),
      preimageHash: getHexString(randomBytes(32)),
      timelock: timeoutBlockHeight,
    }) as any;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await Pair.create({
      base: 'ETH',
      quote: 'BTC',
      id: 'ETH/BTC',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    nursery.removeAllListeners();

    hookGate = new Promise<void>((resolve) => {
      releaseHook = resolve;
    });
    transactionHook.hook = jest.fn().mockImplementation(async () => {
      await hookGate;
      return Action.Accept;
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should emit nothing when an invalid lockup takes a chain swap while a valid one is validating', async () => {
    const id = generateSwapId(SwapVersion.Taproot);
    await ChainSwapRepository.addChainSwap({
      chainSwap: {
        id,
        fee: 1,
        pair: 'ETH/BTC',
        acceptZeroConf: false,
        orderSide: OrderSide.SELL,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(randomBytes(32)),
        createdRefundSignature: false,
      },
      sendingData: {
        swapId: id,
        symbol: 'BTC',
        lockupAddress: 'bc1',
        timeoutBlockHeight: 1,
        expectedAmount: 9,
      },
      receivingData: {
        swapId: id,
        symbol: 'ETH',
        lockupAddress: mockAddress,
        timeoutBlockHeight: 1,
        expectedAmount: 10,
      },
    });
    const swap = (await ChainSwapRepository.getChainSwap({ id }))!;

    const events = jest.fn();
    nursery.on('eth.lockup', events);
    nursery.on('lockup.failed', events);

    const validCheck = nursery.checkEtherSwapLockup(
      swap,
      exampleTransaction,
      validEtherSwapValues(swap.receivingData.timeoutBlockHeight),
      5,
    );
    await new Promise(setImmediate);

    await ChainSwapRepository.setUserLockupTransaction(
      swap,
      'competing-lockup',
      1,
      {
        status: SwapUpdateEvent.TransactionLockupFailed,
        failureReason: 'lockup failed',
      },
      7,
    );

    releaseHook();
    await validCheck;

    expect(events).not.toHaveBeenCalled();

    const updated = (await ChainSwapRepository.getChainSwap({ id }))!;
    expect(updated.status).toEqual(SwapUpdateEvent.TransactionLockupFailed);
    expect(updated.receivingData.transactionId).toEqual('competing-lockup');
    expect(updated.receivingData.transactionVout).toEqual(7);
  });

  test('should emit lockup.failed when a fresh chain swap lockup fails validation', async () => {
    const id = generateSwapId(SwapVersion.Taproot);
    await ChainSwapRepository.addChainSwap({
      chainSwap: {
        id,
        fee: 1,
        pair: 'ETH/BTC',
        acceptZeroConf: false,
        orderSide: OrderSide.SELL,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(randomBytes(32)),
        createdRefundSignature: false,
      },
      sendingData: {
        swapId: id,
        symbol: 'BTC',
        lockupAddress: 'bc1',
        timeoutBlockHeight: 1,
        expectedAmount: 9,
      },
      receivingData: {
        swapId: id,
        symbol: 'ETH',
        lockupAddress: mockAddress,
        timeoutBlockHeight: 1,
        expectedAmount: 10,
      },
    });
    const swap = (await ChainSwapRepository.getChainSwap({ id }))!;

    const lockupEvents = jest.fn();
    const failedEvents = jest.fn();
    nursery.on('eth.lockup', lockupEvents);
    nursery.on('lockup.failed', failedEvents);

    const underpaidValues = validEtherSwapValues(
      swap.receivingData.timeoutBlockHeight,
    );
    underpaidValues.amount = BigInt('90000000000');

    await nursery.checkEtherSwapLockup(
      swap,
      exampleTransaction,
      underpaidValues,
      5,
    );

    expect(lockupEvents).not.toHaveBeenCalled();
    expect(failedEvents).toHaveBeenCalledTimes(1);
    expect(failedEvents.mock.calls[0][0].reason).toEqual(
      Errors.INSUFFICIENT_AMOUNT(9, 10).message,
    );
    expect(failedEvents.mock.calls[0][0].swap.status).toEqual(
      SwapUpdateEvent.TransactionLockupFailed,
    );

    const updated = (await ChainSwapRepository.getChainSwap({ id }))!;
    expect(updated.status).toEqual(SwapUpdateEvent.TransactionLockupFailed);
    expect(updated.receivingData.transactionId).toEqual(
      exampleTransaction.hash,
    );
    expect(updated.receivingData.transactionVout).toEqual(5);

    // What SwapNursery does when it handles the "lockup.failed" event
    const withReason = await WrappedSwapRepository.setStatus(
      updated,
      SwapUpdateEvent.TransactionLockupFailed,
      Errors.INSUFFICIENT_AMOUNT(9, 10).message,
    );

    await nursery.checkEtherSwapLockup(
      withReason,
      exampleTransaction,
      underpaidValues,
      5,
    );
    expect(failedEvents).toHaveBeenCalledTimes(1);
  });

  test('should emit lockup.failed again when a renegotiated lockup still fails', async () => {
    const id = generateSwapId(SwapVersion.Taproot);
    await ChainSwapRepository.addChainSwap({
      chainSwap: {
        id,
        fee: 1,
        pair: 'ETH/BTC',
        acceptZeroConf: false,
        orderSide: OrderSide.SELL,
        status: SwapUpdateEvent.SwapCreated,
        preimageHash: getHexString(randomBytes(32)),
        createdRefundSignature: false,
      },
      sendingData: {
        swapId: id,
        symbol: 'BTC',
        lockupAddress: 'bc1',
        timeoutBlockHeight: 1,
        expectedAmount: 9,
      },
      receivingData: {
        swapId: id,
        symbol: 'ETH',
        lockupAddress: mockAddress,
        timeoutBlockHeight: 1,
        expectedAmount: 10,
      },
    });
    const swap = (await ChainSwapRepository.getChainSwap({ id }))!;

    const failedEvents = jest.fn();
    nursery.on('lockup.failed', failedEvents);

    const underpaidValues = validEtherSwapValues(
      swap.receivingData.timeoutBlockHeight,
    );
    underpaidValues.amount = BigInt('90000000000');

    releaseHook();
    await nursery.checkEtherSwapLockup(
      swap,
      exampleTransaction,
      underpaidValues,
      5,
    );
    expect(failedEvents).toHaveBeenCalledTimes(1);

    const failed = await WrappedSwapRepository.setStatus(
      (await ChainSwapRepository.getChainSwap({ id }))!,
      SwapUpdateEvent.TransactionLockupFailed,
      Errors.INSUFFICIENT_AMOUNT(9, 10).message,
    );

    // Renegotiating clears the failure reason, but the amount is still too low
    const renegotiated = await ChainSwapRepository.setExpectedAmounts(
      failed,
      1,
      10,
      9,
      false,
    );
    expect(renegotiated.failureReason).toBeNull();

    await nursery.checkEtherSwapLockup(
      renegotiated,
      exampleTransaction,
      underpaidValues,
      5,
      { allowLockupFailedUpdate: true },
    );
    expect(failedEvents).toHaveBeenCalledTimes(2);
  });

  test('should emit only its own identity when a valid submarine lockup takes over from a failed one', async () => {
    const swapData = {
      fee: 1,
      pair: 'ETH/BTC',
      acceptZeroConf: false,
      lockupAddress: mockAddress,
      timeoutBlockHeight: 1,
      orderSide: OrderSide.SELL,
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.SwapCreated,
      id: generateSwapId(SwapVersion.Taproot),
      preimageHash: getHexString(randomBytes(32)),
      createdRefundSignature: false,
      expectedAmount: 10,
    };
    const swap = await Swap.create(swapData);

    const lockupEvents = jest.fn();
    const failedEvents = jest.fn();
    nursery.on('eth.lockup', lockupEvents);
    nursery.on('lockup.failed', failedEvents);

    const validCheck = nursery.checkEtherSwapLockup(
      swap,
      exampleTransaction,
      validEtherSwapValues(swapData.timeoutBlockHeight),
      5,
    );
    await new Promise(setImmediate);

    await SwapRepository.setLockupTransaction(
      swap,
      'competing-lockup',
      1,
      {
        status: SwapUpdateEvent.TransactionLockupFailed,
        failureReason: 'lockup failed',
      },
      7,
    );

    releaseHook();
    await validCheck;

    expect(failedEvents).not.toHaveBeenCalled();
    expect(lockupEvents).toHaveBeenCalledTimes(1);

    const emitted = lockupEvents.mock.calls[0][0];
    expect(emitted.lockup).toEqual({
      transactionId: exampleTransaction.hash,
      vout: 5,
    });
    expect(emitted.swap.lockupTransactionId).toEqual(exampleTransaction.hash);
    expect(emitted.swap.lockupTransactionVout).toEqual(5);
    expect(emitted.swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);

    await swap.reload();
    expect(swap.lockupTransactionId).toEqual(exampleTransaction.hash);
    expect(swap.lockupTransactionVout).toEqual(5);
  });

  test('should serialize concurrent callbacks for the same swap', async () => {
    const swapData = {
      fee: 1,
      pair: 'ETH/BTC',
      acceptZeroConf: false,
      lockupAddress: mockAddress,
      timeoutBlockHeight: 1,
      orderSide: OrderSide.SELL,
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.SwapCreated,
      id: generateSwapId(SwapVersion.Taproot),
      preimageHash: getHexString(randomBytes(32)),
      createdRefundSignature: false,
      expectedAmount: 10,
    };
    const swap = await Swap.create(swapData);

    const competingTransaction = exampleTransaction.clone();
    competingTransaction.nonce = exampleTransaction.nonce + 1;
    expect(competingTransaction.hash).not.toEqual(exampleTransaction.hash);

    const lockupEvents = jest.fn();
    const failedEvents = jest.fn();
    nursery.on('eth.lockup', lockupEvents);
    nursery.on('lockup.failed', failedEvents);

    const checkA = nursery.checkEtherSwapLockup(
      swap,
      exampleTransaction,
      validEtherSwapValues(swapData.timeoutBlockHeight),
      5,
    );
    const checkB = nursery.checkEtherSwapLockup(
      swap,
      competingTransaction,
      validEtherSwapValues(swapData.timeoutBlockHeight),
      7,
    );
    await new Promise(setImmediate);

    expect(transactionHook.hook).toHaveBeenCalledTimes(1);

    releaseHook();
    await Promise.all([checkA, checkB]);

    expect(failedEvents).not.toHaveBeenCalled();
    expect(lockupEvents).toHaveBeenCalledTimes(1);

    const emitted = lockupEvents.mock.calls[0][0];
    expect(emitted.lockup).toEqual({
      transactionId: exampleTransaction.hash,
      vout: 5,
    });

    await swap.reload();
    expect(swap.status).toEqual(SwapUpdateEvent.TransactionConfirmed);
    expect(swap.lockupTransactionId).toEqual(exampleTransaction.hash);
    expect(swap.lockupTransactionVout).toEqual(5);
  });
});
