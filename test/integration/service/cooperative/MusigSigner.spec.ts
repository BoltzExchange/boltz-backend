import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { Transaction } from '@scure/btc-signer';
import bolt11 from 'bolt11';
import {
  Musig,
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
import {
  addressFromOutputScript,
  outputScriptFromAddress,
} from '../../../../lib/AddressUtils';
import { hashForWitnessV1, setup, tweakMusig } from '../../../../lib/Core';
import InstrumentedLock from '../../../../lib/InstrumentedLock';
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
import * as noderpc from '../../../../lib/proto/cln/node';
import Errors from '../../../../lib/service/Errors';
import MusigSigner, {
  RefundRejectionReason,
} from '../../../../lib/service/cooperative/MusigSigner';
import Sidecar from '../../../../lib/sidecar/Sidecar';
import type SwapNursery from '../../../../lib/swap/SwapNursery';
import type Wallet from '../../../../lib/wallet/Wallet';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import { regtest as bitcoinRegtest } from '../../../Networks';
import { waitForFunctionToBeTrue } from '../../../Utils';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  clnClient,
} from '../../Nodes';
import { sidecar, startSidecar } from '../../sidecar/Utils';

const makeKeys = () => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
  };
};

jest.mock('../../../../lib/db/repositories/ChainTipRepository');
jest.mock('../../../../lib/db/repositories/ReverseSwapRepository');

jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('MusigSigner', () => {
  let btcCurrency: Currency;

  const arkCurrency = {
    type: CurrencyType.Ark,
    arkNode: {},
  } as unknown as Currency;

  const btcWallet = {} as Wallet;
  const walletManager = {
    wallets: new Map<string, Wallet>([['BTC', btcWallet]]),
  } as WalletManager;

  const nursery = {
    lock: new InstrumentedLock('swapNursery'),
    settleReverseSwapInvoice: jest.fn(),
  } as any as SwapNursery;

  let signer: MusigSigner;

  beforeAll(async () => {
    await Promise.all([
      setup(),
      clnClient.connect(),
      bitcoinLndClient.connect(true),
      bitcoinLndClient2.connect(true),
      startSidecar(),
    ]);

    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );

    // Create btcCurrency after clients are connected so client.id is populated
    btcCurrency = {
      clnClient,
      symbol: 'BTC',
      chainClient: bitcoinClient,
      lndClients: new Map([[bitcoinLndClient.id, bitcoinLndClient]]),
      type: CurrencyType.BitcoinLike,
    } as unknown as Currency;

    await bitcoinClient.generate(1);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    signer = new MusigSigner(
      Logger.disabledLogger,
      new Map<string, any>([
        ['BTC', btcCurrency],
        ['Ark', arkCurrency],
        ['noChainClient', {}],
      ]),
      walletManager,
      nursery,
    );
  });

  afterAll(async () => {
    sidecar.disconnect();
    await Sidecar.stop();

    bitcoinClient.disconnect();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
  });

  describe('allowRefund', () => {
    test('should throw when allowing refund for a swap that does not exist', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue(null);

      const id = 'notFound';
      await expect(signer.allowRefund(id)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(id),
      );
    });

    test('should throw when swap has pending HTLCs', async () => {
      const preimageHash = randomBytes(32);
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        id: 'pendingHtlc',
        lightningCurrency: 'BTC',
        preimageHash: getHexString(preimageHash),
      });

      signer['hasPendingHtlcs'] = jest.fn().mockResolvedValue(true);

      await expect(signer.allowRefund('pendingHtlc')).rejects.toEqual(
        new Error('swap has pending HTLCs'),
      );

      expect(signer['hasPendingHtlcs']).toHaveBeenCalledTimes(1);
      expect(signer['hasPendingHtlcs']).toHaveBeenCalledWith(
        'BTC',
        preimageHash,
      );
    });
  });

  test('should create refund signature for failed swaps', async () => {
    const claimKeys = makeKeys();
    const refundKeys = makeKeys();
    const preimage = randomBytes(32);

    const tree = swapTree(
      false,
      Buffer.from(sha256(preimage)),
      Buffer.from(claimKeys.publicKey),
      Buffer.from(refundKeys.publicKey),
      (await bitcoinClient.getBlockchainInfo()).blocks + 21,
    );

    const musig = tweakMusig(
      CurrencyType.BitcoinLike,
      Musig.create(refundKeys.privateKey!, [
        claimKeys.publicKey,
        refundKeys.publicKey,
      ]),
      tree,
    );
    const tweakedKey = Buffer.from(musig.aggPubkey);

    const swapOutputScript = Buffer.from(Scripts.p2trOutput(tweakedKey));

    const lockupTx = Transaction.fromRaw(
      hexToBytes(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            addressFromOutputScript(
              CurrencyType.BitcoinLike,
              swapOutputScript,
              bitcoinRegtest,
            ),
            100_000,
            undefined,
            false,
            '',
          ),
        ),
      ),
    );

    const swapOutput = detectSwap(tweakedKey, lockupTx)!;
    expect(swapOutput).not.toBeUndefined();

    const refundTx = constructRefundTransaction(
      [
        {
          type: OutputType.Taproot,
          vout: swapOutput.vout,
          script: swapOutput.script!,
          amount: swapOutput.amount!,
          cooperative: true,
          privateKey: refundKeys.privateKey!,
          transactionId: lockupTx.id,
          swapTree: tree,
          internalKey: musig.internalKey,
        },
      ],
      outputScriptFromAddress(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getNewAddress(''),
        bitcoinRegtest,
      ),
      0,
      BigInt(300),
      false,
    );

    const refundableSwapId = 'refundable';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      id: refundableSwapId,
      keyIndex: 42,
      pair: 'BTC/BTC',
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.InvoiceFailedToPay,
      refundPublicKey: getHexString(Buffer.from(refundKeys.publicKey)),
      preimageHash: getHexString(Buffer.from(sha256(preimage))),
      invoice: (await bitcoinLndClient2.addInvoice(123)).paymentRequest,
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
    });
    SwapRepository.setRefundSignatureCreated = jest.fn();

    btcWallet.getKeysByIndex = jest.fn().mockReturnValue(claimKeys);

    const withNonce = musig
      .message(await hashForWitnessV1(btcCurrency, refundTx, 0))
      .generateNonce();

    const boltzPartialSig = await signer.signRefund(
      refundableSwapId,
      Buffer.from(withNonce.publicNonce),
      Buffer.from(refundTx.toBytes(true, true)),
      0,
    );

    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(1);
    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(
      refundableSwapId,
    );

    const signed = withNonce
      .aggregateNonces([[claimKeys.publicKey, boltzPartialSig.pubNonce]])
      .initializeSession()
      .addPartial(claimKeys.publicKey, boltzPartialSig.signature)
      .signPartial();

    refundTx.updateInput(
      0,
      { finalScriptWitness: [signed.aggregatePartials()] },
      true,
    );

    await bitcoinClient.sendRawTransaction(refundTx.hex);
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
      const claimKeys = makeKeys();
      const refundKeys = makeKeys();
      const preimage = randomBytes(32);

      const tree = reverseSwapTree(
        false,
        Buffer.from(sha256(preimage)),
        Buffer.from(claimKeys.publicKey),
        Buffer.from(refundKeys.publicKey),
        (await bitcoinClient.getBlockchainInfo()).blocks + 21,
      );

      const musig = tweakMusig(
        CurrencyType.BitcoinLike,
        Musig.create(claimKeys.privateKey!, [
          refundKeys.publicKey,
          claimKeys.publicKey,
        ]),
        tree,
      );
      const tweakedKey = Buffer.from(musig.aggPubkey);

      const swapOutputScript = Buffer.from(Scripts.p2trOutput(tweakedKey));

      const lockupTx = Transaction.fromRaw(
        hexToBytes(
          await bitcoinClient.getRawTransaction(
            await bitcoinClient.sendToAddress(
              addressFromOutputScript(
                CurrencyType.BitcoinLike,
                swapOutputScript,
                bitcoinRegtest,
              ),
              100_000,
              undefined,
              false,
              '',
            ),
          ),
        ),
      );

      const swapOutput = detectSwap(tweakedKey, lockupTx)!;
      expect(swapOutput).not.toBeUndefined();

      const claimTx = constructClaimTransaction(
        [
          {
            type: OutputType.Taproot,
            vout: swapOutput.vout,
            script: swapOutput.script!,
            amount: swapOutput.amount!,
            preimage,
            cooperative: true,
            privateKey: refundKeys.privateKey!,
            transactionId: lockupTx.id,
            swapTree: tree,
            internalKey: musig.internalKey,
          },
        ],
        outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          await bitcoinClient.getNewAddress(''),
          bitcoinRegtest,
        ),
        BigInt(300),
        false,
      );

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        keyIndex: 42,
        pair: 'BTC/BTC',
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionConfirmed,
        claimPublicKey: getHexString(Buffer.from(claimKeys.publicKey)),
        preimageHash: getHexString(Buffer.from(sha256(preimage))),
        redeemScript: JSON.stringify(
          SwapTreeSerializer.serializeSwapTree(tree),
        ),
      });
      WrappedSwapRepository.setPreimage = jest.fn();

      btcWallet.getKeysByIndex = jest.fn().mockReturnValue(refundKeys);

      const withNonce = musig
        .message(await hashForWitnessV1(btcCurrency, claimTx, 0))
        .generateNonce();

      const boltzPartialSig = await signer.signReverseSwapClaim(
        'claimable',
        preimage,
        {
          index: 0,
          rawTransaction: Buffer.from(claimTx.toBytes(true, true)),
          theirNonce: Buffer.from(withNonce.publicNonce),
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

      const signed = withNonce
        .aggregateNonces([[refundKeys.publicKey, boltzPartialSig!.pubNonce]])
        .initializeSession()
        .addPartial(refundKeys.publicKey, boltzPartialSig!.signature)
        .signPartial();

      claimTx.updateInput(
        0,
        { finalScriptWitness: [signed.aggregatePartials()] },
        true,
      );

      await bitcoinClient.sendRawTransaction(claimTx.hex);
    });

    test('should just settle the swap when there is no transaction to sign', async () => {
      const preimage = randomBytes(32);
      const swap = {
        id: 'claimable',
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionConfirmed,
        preimageHash: getHexString(Buffer.from(sha256(preimage))),
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
          preimageHash: getHexString(Buffer.from(sha256(preimage))),
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

        const payRequest = noderpc.PayRequest.create({
          bolt11: invoice,
        });
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
