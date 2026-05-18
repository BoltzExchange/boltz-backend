import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Transaction } from '@scure/btc-signer';
import {
  Musig,
  OutputType,
  Scripts,
  SwapTreeSerializer,
  TaprootUtils,
  detectSwap,
  swapTree,
} from 'boltz-core';
import { randomBytes } from 'crypto';
import {
  calculateTransactionFee,
  createMusig,
  hashForWitnessV1,
  setup,
  tweakMusig,
} from '../../../../lib/Core';
import Logger from '../../../../lib/Logger';
import { TxView } from '../../../../lib/TxView';
import { generateSwapId } from '../../../../lib/Utils';
import {
  CurrencyType,
  SwapType,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import type Swap from '../../../../lib/db/models/Swap';
import Errors from '../../../../lib/service/Errors';
import type { SwapToClaim } from '../../../../lib/service/cooperative/CoopSignerBase';
import CoopSignerBase from '../../../../lib/service/cooperative/CoopSignerBase';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import Wallet from '../../../../lib/wallet/Wallet';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import { regtest as bitcoinRegtest } from '../../../Networks';
import { bitcoinClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

class CoopSigner extends CoopSignerBase<NonNullable<unknown>> {
  constructor(walletManager: WalletManager, swapOutputType: SwapOutputType) {
    super(Logger.disabledLogger, walletManager, swapOutputType);
  }
}

const makeKeys = () => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
  };
};

describe('CoopSignerBase', () => {
  const wallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    new CoreWalletProvider(
      Logger.disabledLogger,
      bitcoinClient,
      bitcoinRegtest,
    ),
    bitcoinRegtest,
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
    const refundKeys = makeKeys();
    const timeoutBlockHeight = 123;
    const tree = swapTree(
      false,
      Buffer.from(sha256(preimage)),
      wallet.getKeysByIndex(keyIndex).publicKey,
      refundKeys.publicKey,
      timeoutBlockHeight,
    );
    const tweakedKey = Buffer.from(
      TaprootUtils.tweakMusig(
        createMusig(wallet.getKeysByIndex(keyIndex)!, refundKeys.publicKey),
        tree.tree,
      ).aggPubkey,
    );

    const txId = await bitcoinClient.sendToAddress(
      wallet.encodeAddress(Buffer.from(Scripts.p2trOutput(tweakedKey))),
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
            Transaction.fromRaw(
              hexToBytes(await bitcoinClient.getRawTransaction(txId)),
            ),
          )!.vout,
        },
      } as unknown as SwapToClaim<Swap>,
    };
  };

  beforeAll(async () => {
    await setup();
    await bitcoinClient.generate(1);

    wallet.initKeyProvider(
      'm/0/0',
      HDKey.fromMasterSeed(
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
        Buffer.from(toClaim.cooperative!.musig.publicNonce),
      );
      const tx = Transaction.fromRaw(
        hexToBytes(TxView.of(toClaim.cooperative!.transaction).hex),
      );
      expect(details.transactionHash).toEqual(
        await hashForWitnessV1(btcCurrency, tx, 0),
      );

      const addressInfo = await bitcoinClient.getAddressInfo(
        toClaim.cooperative!.sweepAddress,
      );
      expect(addressInfo.ismine).toEqual(true);
      expect(addressInfo.labels).toEqual([
        `Cooperative claim for Submarine Swap ${toClaim.swap.id}`,
      ]);

      expect(tx.outputsLength).toEqual(1);
      expect(
        wallet.encodeAddress(Buffer.from(tx.getOutput(0).script!)),
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
      const tweakedRemote = tweakMusig(
        CurrencyType.BitcoinLike,
        Musig.create(refundKeys.privateKey!, [
          wallet.getKeysByIndex(keyIndex)!.publicKey,
          refundKeys.publicKey,
        ]),
        tree,
      );
      const remoteWithNonce = tweakedRemote
        .message(coopDetails.transactionHash)
        .generateNonce();
      const remoteSession = remoteWithNonce
        .aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]])
        .initializeSession();
      const remoteSigned = remoteSession.signPartial();

      const res = await signer['broadcastCooperativeTransaction'](
        toClaim.swap,
        btcCurrency,
        toClaim.cooperative!.musig,
        toClaim.cooperative!.transaction,
        Buffer.from(remoteWithNonce.publicNonce),
        Buffer.from(remoteSigned.ourPartialSignature),
      );

      // Make sure the transaction has already been broadcast
      await expect(
        bitcoinClient.getRawTransaction(TxView.of(res.transaction).id),
      ).resolves.toEqual(TxView.of(res.transaction).hex);

      const broadcastTx = Transaction.fromRaw(
        hexToBytes(TxView.of(res.transaction).hex),
      );
      expect(broadcastTx.inputsLength).toEqual(1);
      const witness = broadcastTx.getInput(0).finalScriptWitness;
      expect(witness).toHaveLength(1);
      expect(witness![0]).toHaveLength(64);
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
      const tweakedRemote = tweakMusig(
        CurrencyType.BitcoinLike,
        Musig.create(refundKeys.privateKey!, [
          wallet.getKeysByIndex(keyIndex)!.publicKey,
          refundKeys.publicKey,
        ]),
        tree,
      );
      const remoteWithNonce = tweakedRemote
        .message(randomBytes(32))
        .generateNonce();
      const remoteSession = remoteWithNonce
        .aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]])
        .initializeSession();
      const remoteSigned = remoteSession.signPartial();

      await expect(
        signer['broadcastCooperativeTransaction'](
          toClaim.swap,
          btcCurrency,
          toClaim.cooperative!.musig,
          toClaim.cooperative!.transaction,
          Buffer.from(remoteWithNonce.publicNonce),
          Buffer.from(remoteSigned.ourPartialSignature),
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
    });
  });
});
