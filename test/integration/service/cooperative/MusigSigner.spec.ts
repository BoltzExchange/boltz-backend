import AsyncLock from 'async-lock';
import { Transaction, address, crypto } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import {
  Musig,
  Networks,
  OutputType,
  Scripts,
  SwapTreeSerializer,
  constructClaimTransaction,
  constructRefundTransaction,
  detectSwap,
  reverseSwapTree,
  swapTree,
} from 'boltz-core';
import { randomBytes } from 'crypto';
import { hashForWitnessV1, setup, tweakMusig, zkp } from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import { RefundStatus } from '../../../../lib/db/models/RefundTransaction';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import type Swap from '../../../../lib/db/models/Swap';
import type { ChainSwapInfo } from '../../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../../lib/db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import WrappedSwapRepository from '../../../../lib/db/repositories/WrappedSwapRepository';
import * as noderpc from '../../../../lib/proto/cln/node_pb';
import Errors from '../../../../lib/service/Errors';
import MusigSigner, {
  RefundRejectionReason,
} from '../../../../lib/service/cooperative/MusigSigner';
import type SwapNursery from '../../../../lib/swap/SwapNursery';
import type Wallet from '../../../../lib/wallet/Wallet';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import { waitForFunctionToBeTrue } from '../../../Utils';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  clnClient,
} from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');
jest.mock('../../../../lib/db/repositories/ReverseSwapRepository');

jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('MusigSigner', () => {
  const btcCurrency = {
    clnClient,
    symbol: 'BTC',
    chainClient: bitcoinClient,
    lndClient: bitcoinLndClient,
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  const btcWallet = {} as Wallet;
  const walletManager = {
    wallets: new Map<string, Wallet>([['BTC', btcWallet]]),
  } as WalletManager;

  const nursery = {
    lock: new AsyncLock(),
    settleReverseSwapInvoice: jest.fn(),
  } as any as SwapNursery;

  const signer = new MusigSigner(
    Logger.disabledLogger,
    new Map<string, any>([
      ['BTC', btcCurrency],
      ['noChainClient', {}],
    ]),
    walletManager,
    nursery,
  );

  beforeAll(async () => {
    await Promise.all([
      setup(),
      bitcoinClient.connect(),
      clnClient.connect(),
      bitcoinLndClient.connect(true),
      bitcoinLndClient2.connect(true),
    ]);

    await bitcoinClient.generate(1);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
  });

  test('should throw when allowing refund for a swap that does not exist', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue(null);

    const id = 'notFound';
    await expect(signer.allowRefund(id)).rejects.toEqual(
      Errors.SWAP_NOT_FOUND(id),
    );
  });

  test('should create refund signature for failed swaps', async () => {
    const claimKeys = ECPair.makeRandom();
    const refundKeys = ECPair.makeRandom();
    const preimage = randomBytes(32);

    const tree = swapTree(
      false,
      crypto.sha256(preimage),
      Buffer.from(claimKeys.publicKey),
      Buffer.from(refundKeys.publicKey),
      (await bitcoinClient.getBlockchainInfo()).blocks + 21,
    );

    const musig = new Musig(zkp, refundKeys, randomBytes(32), [
      Buffer.from(claimKeys.publicKey),
      Buffer.from(refundKeys.publicKey),
    ]);
    const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);

    const swapOutputScript = Scripts.p2trOutput(tweakedKey);

    const lockupTx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          address.fromOutputScript(swapOutputScript, Networks.bitcoinRegtest),
          100_000,
          undefined,
          false,
          '',
        ),
      ),
    );

    const swapOutput = detectSwap(tweakedKey, lockupTx)!;
    expect(swapOutput).not.toBeUndefined();

    const refundTx = constructRefundTransaction(
      [
        {
          ...swapOutput,
          keys: refundKeys,
          cooperative: true,
          type: OutputType.Taproot,
          txHash: lockupTx.getHash(),
        },
      ],
      address.toOutputScript(
        await bitcoinClient.getNewAddress(''),
        Networks.bitcoinRegtest,
      ),
      0,
      300,
      false,
    );

    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      keyIndex: 42,
      pair: 'BTC/BTC',
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.InvoiceFailedToPay,
      refundPublicKey: getHexString(Buffer.from(refundKeys.publicKey)),
      preimageHash: getHexString(crypto.sha256(preimage)),
      invoice: (await bitcoinLndClient2.addInvoice(123)).paymentRequest,
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
    });

    btcWallet.getKeysByIndex = jest.fn().mockReturnValue(claimKeys);

    const boltzPartialSig = await signer.signRefund(
      'refundable',
      Buffer.from(musig.getPublicNonce()),
      refundTx.toBuffer(),
      0,
    );

    musig.aggregateNonces([[claimKeys.publicKey, boltzPartialSig.pubNonce]]);
    musig.initializeSession(await hashForWitnessV1(btcCurrency, refundTx, 0));
    musig.signPartial();
    musig.addPartial(
      Buffer.from(claimKeys.publicKey),
      boltzPartialSig.signature,
    );

    refundTx.setWitness(0, [musig.aggregatePartials()]);

    await bitcoinClient.sendRawTransaction(refundTx.toHex());
  });

  test('should throw when creating refund signature for onchain currency that is not UTXO based', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      pair: 'noChainClient/BTC',
      side: OrderSide.BUY,
    });

    const id = 'noChain';
    await expect(
      signer.signRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
    ).rejects.toEqual(Errors.CURRENCY_NOT_UTXO_BASED());
  });

  test('should throw when creating refund signature for swap that does not exist', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue(undefined);

    const id = 'notFound';
    await expect(
      signer.signRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
    ).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));

    expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
    expect(SwapRepository.getSwap).toHaveBeenCalledWith({ id });
  });

  test.each`
    status
    ${SwapUpdateEvent.SwapCreated}
    ${SwapUpdateEvent.InvoiceSettled}
    ${SwapUpdateEvent.TransactionMempool}
    ${SwapUpdateEvent.TransactionConfirmed}
    ${SwapUpdateEvent.InvoicePending}
    ${SwapUpdateEvent.TransactionClaimed}
  `(
    'should throw when creating refund signature for swap that has non failed status: $status',
    async ({ status }) => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        status,
        pair: 'BTC/BTC',
        version: SwapVersion.Taproot,
      });

      const id = 'nonFailed';

      await expect(
        signer.signRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          RefundRejectionReason.StatusNotEligible,
        ),
      );
    },
  );

  test('should throw when creating refund signature for legacy reverse swap', async () => {
    const id = 'id';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      id,
      pair: 'BTC/BTC',
      orderSide: OrderSide.SELL,
      version: SwapVersion.Legacy,
    });

    await expect(
      signer.signRefund(id, randomBytes(32), Buffer.alloc(0), 0),
    ).rejects.toEqual(
      Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
        RefundRejectionReason.VersionNotTaproot,
      ),
    );
  });

  test.each`
    node
    ${NodeType.LND}
    ${NodeType.CLN}
  `(
    'should throw when creating refund signature for swap that has pending payment with node: $node',
    async ({ node }) => {
      const preimageHash = randomBytes(32);
      const holdInvoice = await bitcoinLndClient2.addHoldInvoice(
        1_000,
        preimageHash,
      );
      const payingNode = node === NodeType.LND ? bitcoinLndClient : clnClient;
      const payPromise = payingNode.sendPayment(holdInvoice);

      const swap = {
        pair: 'BTC/BTC',
        invoice: holdInvoice,
        version: SwapVersion.Taproot,
        preimageHash: getHexString(preimageHash),
        status: SwapUpdateEvent.InvoiceFailedToPay,
      } as Swap;

      await waitForFunctionToBeTrue(
        () =>
          MusigSigner['hasPendingOrSuccessfulLightningPayment'](
            btcCurrency,
            swap,
          ),
        100,
      );

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      await expect(
        signer.signRefund(
          'pendingPayment',
          Buffer.alloc(0),
          Buffer.alloc(0),
          0,
        ),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          RefundRejectionReason.LightningPaymentPending,
        ),
      );

      await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
      await expect(payPromise).rejects.toEqual(expect.anything());
    },
  );

  test('should allow refunds for swaps with pending payments when explicitly allowed', async () => {
    const preimageHash = randomBytes(32);
    const holdInvoice = await bitcoinLndClient2.addHoldInvoice(
      1_000,
      preimageHash,
    );
    const payPromise = bitcoinLndClient.sendPayment(holdInvoice);

    const swap = {
      pair: 'BTC/BTC',
      id: 'refundable',
      invoice: holdInvoice,
      version: SwapVersion.Taproot,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
    } as Swap;

    await waitForFunctionToBeTrue(
      () =>
        MusigSigner['hasPendingOrSuccessfulLightningPayment'](
          btcCurrency,
          swap,
        ),
      100,
    );

    SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

    await signer.allowRefund(swap.id);
    await signer['validateEligibility'](swap);

    await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
    await expect(payPromise).rejects.toEqual(expect.anything());
  });

  describe('signReverseSwapClaim', () => {
    test('should create claim signature for reverse swaps', async () => {
      const claimKeys = ECPair.makeRandom();
      const refundKeys = ECPair.makeRandom();
      const preimage = randomBytes(32);

      const tree = reverseSwapTree(
        false,
        crypto.sha256(preimage),
        Buffer.from(claimKeys.publicKey),
        Buffer.from(refundKeys.publicKey),
        (await bitcoinClient.getBlockchainInfo()).blocks + 21,
      );

      const musig = new Musig(
        zkp,
        claimKeys,
        randomBytes(32),
        [refundKeys.publicKey, claimKeys.publicKey].map(Buffer.from),
      );
      const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);

      const swapOutputScript = Scripts.p2trOutput(tweakedKey);

      const lockupTx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            address.fromOutputScript(swapOutputScript, Networks.bitcoinRegtest),
            100_000,
            undefined,
            false,
            '',
          ),
        ),
      );

      const swapOutput = detectSwap(tweakedKey, lockupTx)!;
      expect(swapOutput).not.toBeUndefined();

      const claimTx = constructClaimTransaction(
        [
          {
            ...swapOutput,
            preimage,
            keys: refundKeys,
            cooperative: true,
            type: OutputType.Taproot,
            txHash: lockupTx.getHash(),
          },
        ],
        address.toOutputScript(
          await bitcoinClient.getNewAddress(''),
          Networks.bitcoinRegtest,
        ),
        300,
        false,
      );

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        keyIndex: 42,
        pair: 'BTC/BTC',
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionConfirmed,
        claimPublicKey: getHexString(Buffer.from(claimKeys.publicKey)),
        preimageHash: getHexString(crypto.sha256(preimage)),
        redeemScript: JSON.stringify(
          SwapTreeSerializer.serializeSwapTree(tree),
        ),
      });
      WrappedSwapRepository.setPreimage = jest.fn();

      btcWallet.getKeysByIndex = jest.fn().mockReturnValue(refundKeys);

      const boltzPartialSig = await signer.signReverseSwapClaim(
        'claimable',
        preimage,
        {
          index: 0,
          rawTransaction: claimTx.toBuffer(),
          theirNonce: Buffer.from(musig.getPublicNonce()),
        },
      );
      expect(boltzPartialSig).toBeDefined();

      expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledTimes(1);
      expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledWith(
        await ReverseSwapRepository.getReverseSwap({}),
        preimage,
      );
      expect(WrappedSwapRepository.setPreimage).toHaveBeenCalledWith(
        expect.anything(),
        preimage,
      );

      musig.aggregateNonces([
        [refundKeys.publicKey, boltzPartialSig!.pubNonce],
      ]);
      musig.initializeSession(await hashForWitnessV1(btcCurrency, claimTx, 0));
      musig.signPartial();
      musig.addPartial(
        Buffer.from(refundKeys.publicKey),
        boltzPartialSig!.signature,
      );

      claimTx.setWitness(0, [musig.aggregatePartials()]);

      await bitcoinClient.sendRawTransaction(claimTx.toHex());
    });

    test('should just settle the swap when there is no transaction to sign', async () => {
      const preimage = randomBytes(32);
      const swap = {
        id: 'claimable',
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionConfirmed,
        preimageHash: getHexString(crypto.sha256(preimage)),
      } as Swap;

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(swap);

      await expect(
        signer.signReverseSwapClaim(swap.id, preimage),
      ).resolves.toBeUndefined();

      expect(WrappedSwapRepository.setPreimage).toHaveBeenCalledWith(
        swap,
        preimage,
      );

      expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledTimes(1);
      expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledWith(
        swap,
        preimage,
      );
    });

    test('should throw when creating claim signature for reverse swap that does not exist', async () => {
      ReverseSwapRepository.getReverseSwap = jest
        .fn()
        .mockResolvedValue(undefined);

      const id = 'notFound';
      await expect(
        signer.signReverseSwapClaim(id, Buffer.alloc(0), {
          index: 0,
          theirNonce: Buffer.alloc(0),
          rawTransaction: Buffer.alloc(0),
        }),
      ).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));

      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({ id });
    });

    test.each`
      status
      ${SwapUpdateEvent.SwapCreated}
      ${SwapUpdateEvent.TransactionFailed}
    `(
      'should throw when creating claim signature for reverse swap that has non claimable: $status',
      async ({ status }) => {
        ReverseSwapRepository.getReverseSwap = jest
          .fn()
          .mockResolvedValue({ status, version: SwapVersion.Taproot });

        await expect(
          signer.signReverseSwapClaim('nonClaimable', Buffer.alloc(0), {
            index: 0,
            theirNonce: Buffer.alloc(0),
            rawTransaction: Buffer.alloc(0),
          }),
        ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
      },
    );

    test('should throw when creating claim signature for reverse swap with incorrect preimage', async () => {
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        version: SwapVersion.Taproot,
        preimageHash: randomBytes(32),
        status: SwapUpdateEvent.TransactionConfirmed,
      });

      await expect(
        signer.signReverseSwapClaim('invalidPreimage', randomBytes(32), {
          index: 0,
          theirNonce: Buffer.alloc(0),
          rawTransaction: Buffer.alloc(0),
        }),
      ).rejects.toEqual(Errors.INCORRECT_PREIMAGE());
    });

    test.each`
      length
      ${16}
      ${31}
      ${33}
      ${64}
    `(
      'should throw when creating claim signature for reverse swap with preimage length $length',
      async ({ length }) => {
        const preimage = randomBytes(length);

        ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
          version: SwapVersion.Taproot,
          status: SwapUpdateEvent.TransactionConfirmed,
          preimageHash: getHexString(crypto.sha256(preimage)),
        });

        await expect(
          signer.signReverseSwapClaim('invalidPreimage', preimage, {
            index: 0,
            theirNonce: Buffer.alloc(0),
            rawTransaction: Buffer.alloc(0),
          }),
        ).rejects.toEqual(Errors.INCORRECT_PREIMAGE());
      },
    );

    test('should throw when creating claim signature for legacy reverse swap', async () => {
      const id = 'id';
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        id,
        version: SwapVersion.Legacy,
      });

      await expect(
        signer.signReverseSwapClaim(id, randomBytes(32), {
          index: 0,
          theirNonce: Buffer.alloc(0),
          rawTransaction: Buffer.alloc(0),
        }),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
    });
  });

  describe('refundNonEligibilityReason', () => {
    test('should not be eligible for swap version legacy', async () => {
      await expect(
        MusigSigner.refundNonEligibilityReason({
          type: SwapVersion.Legacy,
        } as any),
      ).resolves.toEqual(RefundRejectionReason.VersionNotTaproot);
    });

    test.each`
      status
      ${SwapUpdateEvent.SwapExpired}
      ${SwapUpdateEvent.TransactionFailed}
      ${SwapUpdateEvent.InvoiceFailedToPay}
      ${SwapUpdateEvent.TransactionRefunded}
      ${SwapUpdateEvent.TransactionLockupFailed}
    `('should be eligible for status $status', async ({ status }) => {
      await expect(
        MusigSigner.refundNonEligibilityReason({
          status,
          version: SwapVersion.Taproot,
        } as Swap),
      ).resolves.toEqual(undefined);
    });

    test.each`
      status
      ${SwapUpdateEvent.SwapCreated}
      ${SwapUpdateEvent.InvoicePaid}
      ${SwapUpdateEvent.InvoicePending}
      ${SwapUpdateEvent.InvoiceSettled}
      ${SwapUpdateEvent.TransactionClaimed}
    `('should not be eligible for status $status', async ({ status }) => {
      await expect(
        MusigSigner.refundNonEligibilityReason({
          status,
          version: SwapVersion.Taproot,
        } as any),
      ).resolves.toEqual(RefundRejectionReason.StatusNotEligible);
    });

    describe('LND', () => {
      test('should not be eligible for successful payment', async () => {
        const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
        const preimageHash = bolt11
          .decode(paymentRequest)
          .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

        await bitcoinLndClient.sendPayment(paymentRequest);

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              preimageHash,
              invoice: paymentRequest,
              version: SwapVersion.Taproot,
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(RefundRejectionReason.LightningPaymentPending);
      });

      test('should not be eligible for pending payment', async () => {
        const preimageHash = randomBytes(32);
        const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
        bitcoinLndClient2.subscribeSingleInvoice(preimageHash);
        const payPromise = bitcoinLndClient.sendPayment(invoice);

        await new Promise<void>((resolve) => {
          bitcoinLndClient2.on('htlc.accepted', () => {
            resolve();
          });
        });

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              invoice,
              version: SwapVersion.Taproot,
              preimageHash: getHexString(preimageHash),
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(RefundRejectionReason.LightningPaymentPending);

        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
        await expect(payPromise).rejects.toEqual(expect.anything());
      });

      test('should be eligible for failed payment', async () => {
        const preimageHash = randomBytes(32);
        const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
        await expect(bitcoinLndClient.sendPayment(invoice)).rejects.toEqual(
          expect.anything(),
        );

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              invoice,
              version: SwapVersion.Taproot,
              preimageHash: getHexString(preimageHash),
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(undefined);
      });

      test('should be eligible for payment that was never attempted', async () => {
        const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
        const preimageHash = bolt11
          .decode(paymentRequest)
          .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              preimageHash,
              invoice: paymentRequest,
              version: SwapVersion.Taproot,
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(undefined);
      });
    });

    describe('CLN', () => {
      test('should not be eligible for successful payment', async () => {
        const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
        const preimageHash = bolt11
          .decode(paymentRequest)
          .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

        await clnClient.sendPayment(paymentRequest);

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              preimageHash,
              invoice: paymentRequest,
              version: SwapVersion.Taproot,
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(RefundRejectionReason.LightningPaymentPending);
      });

      test('should not be eligible for pending payment', async () => {
        const preimageHash = randomBytes(32);
        const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
        bitcoinLndClient2.subscribeSingleInvoice(preimageHash);
        const payPromise = clnClient.sendPayment(invoice);

        await new Promise<void>((resolve) => {
          bitcoinLndClient2.on('htlc.accepted', () => {
            resolve();
          });
        });

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              invoice,
              version: SwapVersion.Taproot,
              preimageHash: getHexString(preimageHash),
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(RefundRejectionReason.LightningPaymentPending);

        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
        await expect(payPromise).rejects.toEqual(expect.anything());
      });

      test('should be eligible for failed payment', async () => {
        const preimageHash = randomBytes(32);
        const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
        await expect(clnClient.sendPayment(invoice)).rejects.toEqual(
          expect.anything(),
        );

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              invoice,
              version: SwapVersion.Taproot,
              preimageHash: getHexString(preimageHash),
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(undefined);
      });

      test('should be eligible for failed payment for which error reason is available', async () => {
        const preimageHash = randomBytes(32);
        const invoice = await bitcoinLndClient2.addHoldInvoice(1, preimageHash);
        await bitcoinLndClient2.cancelHoldInvoice(preimageHash);

        const payRequest = new noderpc.PayRequest();
        payRequest.setBolt11(invoice);
        await expect(
          clnClient['unaryNodeCall']('pay', payRequest),
        ).rejects.toEqual(expect.anything());

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              invoice,
              version: SwapVersion.Taproot,
              preimageHash: getHexString(preimageHash),
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(undefined);
      });

      test('should be eligible for payment that was never attempted', async () => {
        const { paymentRequest } = await bitcoinLndClient2.addInvoice(1);
        const preimageHash = bolt11
          .decode(paymentRequest)
          .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;

        await expect(
          MusigSigner.refundNonEligibilityReason(
            {
              preimageHash,
              invoice: paymentRequest,
              version: SwapVersion.Taproot,
              status: SwapUpdateEvent.InvoiceFailedToPay,
            } as Swap,
            btcCurrency,
          ),
        ).resolves.toEqual(undefined);
      });
    });

    describe('chain swap refunds', () => {
      test('should be eligible when no transaction was sent for the chain swap', async () => {
        const swap = {
          type: SwapType.Chain,
          version: SwapVersion.Taproot,
          status: SwapUpdateEvent.TransactionRefunded,
          sendingData: {
            transactionId: null,
          },
        } as unknown as ChainSwapInfo;

        await expect(
          MusigSigner.refundNonEligibilityReason(swap),
        ).resolves.toEqual(undefined);
      });

      test('should be eligigble when there was no refund transaction sent', async () => {
        const swap = {
          type: SwapType.Chain,
          version: SwapVersion.Taproot,
          status: SwapUpdateEvent.TransactionRefunded,
          sendingData: {
            transactionId: 'tx',
          },
        } as unknown as ChainSwapInfo;

        RefundTransactionRepository.getTransactionForSwap = jest
          .fn()
          .mockResolvedValue(null);

        await expect(
          MusigSigner.refundNonEligibilityReason(swap),
        ).resolves.toEqual(undefined);
      });

      test('should not be eligible when there was a refund transaction sent but it is not confirmed', async () => {
        const swap = {
          type: SwapType.Chain,
          version: SwapVersion.Taproot,
          status: SwapUpdateEvent.TransactionRefunded,
          sendingData: {
            transactionId: 'tx',
          },
        } as unknown as ChainSwapInfo;

        RefundTransactionRepository.getTransactionForSwap = jest
          .fn()
          .mockResolvedValue({
            status: RefundStatus.Pending,
          });

        await expect(
          MusigSigner.refundNonEligibilityReason(swap),
        ).resolves.toEqual(RefundRejectionReason.RefundNotConfirmed);
      });
    });
  });
});
