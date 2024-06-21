import { BIP32Factory } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import { Transaction, crypto } from 'bitcoinjs-lib';
import {
  Musig,
  Networks,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  detectSwap,
  swapTree,
} from 'boltz-core';
import { p2trOutput } from 'boltz-core/dist/lib/swap/Scripts';
import { randomBytes } from 'crypto';
import * as ecc from 'tiny-secp256k1';
import {
  calculateTransactionFee,
  createMusig,
  hashForWitnessV1,
  setup,
  tweakMusig,
  zkp,
} from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import Logger from '../../../../lib/Logger';
import { generateSwapId } from '../../../../lib/Utils';
import {
  CurrencyType,
  SwapType,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Swap from '../../../../lib/db/models/Swap';
import Errors from '../../../../lib/service/Errors';
import CoopSignerBase, {
  SwapToClaim,
} from '../../../../lib/service/cooperative/CoopSignerBase';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletManager, { Currency } from '../../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import { bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

class CoopSigner extends CoopSignerBase<Swap, NonNullable<unknown>> {
  constructor(walletManager: WalletManager, swapOutputType: SwapOutputType) {
    super(Logger.disabledLogger, walletManager, swapOutputType);
  }
}

describe('CoopSignerBase', () => {
  const bip32 = BIP32Factory(ecc);

  const wallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
  );
  const walletManager = {
    wallets: new Map<string, Wallet>([['BTC', wallet]]),
  } as WalletManager;
  const signer = new CoopSigner(
    walletManager,
    new SwapOutputType(OutputType.Bech32),
  );

  const btcCurrency = {
    symbol: 'BTC',
    chainClient: bitcoinClient,
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  const createSwapToClaim = async () => {
    const keyIndex = 32;
    const preimage = randomBytes(32);
    const refundKeys = ECPair.makeRandom();
    const timeoutBlockHeight = 123;
    const tree = swapTree(
      false,
      crypto.sha256(preimage),
      wallet.getKeysByIndex(keyIndex).publicKey,
      refundKeys.publicKey,
      timeoutBlockHeight,
    );
    const tweakedKey = TaprootUtils.tweakMusig(
      createMusig(wallet.getKeysByIndex(keyIndex)!, refundKeys.publicKey),
      tree.tree,
    );

    const txId = await bitcoinClient.sendToAddress(
      wallet.encodeAddress(p2trOutput(tweakedKey)),
      100_000,
      undefined,
      false,
      '',
    );

    return {
      tree,
      keyIndex,
      refundKeys,
      toClaim: {
        swap: {
          keyIndex,
          type: SwapType.Submarine,
          lockupTransactionId: txId,
          version: SwapVersion.Taproot,
          theirPublicKey: refundKeys.publicKey,
          id: generateSwapId(SwapVersion.Taproot),
          redeemScript: JSON.stringify(
            SwapTreeSerializer.serializeSwapTree(tree),
          ),
          lockupTransactionVout: detectSwap(
            tweakedKey,
            Transaction.fromHex(await bitcoinClient.getRawTransaction(txId)),
          )!.vout,
        },
      } as unknown as SwapToClaim<Swap>,
    };
  };

  beforeAll(async () => {
    await Promise.all([setup(), bitcoinClient.connect()]);
    await bitcoinClient.generate(1);

    wallet.initKeyProvider(
      Networks.bitcoinRegtest,
      'm/0/0',
      0,
      bip32.fromSeed(
        mnemonicToSeedSync(
          'miracle tower paper teach stomach black exile discover paddle country around survey',
        ),
      ),
    );
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  describe('createCoopDetails', () => {
    test('should create cooperative details', async () => {
      const { toClaim } = await createSwapToClaim();

      const details = await signer['createCoopDetails'](btcCurrency, toClaim);
      expect(toClaim.cooperative).not.toBeUndefined();
      expect(details.publicKey).toEqual(
        wallet.getKeysByIndex(toClaim.swap.keyIndex!).publicKey,
      );
      expect(details.pubNonce).toEqual(
        Buffer.from(toClaim.cooperative!.musig.getPublicNonce()),
      );
      expect(details.transactionHash).toEqual(
        await hashForWitnessV1(
          btcCurrency,
          toClaim.cooperative!.transaction,
          0,
        ),
      );

      const addressInfo = await bitcoinClient.getAddressInfo(
        toClaim.cooperative!.sweepAddress,
      );
      expect(addressInfo.ismine).toEqual(true);
      expect(addressInfo.labels).toEqual([
        `Cooperative claim for Submarine Swap ${toClaim.swap.id}`,
      ]);

      expect(toClaim.cooperative!.transaction.outs).toHaveLength(1);
      expect(
        wallet.encodeAddress(toClaim.cooperative!.transaction.outs[0].script),
      ).toEqual(toClaim.cooperative!.sweepAddress);
    });

    test('should use same address when recreating cooperative details', async () => {
      const { toClaim } = await createSwapToClaim();

      await signer['createCoopDetails'](btcCurrency, toClaim);
      expect(toClaim.cooperative).not.toBeUndefined();
      const oldCooperative = toClaim.cooperative!;

      await signer['createCoopDetails'](btcCurrency, toClaim);
      expect(toClaim.cooperative).not.toBeUndefined();
      expect(toClaim.cooperative!.musig).not.toEqual(oldCooperative.musig);
      expect(toClaim.cooperative!.sweepAddress).toEqual(
        oldCooperative.sweepAddress,
      );
    });
  });

  describe('broadcastCooperativeTransaction', () => {
    test('should broadcast cooperative transactions', async () => {
      const { toClaim, refundKeys, keyIndex, tree } = await createSwapToClaim();
      const coopDetails = await signer['createCoopDetails'](
        btcCurrency,
        toClaim,
      );
      const musig = new Musig(zkp, refundKeys, randomBytes(32), [
        wallet.getKeysByIndex(keyIndex)!.publicKey,
        refundKeys.publicKey,
      ]);
      tweakMusig(CurrencyType.BitcoinLike, musig, tree);
      musig.aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]]);
      musig.initializeSession(coopDetails.transactionHash);

      const res = await signer['broadcastCooperativeTransaction'](
        toClaim.swap,
        btcCurrency,
        toClaim.cooperative!.musig,
        toClaim.cooperative!.transaction,
        Buffer.from(musig.getPublicNonce()),
        Buffer.from(musig.signPartial()),
      );

      // Make sure the transaction has already been broadcast
      await expect(
        bitcoinClient.getRawTransaction(res.transaction.getId()),
      ).resolves.toEqual(res.transaction.toHex());

      expect(res.transaction.ins).toHaveLength(1);
      expect(res.transaction.ins[0].witness).toHaveLength(1);
      expect(res.transaction.ins[0].witness[0]).toHaveLength(64);
      expect(res.fee).toEqual(
        await calculateTransactionFee(bitcoinClient, res.transaction),
      );
    });

    test('should throw when broadcasting cooperative transaction with invalid partial signature', async () => {
      const { toClaim, refundKeys, keyIndex, tree } = await createSwapToClaim();
      const coopDetails = await signer['createCoopDetails'](
        btcCurrency,
        toClaim,
      );
      const musig = new Musig(zkp, refundKeys, randomBytes(32), [
        wallet.getKeysByIndex(keyIndex)!.publicKey,
        refundKeys.publicKey,
      ]);
      tweakMusig(CurrencyType.BitcoinLike, musig, tree);
      musig.aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]]);
      musig.initializeSession(randomBytes(32));

      await expect(
        signer['broadcastCooperativeTransaction'](
          toClaim.swap,
          btcCurrency,
          toClaim.cooperative!.musig,
          toClaim.cooperative!.transaction,
          Buffer.from(musig.getPublicNonce()),
          Buffer.from(musig.signPartial()),
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
    });
  });
});
