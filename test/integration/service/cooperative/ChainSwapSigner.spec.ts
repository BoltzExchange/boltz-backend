import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import type { Transaction } from '@scure/btc-signer';
import {
  Musig,
  OutputType,
  Scripts,
  SwapTreeSerializer,
  constructRefundTransaction,
  detectSwap,
  swapTree,
} from 'boltz-core';
import {
  Networks as LiquidNetworks,
  constructClaimTransaction as liquidConstructClaimTransaction,
} from 'boltz-core/liquid';
import { randomBytes } from 'crypto';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import {
  hashForWitnessV1,
  parseTransaction,
  setup,
  tweakMusig,
} from '../../../../lib/Core';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import ArkClient from '../../../../lib/chain/ArkClient';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import type { ChainSwapInfo } from '../../../../lib/db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../../lib/db/repositories/RefundTransactionRepository';
import WrappedSwapRepository from '../../../../lib/db/repositories/WrappedSwapRepository';
import { Signer } from '../../../../lib/proto/boltzrpc';
import Errors from '../../../../lib/service/Errors';
import SignerControlRegistry from '../../../../lib/service/SignerControlRegistry';
import ChainSwapSigner from '../../../../lib/service/cooperative/ChainSwapSigner';
import { RefundRejectionReason } from '../../../../lib/service/cooperative/MusigSigner';
import * as Utils from '../../../../lib/service/cooperative/Utils';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import { slip77FromSeed } from '../../../../lib/wallet/Slip77';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletLiquid from '../../../../lib/wallet/WalletLiquid';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import ElementsWalletProvider from '../../../../lib/wallet/providers/ElementsWalletProvider';
import { regtest as bitcoinRegtest } from '../../../Networks';
import { bitcoinClient, elementsClient } from '../../Nodes';
import { sidecar } from '../../sidecar/Utils';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

const mnemonic =
  'miracle tower paper teach stomach black exile discover paddle country around survey';

const makeKeys = () => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
  };
};

describe('ChainSwapSigner', () => {
  const btcCurrency = {
    symbol: 'BTC',
    chainClient: bitcoinClient,
    type: CurrencyType.BitcoinLike,
    network: bitcoinRegtest,
  } as unknown as Currency;
  const liquidCurrency = {
    symbol: 'L-BTC',
    type: CurrencyType.Liquid,
    chainClient: elementsClient,
    network: LiquidNetworks.liquidRegtest,
  } as unknown as Currency;

  const btcWallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    new CoreWalletProvider(
      Logger.disabledLogger,
      bitcoinClient,
      bitcoinRegtest,
    ),
    bitcoinRegtest,
  );
  const liquidWallet = new WalletLiquid(
    Logger.disabledLogger,
    new ElementsWalletProvider(Logger.disabledLogger, elementsClient, sidecar),
    slip77FromSeed(mnemonicToSeedSync(mnemonic)),
    LiquidNetworks.liquidRegtest,
    sidecar,
  );

  const walletManager = {
    wallets: new Map<string, Wallet>([
      [btcWallet.symbol, btcWallet],
      [liquidWallet.symbol, liquidWallet],
      ['RBTC', { type: CurrencyType.Ether } as unknown as Wallet],
    ]),
  } as WalletManager;

  let signer: ChainSwapSigner;
  let signerControlRegistry: SignerControlRegistry;

  beforeAll(async () => {
    await setup();
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    const initWallet = (w: Wallet) => {
      w.initKeyProvider(
        'm/0/0',
        HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic)),
      );
    };

    initWallet(btcWallet);
    initWallet(liquidWallet);
  });

  beforeEach(() => {
    signerControlRegistry = SignerControlRegistry.getInstance();
    (signerControlRegistry as any)['disabledSigners'].clear();
    (signerControlRegistry as any)['repository'] = undefined;
    signer = new ChainSwapSigner(
      Logger.disabledLogger,
      new Map<string, Currency>([
        [btcCurrency.symbol, btcCurrency],
        [liquidCurrency.symbol, liquidCurrency],
      ]),
      walletManager,
      new SwapOutputType(OutputType.Bech32),
    );
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  const createOutputs = async () => {
    const preimage = randomBytes(32);

    const createOutput = async <T extends Transaction | LiquidTransaction>(
      currency: Currency,
      keyIndex: number,
      wallet: Wallet,
    ) => {
      const timeoutBlockHeight = 123;
      const theirKeys = makeKeys();
      const tree = swapTree(
        currency.type === CurrencyType.Liquid,
        Buffer.from(sha256(preimage)),
        wallet.getKeysByIndex(keyIndex).publicKey,
        Buffer.from(theirKeys.publicKey),
        timeoutBlockHeight,
      );

      const musig = tweakMusig(
        currency.type,
        Musig.create(theirKeys.privateKey!, [
          wallet.getKeysByIndex(keyIndex).publicKey,
          Buffer.from(theirKeys.publicKey),
        ]),
        tree,
      );
      const tweakedKey = Buffer.from(musig.aggPubkey);

      const lockupScript = Buffer.from(Scripts.p2trOutput(tweakedKey));
      const lockupTx = parseTransaction<T>(
        currency.type,
        await currency.chainClient!.getRawTransaction(
          await currency.chainClient!.sendToAddress(
            await wallet.encodeAddress(lockupScript),
            100_000,
            undefined,
            false,
            '',
          ),
        ),
      );
      const swapOutput = detectSwap<T>(tweakedKey, lockupTx)!;
      expect(swapOutput).not.toBeUndefined();

      return {
        tree,
        musig,
        keyIndex,
        lockupTx,
        theirKeys,
        swapOutput,
        timeoutBlockHeight,
        blindingPrivateKey:
          currency.type === CurrencyType.Liquid
            ? liquidWallet.deriveBlindingKeyFromScript(lockupScript).privateKey!
            : undefined,
      };
    };

    const lockupDetails = await createOutput<Transaction>(
      btcCurrency,
      21,
      btcWallet,
    );
    const claimDetails = await createOutput<LiquidTransaction>(
      liquidCurrency,
      42,
      liquidWallet,
    );

    return {
      preimage,
      claimDetails,
      lockupDetails,
      chainSwapInfo: {
        id: 'asdf',
        type: SwapType.Chain,
        status: 'swap.expired',
        version: SwapVersion.Taproot,
        preimageHash: getHexString(Buffer.from(sha256(preimage))),
        receivingData: {
          symbol: 'BTC',
          keyIndex: lockupDetails.keyIndex,
          transactionVout: lockupDetails.swapOutput.vout,
          lockupTransactionId: lockupDetails.lockupTx.id,
          timeoutBlockHeight: lockupDetails.timeoutBlockHeight,
          theirPublicKey: getHexString(
            Buffer.from(lockupDetails.theirKeys.publicKey),
          ),
          swapTree: JSON.stringify(
            SwapTreeSerializer.serializeSwapTree(lockupDetails.tree),
          ),
        },
        sendingData: {
          symbol: 'L-BTC',
          keyIndex: claimDetails.keyIndex,
          transactionVout: claimDetails.swapOutput.vout,
          lockupTransactionId: claimDetails.lockupTx.getId(),
          timeoutBlockHeight: claimDetails.timeoutBlockHeight,
          theirPublicKey: getHexString(
            Buffer.from(claimDetails.theirKeys.publicKey),
          ),
          swapTree: JSON.stringify(
            SwapTreeSerializer.serializeSwapTree(claimDetails.tree),
          ),
        },
      } as unknown as ChainSwapInfo,
    };
  };

  test('should fetch claimable swaps on init', async () => {
    const swaps = [
      {
        id: '1',
        receivingData: {
          symbol: 'BTC',
        },
      },
      {
        id: '2',
        receivingData: {
          symbol: 'BTC',
        },
      },
    ];
    ChainSwapRepository.getChainSwaps = jest.fn().mockResolvedValue(swaps);

    await signer.init();
    expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledTimes(1);
    expect(ChainSwapRepository.getChainSwaps).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionServerMempool,
          SwapUpdateEvent.TransactionServerConfirmed,
        ],
      },
    });

    expect(signer['swapsToClaim'].size).toEqual(2);
    expect(signer['swapsToClaim'].has(swaps[0].id)).toEqual(true);
    expect(signer['swapsToClaim'].has(swaps[1].id)).toEqual(true);
  });

  describe('signRefund', () => {
    test('should sign refunds for swaps', async () => {
      RefundTransactionRepository.getTransactionForSwap = jest
        .fn()
        .mockResolvedValue(null);

      const { lockupDetails, chainSwapInfo } = await createOutputs();

      const refundTx = constructRefundTransaction(
        [
          {
            type: OutputType.Taproot,
            vout: lockupDetails.swapOutput.vout,
            script: lockupDetails.swapOutput.script!,
            amount: lockupDetails.swapOutput.amount!,
            cooperative: true,
            privateKey: lockupDetails.theirKeys.privateKey!,
            transactionId: lockupDetails.lockupTx.id,
            swapTree: lockupDetails.tree,
            internalKey: lockupDetails.musig.internalKey,
          },
        ],
        await btcWallet.decodeAddress(await bitcoinClient.getNewAddress('')),
        chainSwapInfo.receivingData.timeoutBlockHeight,
        BigInt(200),
      );

      ChainSwapRepository.setRefundSignatureCreated = jest.fn();
      ChainSwapRepository.getChainSwap = jest
        .fn()
        .mockResolvedValue(chainSwapInfo);

      const withNonce = lockupDetails.musig
        .message(await hashForWitnessV1(btcCurrency, refundTx, 0))
        .generateNonce();

      const partialSignature = await signer.signRefund(
        'asdf',
        Buffer.from(withNonce.publicNonce),
        Buffer.from(refundTx.toBytes(true, true)),
        0,
      );

      const counterpartyKey = btcWallet.getKeysByIndex(
        chainSwapInfo.receivingData.keyIndex!,
      ).publicKey;
      const signed = withNonce
        .aggregateNonces([[counterpartyKey, partialSignature.pubNonce]])
        .initializeSession()
        .addPartial(counterpartyKey, partialSignature.signature)
        .signPartial();

      refundTx.updateInput(
        0,
        { finalScriptWitness: [signed.aggregatePartials()] },
        true,
      );

      await bitcoinClient.sendRawTransaction(refundTx.hex);

      expect(
        ChainSwapRepository.setRefundSignatureCreated,
      ).toHaveBeenCalledTimes(1);
      expect(
        ChainSwapRepository.setRefundSignatureCreated,
      ).toHaveBeenCalledWith(chainSwapInfo.id);
    });

    test('should throw when signing refund for swap that could not be found', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(undefined);
      const id = 'swap';

      await expect(
        signer.signRefund(id, Buffer.alloc(0), Buffer.alloc(0), 0),
      ).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));
    });

    test('should throw when signing refund on not UTXO based chain', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        receivingData: {
          symbol: 'RBTC',
        },
      });

      await expect(
        signer.signRefund('swap', Buffer.alloc(0), Buffer.alloc(0), 0),
      ).rejects.toEqual(Errors.CURRENCY_NOT_UTXO_BASED());
    });

    test('should throw when cooperative signatures are disabled', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id: 'asdf',
        version: SwapVersion.Taproot,
        receivingData: {
          symbol: 'BTC',
        },
      });

      await signerControlRegistry.disableSigners([
        Signer.SIGNER_CHAIN_REFUND_COOPERATIVE,
      ]);

      await expect(
        signer.signRefund('asdf', Buffer.alloc(0), Buffer.alloc(0), 0),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'cooperative signatures are disabled',
        ),
      );
    });

    test.each`
      status
      ${SwapUpdateEvent.SwapCreated}
      ${SwapUpdateEvent.TransactionMempool}
      ${SwapUpdateEvent.TransactionServerConfirmed}
    `(
      'should throw when signing refund for swap with status ($status) that is not eligible',
      async ({ status }) => {
        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
          status,
          id: 'asdf',
          version: SwapVersion.Taproot,
          receivingData: {
            symbol: 'BTC',
          },
        });

        await expect(
          signer.signRefund('asdf', Buffer.alloc(0), Buffer.alloc(0), 0),
        ).rejects.toEqual(
          Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
            RefundRejectionReason.StatusNotEligible,
          ),
        );
      },
    );
  });

  describe('signRefundArk', () => {
    const arkCurrency = {
      symbol: ArkClient.symbol,
      type: CurrencyType.Ark,
      arkNode: {
        signTransaction: jest.fn(),
      },
    };

    let signerWithArk: ChainSwapSigner;

    beforeEach(() => {
      signerWithArk = new ChainSwapSigner(
        Logger.disabledLogger,
        new Map<string, Currency>([
          [btcCurrency.symbol, btcCurrency],
          [liquidCurrency.symbol, liquidCurrency],
          [arkCurrency.symbol, arkCurrency as unknown as Currency],
        ]),
        walletManager,
        new SwapOutputType(OutputType.Bech32),
      );
    });

    test.each([[null], [undefined]])(
      'should throw when swap cannot be found (%s)',
      async (swap) => {
        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(swap);

        const id = 'notFound';
        await expect(
          signerWithArk.signRefundArk(id, 'transaction', 'checkpoint'),
        ).rejects.toEqual(Errors.SWAP_NOT_FOUND(id));

        expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
          id,
        });
      },
    );

    test('should throw when currency is not Ark', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        receivingData: {
          symbol: 'BTC',
        },
      });

      const id = 'notArk';
      await expect(
        signerWithArk.signRefundArk(id, 'transaction', 'checkpoint'),
      ).rejects.toEqual(new Error('currency is not Ark'));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
    });

    test('should throw when cooperative signatures are disabled', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id: 'asdf',
        version: SwapVersion.Taproot,
        receivingData: {
          symbol: 'ARK',
        },
      });

      await signerControlRegistry.disableSigners([
        Signer.SIGNER_CHAIN_REFUND_COOPERATIVE,
      ]);

      await expect(
        signerWithArk.signRefundArk('asdf', 'transaction', 'checkpoint'),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'cooperative signatures are disabled',
        ),
      );
    });

    test('should validate eligibility', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        receivingData: {
          symbol: 'ARK',
        },
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.SwapCreated,
      });

      const id = 'eligible';
      await expect(
        signerWithArk.signRefundArk(id, 'transaction', 'checkpoint'),
      ).rejects.toEqual(
        Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          RefundRejectionReason.StatusNotEligible,
        ),
      );

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({ id });
    });

    test('should throw when checkArkTransaction fails', async () => {
      const txId = randomBytes(32);
      const vout = 21;

      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        pair: 'ARK/BTC',
        receivingData: {
          symbol: 'ARK',
          transactionId: getHexString(txId),
          transactionVout: vout,
        },
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionLockupFailed,
      });

      const checkArkTransactionSpy = jest
        .spyOn(Utils, 'checkArkTransaction')
        .mockImplementation(() => {
          throw new Error('transaction validation failed');
        });

      await expect(
        signerWithArk.signRefundArk('eligible', 'transaction', 'checkpoint'),
      ).rejects.toEqual(new Error('transaction validation failed'));

      expect(checkArkTransactionSpy).toHaveBeenCalledTimes(1);
      expect(checkArkTransactionSpy).toHaveBeenCalledWith(
        'transaction',
        'checkpoint',
        getHexString(txId),
        vout,
      );

      checkArkTransactionSpy.mockRestore();
    });

    test('should sign refunds', async () => {
      const txId = randomBytes(32);
      const vout = 21;
      const swapId = 'eligible';

      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id: swapId,
        pair: 'ARK/BTC',
        receivingData: {
          symbol: 'ARK',
          transactionId: getHexString(txId),
          transactionVout: vout,
        },
        version: SwapVersion.Taproot,
        status: SwapUpdateEvent.TransactionLockupFailed,
      });

      ChainSwapRepository.setRefundSignatureCreated = jest.fn();

      const checkArkTransactionSpy = jest
        .spyOn(Utils, 'checkArkTransaction')
        .mockImplementation(() => {});

      const signedRefundTx = 'signedRefundTx';
      const signedCheckpoint = 'signedCheckpoint';
      arkCurrency.arkNode!.signTransaction = jest
        .fn()
        .mockResolvedValueOnce(signedRefundTx)
        .mockResolvedValueOnce(signedCheckpoint);

      const inputRefundTx = 'transaction';
      const inputCheckpoint = 'checkpoint';

      await expect(
        signerWithArk.signRefundArk(swapId, inputRefundTx, inputCheckpoint),
      ).resolves.toEqual({
        transaction: signedRefundTx,
        checkpoint: signedCheckpoint,
      });

      expect(
        ChainSwapRepository.setRefundSignatureCreated,
      ).toHaveBeenCalledTimes(1);
      expect(
        ChainSwapRepository.setRefundSignatureCreated,
      ).toHaveBeenCalledWith(swapId);

      expect(checkArkTransactionSpy).toHaveBeenCalledTimes(1);
      expect(checkArkTransactionSpy).toHaveBeenCalledWith(
        inputRefundTx,
        inputCheckpoint,
        getHexString(txId),
        vout,
      );

      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenCalledTimes(2);
      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenNthCalledWith(
        1,
        inputRefundTx,
      );
      expect(arkCurrency.arkNode!.signTransaction).toHaveBeenNthCalledWith(
        2,
        inputCheckpoint,
      );

      checkArkTransactionSpy.mockRestore();
    });
  });

  describe('registerForClaim', () => {
    test('should register swap for claiming', async () => {
      const swap = {
        id: '123',
        some: 'data',
        receivingData: {
          symbol: 'BTC',
        },
      } as unknown as ChainSwapInfo;

      await signer.registerForClaim(swap);
      expect(signer['swapsToClaim'].size).toEqual(1);
      expect(signer['swapsToClaim'].has(swap.id)).toEqual(true);
      expect(signer['swapsToClaim'].get(swap.id)).toEqual({ swap });
    });

    test('should not overwrite swaps when registering for claim', async () => {
      const swap = {
        id: '123',
        some: 'data',
        receivingData: {
          symbol: 'BTC',
        },
      } as unknown as ChainSwapInfo;

      await signer.registerForClaim(swap);
      expect(signer['swapsToClaim'].size).toEqual(1);
      expect(signer['swapsToClaim'].get(swap.id)).toEqual({ swap });

      await signer.registerForClaim({
        id: swap.id,
        someOther: 'data ',
      } as unknown as ChainSwapInfo);
      expect(signer['swapsToClaim'].size).toEqual(1);
      expect(signer['swapsToClaim'].get(swap.id)).toEqual({ swap });
    });

    test('should not register for claim when swap is not cooperatively claimable', async () => {
      const swap = {
        id: '123',
        some: 'data',
        receivingData: {
          symbol: 'RBTC',
        },
      } as unknown as ChainSwapInfo;

      await signer.registerForClaim(swap);
      expect(signer['swapsToClaim'].size).toEqual(0);
    });
  });

  test('should remove swap from claimable', async () => {
    const swap = {
      id: '123',
      some: 'data',
      receivingData: {
        symbol: 'BTC',
      },
    } as unknown as ChainSwapInfo;

    await signer.registerForClaim(swap);
    expect(signer['swapsToClaim'].size).toEqual(1);
    expect(signer['swapsToClaim'].get(swap.id)).toEqual({ swap });

    await signer.removeFromClaimable(swap.id);
    expect(signer['swapsToClaim'].size).toEqual(0);
  });

  describe('getCooperativeDetails', () => {
    test('should get cooperative claim details for swaps', async () => {
      const { chainSwapInfo } = await createOutputs();

      await signer.registerForClaim(chainSwapInfo);
      const res = await signer.getCooperativeDetails(chainSwapInfo);

      expect(res.publicKey).toEqual(
        btcWallet.getKeysByIndex(chainSwapInfo.receivingData.keyIndex!)
          .publicKey,
      );
      expect(res.pubNonce).toEqual(
        Buffer.from(
          signer['swapsToClaim'].get(chainSwapInfo.id)!.cooperative!.musig
            .publicNonce,
        ),
      );
      expect(res.transactionHash).toEqual(
        await hashForWitnessV1(
          btcCurrency,
          signer['swapsToClaim'].get(chainSwapInfo.id)!.cooperative!
            .transaction,
          0,
        ),
      );
    });

    test('should throw when getting cooperative claim details for swap that is not registered', async () => {
      await expect(
        signer.getCooperativeDetails({
          id: 'notFound',
        } as unknown as ChainSwapInfo),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
    });

    test('should throw when server claim has already succeeded', async () => {
      await expect(
        signer.getCooperativeDetails({
          status: SwapUpdateEvent.TransactionClaimed,
        } as unknown as ChainSwapInfo),
      ).rejects.toEqual(Errors.SERVER_CLAIM_SUCCEEDED_ALREADY());
    });
  });

  describe('signClaim', () => {
    test('should create partial signature when we are able to claim', async () => {
      WrappedSwapRepository.setPreimage = jest
        .fn()
        .mockImplementation(async (swap) => swap);
      ChainSwapRepository.setClaimMinerFee = jest
        .fn()
        .mockImplementation(async (swap) => swap);

      const { chainSwapInfo, claimDetails, lockupDetails, preimage } =
        await createOutputs();

      await signer.registerForClaim(chainSwapInfo);
      const coopDetails = await signer.getCooperativeDetails(chainSwapInfo);

      const refundSigned = lockupDetails.musig
        .message(coopDetails.transactionHash)
        .generateNonce()
        .aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]])
        .initializeSession()
        .signPartial();

      const claimTx = liquidConstructClaimTransaction(
        [
          {
            ...claimDetails.swapOutput,
            type: OutputType.Taproot,
            preimage,
            cooperative: true,
            privateKey: claimDetails.theirKeys.privateKey!,
            transactionId: claimDetails.lockupTx.getId(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
            swapTree: claimDetails.tree,
            internalKey: claimDetails.musig.internalKey,
          },
        ],
        await liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        BigInt(200),
        false,
        LiquidNetworks.liquidRegtest,
      );

      const claimWithNonce = claimDetails.musig
        .message(await hashForWitnessV1(liquidCurrency, claimTx, 0))
        .generateNonce();

      expect.assertions(4);

      signer.once('claim', (swap) => {
        expect(swap).toEqual(chainSwapInfo);
      });

      const claimPartial = await signer.signClaim(
        chainSwapInfo,
        {
          index: 0,
          transaction: claimTx.toBuffer(),
          pubNonce: Buffer.from(claimWithNonce.publicNonce),
        },
        preimage,
        {
          pubNonce: Buffer.from(refundSigned.publicNonce),
          signature: Buffer.from(refundSigned.ourPartialSignature),
        },
      );
      expect(signer['swapsToClaim'].size).toEqual(0);

      const counterpartyKey = liquidWallet.getKeysByIndex(
        chainSwapInfo.sendingData.keyIndex!,
      ).publicKey;
      const claimSigned = claimWithNonce
        .aggregateNonces([[counterpartyKey, claimPartial.pubNonce]])
        .initializeSession()
        .addPartial(counterpartyKey, claimPartial.signature)
        .signPartial();

      claimTx.ins[0].witness = [Buffer.from(claimSigned.aggregatePartials())];

      await elementsClient.sendRawTransaction(claimTx.toHex());
    });

    test('should settle swap when it cannot be claimed cooperatively', async () => {
      WrappedSwapRepository.setPreimage = jest
        .fn()
        .mockImplementation(async (swap) => swap);

      const attemptSettle = jest.fn();
      signer.setAttemptSettle(attemptSettle);

      const { chainSwapInfo, claimDetails, preimage } = await createOutputs();

      chainSwapInfo.receivingData.symbol = 'RBTC';
      await signer.registerForClaim(chainSwapInfo);

      const claimTx = liquidConstructClaimTransaction(
        [
          {
            ...claimDetails.swapOutput,
            type: OutputType.Taproot,
            preimage,
            cooperative: true,
            privateKey: claimDetails.theirKeys.privateKey!,
            transactionId: claimDetails.lockupTx.getId(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
            swapTree: claimDetails.tree,
            internalKey: claimDetails.musig.internalKey,
          },
        ],
        await liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        BigInt(200),
        false,
        LiquidNetworks.liquidRegtest,
      );
      const claimWithNonce = claimDetails.musig
        .message(await hashForWitnessV1(liquidCurrency, claimTx, 0))
        .generateNonce();
      await signer.signClaim(
        chainSwapInfo,
        {
          index: 0,
          transaction: claimTx.toBuffer(),
          pubNonce: Buffer.from(claimWithNonce.publicNonce),
        },
        preimage,
      );

      expect(WrappedSwapRepository.setPreimage).toHaveBeenCalledTimes(1);
      expect(WrappedSwapRepository.setPreimage).toHaveBeenCalledWith(
        chainSwapInfo,
        preimage,
      );
      expect(attemptSettle).toHaveBeenCalledTimes(1);
      expect(attemptSettle).toHaveBeenCalledWith(
        undefined,
        chainSwapInfo,
        undefined,
        preimage,
      );
    });

    test('should create partial signature for user without checks when swap is settled already', async () => {
      const { preimage, chainSwapInfo, claimDetails } = await createOutputs();
      (chainSwapInfo as any).isSettled = true;

      const claimTx = liquidConstructClaimTransaction(
        [
          {
            ...claimDetails.swapOutput,
            type: OutputType.Taproot,
            preimage,
            cooperative: true,
            privateKey: claimDetails.theirKeys.privateKey!,
            transactionId: claimDetails.lockupTx.getId(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
            swapTree: claimDetails.tree,
            internalKey: claimDetails.musig.internalKey,
          },
        ],
        await liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        BigInt(200),
        false,
        LiquidNetworks.liquidRegtest,
      );

      expect.assertions(2);

      const claimWithNonce = claimDetails.musig
        .message(await hashForWitnessV1(liquidCurrency, claimTx, 0))
        .generateNonce();
      const res = await signer.signClaim(chainSwapInfo, {
        index: 0,
        transaction: claimTx.toBuffer(),
        pubNonce: Buffer.from(claimWithNonce.publicNonce),
      });

      const counterpartyKey = liquidWallet.getKeysByIndex(
        chainSwapInfo.sendingData.keyIndex!,
      ).publicKey;
      const claimSigned = claimWithNonce
        .aggregateNonces([[counterpartyKey, res.pubNonce]])
        .initializeSession()
        .addPartial(counterpartyKey, res.signature)
        .signPartial();

      claimTx.ins[0].witness = [Buffer.from(claimSigned.aggregatePartials())];

      await elementsClient.sendRawTransaction(claimTx.toHex());
    });

    test('should not create partial signature when no claim details have been created', async () => {
      const { chainSwapInfo, claimDetails, preimage } = await createOutputs();
      const claimWithNonce = claimDetails.musig
        .message(randomBytes(32))
        .generateNonce();

      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimWithNonce.publicNonce),
          },
          preimage,
        ),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST());
    });

    test.each`
      preimage
      ${undefined}
      ${randomBytes(16)}
      ${randomBytes(32)}
    `(
      'should not create partial signature when preimage is invalid',
      async ({ preimage }) => {
        const { chainSwapInfo, claimDetails } = await createOutputs();
        const claimWithNonce = claimDetails.musig
          .message(randomBytes(32))
          .generateNonce();

        await signer.registerForClaim(chainSwapInfo);
        await signer.getCooperativeDetails(chainSwapInfo);
        await expect(
          signer.signClaim(
            chainSwapInfo,
            {
              index: 0,
              transaction: Buffer.alloc(0),
              pubNonce: Buffer.from(claimWithNonce.publicNonce),
            },
            preimage,
          ),
        ).rejects.toEqual(Errors.INCORRECT_PREIMAGE());
      },
    );

    test('should not create partial signature when their partial signature is undefined', async () => {
      WrappedSwapRepository.setPreimage = jest
        .fn()
        .mockImplementation(async (swap) => swap);

      const { chainSwapInfo, claimDetails, preimage } = await createOutputs();
      const claimWithNonce = claimDetails.musig
        .message(randomBytes(32))
        .generateNonce();

      await signer.registerForClaim(chainSwapInfo);
      await signer.getCooperativeDetails(chainSwapInfo);
      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimWithNonce.publicNonce),
          },
          preimage,
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
    });

    test('should not create partial signature when their partial signature is invalid', async () => {
      WrappedSwapRepository.setPreimage = jest
        .fn()
        .mockImplementation(async (swap) => swap);

      const { chainSwapInfo, claimDetails, lockupDetails, preimage } =
        await createOutputs();

      await signer.registerForClaim(chainSwapInfo);
      const coopDetails = await signer.getCooperativeDetails(chainSwapInfo);
      const refundSigned = lockupDetails.musig
        .message(randomBytes(32))
        .generateNonce()
        .aggregateNonces([[coopDetails.publicKey, coopDetails.pubNonce]])
        .initializeSession()
        .signPartial();
      const claimWithNonce = claimDetails.musig
        .message(randomBytes(32))
        .generateNonce();

      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimWithNonce.publicNonce),
          },
          preimage,
          {
            pubNonce: Buffer.from(refundSigned.publicNonce),
            signature: Buffer.from(refundSigned.ourPartialSignature),
          },
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
    });

    test('should throw when trying to cooperatively claim a refunded swap', async () => {
      const { chainSwapInfo } = await createOutputs();
      (chainSwapInfo as any).status = SwapUpdateEvent.TransactionRefunded;

      await expect(
        signer.signClaim(chainSwapInfo, {
          index: 0,
          transaction: Buffer.alloc(0),
          pubNonce: Buffer.alloc(0),
        }),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
    });
  });

  test.each`
    symbol     | result
    ${'BTC'}   | ${true}
    ${'L-BTC'} | ${true}
    ${'RBTC'}  | ${false}
  `(
    'should claim cooperative for receiving symbol $symbol: $result',
    ({ symbol, result }) => {
      expect(
        signer['canClaimCooperatively']({
          receivingData: { symbol },
        } as unknown as ChainSwapInfo),
      ).toEqual(result);
    },
  );
});
