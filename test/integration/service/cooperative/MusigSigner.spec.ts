import AsyncLock from 'async-lock';
import { Transaction, address, crypto } from 'bitcoinjs-lib';
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
import { SwapTree } from 'boltz-core/dist/lib/consts/Types';
import { randomBytes } from 'crypto';
import { hashForWitnessV1, setup, tweakMusig, zkp } from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import Swap from '../../../../lib/db/models/Swap';
import ReverseSwapRepository from '../../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import Errors from '../../../../lib/service/Errors';
import MusigSigner from '../../../../lib/service/cooperative/MusigSigner';
import SwapNursery from '../../../../lib/swap/SwapNursery';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletManager, { Currency } from '../../../../lib/wallet/WalletManager';
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
  } as Currency;

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
    new Map<string, Currency>([['BTC', btcCurrency]]),
    walletManager,
    nursery,
  );

  beforeAll(async () => {
    await Promise.all([
      setup(),
      bitcoinClient.connect(),
      clnClient.connect(false),
      bitcoinLndClient.connect(false),
      bitcoinLndClient2.connect(false),
    ]);

    await bitcoinClient.generate(1);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    clnClient.disconnect();
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
  });

  test('should create refund signature for failed swaps', async () => {
    const claimKeys = ECPair.makeRandom();
    const refundKeys = ECPair.makeRandom();
    const preimage = randomBytes(32);

    const tree = swapTree(
      false,
      crypto.sha256(preimage),
      claimKeys.publicKey,
      refundKeys.publicKey,
      (await bitcoinClient.getBlockchainInfo()).blocks + 21,
    );

    const musig = new Musig(zkp, refundKeys, randomBytes(32), [
      claimKeys.publicKey,
      refundKeys.publicKey,
    ]);
    const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);

    const swapOutputScript = Scripts.p2trOutput(tweakedKey);

    const lockupTx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          address.fromOutputScript(swapOutputScript, Networks.bitcoinRegtest),
          100_000,
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
        await bitcoinClient.getNewAddress(),
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
      refundPublicKey: getHexString(refundKeys.publicKey),
      preimageHash: getHexString(crypto.sha256(preimage)),
      invoice: (await bitcoinLndClient2.addInvoice(123)).paymentRequest,
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
    });

    btcWallet.getKeysByIndex = jest.fn().mockReturnValue(claimKeys);

    const boltzPartialSig = await signer.signSwapRefund(
      'refundable',
      Buffer.from(musig.getPublicNonce()),
      refundTx.toBuffer(),
      0,
    );

    musig.aggregateNonces([[claimKeys.publicKey, boltzPartialSig.pubNonce]]);
    musig.initializeSession(await hashForWitnessV1(btcCurrency, refundTx, 0));
    musig.signPartial();
    musig.addPartial(claimKeys.publicKey, boltzPartialSig.signature);

    refundTx.setWitness(0, [musig.aggregatePartials()]);

    await bitcoinClient.sendRawTransaction(refundTx.toHex());
  });

  test('should throw when creating refund signature for swap that does not exist', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue(undefined);

    const id = 'notFound';
    await expect(
      signer.signSwapRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
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
        signer.signSwapRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND());
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
      signer.signSwapRefund(id, randomBytes(32), Buffer.alloc(0), 0),
    ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND());
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
        () => MusigSigner['hasNonFailedLightningPayment'](btcCurrency, swap),
        100,
      );

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      await expect(
        signer.signSwapRefund(
          'pendingPayment',
          Buffer.alloc(0),
          Buffer.alloc(0),
          0,
        ),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND());

      await bitcoinLndClient2.cancelHoldInvoice(preimageHash);
      await expect(payPromise).rejects.toEqual(expect.anything());
    },
  );

  test('should create claim signature for reverse swaps', async () => {
    const claimKeys = ECPair.makeRandom();
    const refundKeys = ECPair.makeRandom();
    const preimage = randomBytes(32);

    const tree = reverseSwapTree(
      false,
      crypto.sha256(preimage),
      claimKeys.publicKey,
      refundKeys.publicKey,
      (await bitcoinClient.getBlockchainInfo()).blocks + 21,
    );

    const musig = new Musig(zkp, claimKeys, randomBytes(32), [
      refundKeys.publicKey,
      claimKeys.publicKey,
    ]);
    const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);

    const swapOutputScript = Scripts.p2trOutput(tweakedKey);

    const lockupTx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          address.fromOutputScript(swapOutputScript, Networks.bitcoinRegtest),
          100_000,
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
        await bitcoinClient.getNewAddress(),
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
      claimPublicKey: getHexString(claimKeys.publicKey),
      preimageHash: getHexString(crypto.sha256(preimage)),
      redeemScript: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
    });

    btcWallet.getKeysByIndex = jest.fn().mockReturnValue(refundKeys);

    const boltzPartialSig = await signer.signReverseSwapClaim(
      'claimable',
      preimage,
      Buffer.from(musig.getPublicNonce()),
      claimTx.toBuffer(),
      0,
    );
    expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledTimes(1);
    expect(nursery.settleReverseSwapInvoice).toHaveBeenCalledWith(
      await ReverseSwapRepository.getReverseSwap({}),
      preimage,
    );

    musig.aggregateNonces([[refundKeys.publicKey, boltzPartialSig.pubNonce]]);
    musig.initializeSession(await hashForWitnessV1(btcCurrency, claimTx, 0));
    musig.signPartial();
    musig.addPartial(refundKeys.publicKey, boltzPartialSig.signature);

    claimTx.setWitness(0, [musig.aggregatePartials()]);

    await bitcoinClient.sendRawTransaction(claimTx.toHex());
  });

  test('should throw when creating claim signature for reverse swap that does not exist', async () => {
    ReverseSwapRepository.getReverseSwap = jest
      .fn()
      .mockResolvedValue(undefined);

    const id = 'notFound';
    await expect(
      signer.signReverseSwapClaim(
        id,
        Buffer.alloc(0),
        Buffer.alloc(0),
        Buffer.alloc(0),
        0,
      ),
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
        signer.signReverseSwapClaim(
          'nonClaimable',
          Buffer.alloc(0),
          Buffer.alloc(0),
          Buffer.alloc(0),
          0,
        ),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
    },
  );

  test('should throw creating claim signature for reverse swap with incorrect preimage', async () => {
    ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
      version: SwapVersion.Taproot,
      preimageHash: randomBytes(32),
      status: SwapUpdateEvent.TransactionConfirmed,
    });

    await expect(
      signer.signReverseSwapClaim(
        'invalidPreimage',
        randomBytes(32),
        Buffer.alloc(0),
        Buffer.alloc(0),
        0,
      ),
    ).rejects.toEqual(Errors.INCORRECT_PREIMAGE());
  });

  test('should throw when creating claim signature for legacy reverse swap', async () => {
    const id = 'id';
    ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
      id,
      version: SwapVersion.Legacy,
    });

    await expect(
      signer.signReverseSwapClaim(
        id,
        randomBytes(32),
        Buffer.alloc(0),
        Buffer.alloc(0),
        0,
      ),
    ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
  });

  test.each`
    vin
    ${-1}
    ${-23234}
    ${5}
    ${123}
  `(
    'should not create partial signature when vin ($vin) is out of bounds',
    async ({ vin }) => {
      const tx = await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          await bitcoinClient.getNewAddress(),
          100_000,
        ),
      );

      await expect(
        signer['createPartialSignature'](
          btcCurrency,
          {} as SwapTree,
          1,
          Buffer.alloc(0),
          Buffer.alloc(0),
          tx,
          vin,
        ),
      ).rejects.toEqual(Errors.INVALID_VIN());
    },
  );
});
