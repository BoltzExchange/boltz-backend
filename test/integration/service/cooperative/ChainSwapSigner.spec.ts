import { BIP32Factory } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import type { Transaction } from 'bitcoinjs-lib';
import { crypto } from 'bitcoinjs-lib';
import {
  Musig,
  Networks,
  OutputType,
  SwapTreeSerializer,
  constructRefundTransaction,
  detectSwap,
  swapTree,
} from 'boltz-core';
import {
  Networks as LiquidNetworks,
  constructClaimTransaction as liquidConstructClaimTransaction,
} from 'boltz-core/dist/lib/liquid';
import { p2trOutput } from 'boltz-core/dist/lib/swap/Scripts';
import { randomBytes } from 'crypto';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import { SLIP77Factory } from 'slip77';
import * as ecc from 'tiny-secp256k1';
import {
  hashForWitnessV1,
  parseTransaction,
  setup,
  tweakMusig,
  zkp,
} from '../../../../lib/Core';
import { ECPair } from '../../../../lib/ECPairHelper';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
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
import Errors from '../../../../lib/service/Errors';
import ChainSwapSigner from '../../../../lib/service/cooperative/ChainSwapSigner';
import { RefundRejectionReason } from '../../../../lib/service/cooperative/MusigSigner';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletLiquid from '../../../../lib/wallet/WalletLiquid';
import type { Currency } from '../../../../lib/wallet/WalletManager';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import ElementsWalletProvider from '../../../../lib/wallet/providers/ElementsWalletProvider';
import { bitcoinClient, elementsClient } from '../../Nodes';

jest.mock('../../../../lib/db/repositories/ChainTipRepository');

const mnemonic =
  'miracle tower paper teach stomach black exile discover paddle country around survey';

describe('ChainSwapSigner', () => {
  const bip32 = BIP32Factory(ecc);
  const slip77 = SLIP77Factory(ecc);

  const btcCurrency = {
    symbol: 'BTC',
    chainClient: bitcoinClient,
    type: CurrencyType.BitcoinLike,
    network: Networks.bitcoinRegtest,
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
    new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
    Networks.bitcoinRegtest,
  );
  const liquidWallet = new WalletLiquid(
    Logger.disabledLogger,
    new ElementsWalletProvider(Logger.disabledLogger, elementsClient),
    slip77.fromSeed(mnemonicToSeedSync(mnemonic)),
    LiquidNetworks.liquidRegtest,
  );

  const walletManager = {
    wallets: new Map<string, Wallet>([
      [btcWallet.symbol, btcWallet],
      [liquidWallet.symbol, liquidWallet],
      ['RBTC', { type: CurrencyType.Ether } as unknown as Wallet],
    ]),
  } as WalletManager;

  let signer: ChainSwapSigner;

  beforeAll(async () => {
    await Promise.all([
      setup(),
      bitcoinClient.connect(),
      elementsClient.connect(),
    ]);
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    btcWallet.initKeyProvider(
      'm/0/0',
      0,
      bip32.fromSeed(mnemonicToSeedSync(mnemonic)),
    );
    liquidWallet.initKeyProvider(
      'm/0/0',
      0,
      bip32.fromSeed(mnemonicToSeedSync(mnemonic)),
    );
  });

  beforeEach(() => {
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
      const theirKeys = ECPair.makeRandom();
      const tree = swapTree(
        currency.type === CurrencyType.Liquid,
        crypto.sha256(preimage),
        wallet.getKeysByIndex(keyIndex).publicKey,
        Buffer.from(theirKeys.publicKey),
        timeoutBlockHeight,
      );

      const musig = new Musig(zkp, theirKeys, randomBytes(32), [
        wallet.getKeysByIndex(keyIndex).publicKey,
        Buffer.from(theirKeys.publicKey),
      ]);
      const tweakedKey = tweakMusig(currency.type, musig, tree);

      const lockupScript = p2trOutput(tweakedKey);
      const lockupTx = parseTransaction<T>(
        currency.type,
        await currency.chainClient!.getRawTransaction(
          await currency.chainClient!.sendToAddress(
            wallet.encodeAddress(lockupScript),
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
        preimageHash: getHexString(crypto.sha256(preimage)),
        receivingData: {
          symbol: 'BTC',
          keyIndex: lockupDetails.keyIndex,
          transactionVout: lockupDetails.swapOutput.vout,
          lockupTransactionId: lockupDetails.lockupTx.getId(),
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
            ...lockupDetails.swapOutput,
            cooperative: true,
            keys: lockupDetails.theirKeys,
            txHash: lockupDetails.lockupTx.getHash(),
          },
        ],
        btcWallet.decodeAddress(await bitcoinClient.getNewAddress('')),
        chainSwapInfo.receivingData.timeoutBlockHeight,
        200,
      );

      ChainSwapRepository.setRefundSignatureCreated = jest.fn();
      ChainSwapRepository.getChainSwap = jest
        .fn()
        .mockResolvedValue(chainSwapInfo);

      const partialSignature = await signer.signRefund(
        'asdf',
        Buffer.from(lockupDetails.musig.getPublicNonce()),
        refundTx.toBuffer(),
        0,
      );

      lockupDetails.musig.aggregateNonces([
        [
          btcWallet.getKeysByIndex(chainSwapInfo.receivingData.keyIndex!)
            .publicKey,
          partialSignature.pubNonce,
        ],
      ]);
      lockupDetails.musig.initializeSession(
        await hashForWitnessV1(btcCurrency, refundTx, 0),
      );
      lockupDetails.musig.addPartial(
        btcWallet.getKeysByIndex(chainSwapInfo.receivingData.keyIndex!)
          .publicKey,
        partialSignature.signature,
      );
      lockupDetails.musig.signPartial();

      refundTx.ins[0].witness = [lockupDetails.musig.aggregatePartials()];

      await bitcoinClient.sendRawTransaction(refundTx.toHex());

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
          signer['swapsToClaim']
            .get(chainSwapInfo.id)!
            .cooperative!.musig.getPublicNonce(),
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
      lockupDetails.musig.aggregateNonces([
        [coopDetails.publicKey, coopDetails.pubNonce],
      ]);
      lockupDetails.musig.initializeSession(coopDetails.transactionHash);

      const claimTx = liquidConstructClaimTransaction(
        [
          {
            ...claimDetails.swapOutput,
            preimage,
            cooperative: true,
            keys: claimDetails.theirKeys,
            txHash: claimDetails.lockupTx.getHash(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
          },
        ],
        liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        200,
        false,
        LiquidNetworks.liquidRegtest,
      );

      expect.assertions(4);

      signer.once('claim', (swap) => {
        expect(swap).toEqual(chainSwapInfo);
      });

      const claimPartial = await signer.signClaim(
        chainSwapInfo,
        {
          index: 0,
          transaction: claimTx.toBuffer(),
          pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
        },
        preimage,
        {
          pubNonce: Buffer.from(lockupDetails.musig.getPublicNonce()),
          signature: Buffer.from(lockupDetails.musig.signPartial()),
        },
      );
      expect(signer['swapsToClaim'].size).toEqual(0);

      claimDetails.musig.aggregateNonces([
        [
          liquidWallet.getKeysByIndex(chainSwapInfo.sendingData.keyIndex!)
            .publicKey,
          claimPartial.pubNonce,
        ],
      ]);
      claimDetails.musig.initializeSession(
        await hashForWitnessV1(liquidCurrency, claimTx, 0),
      );
      claimDetails.musig.addPartial(
        liquidWallet.getKeysByIndex(chainSwapInfo.sendingData.keyIndex!)
          .publicKey,
        claimPartial.signature,
      );
      claimDetails.musig.signPartial();

      claimTx.ins[0].witness = [claimDetails.musig.aggregatePartials()];

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
            preimage,
            cooperative: true,
            keys: claimDetails.theirKeys,
            txHash: claimDetails.lockupTx.getHash(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
          },
        ],
        liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        200,
        false,
        LiquidNetworks.liquidRegtest,
      );
      await signer.signClaim(
        chainSwapInfo,
        {
          index: 0,
          transaction: claimTx.toBuffer(),
          pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
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
            preimage,
            cooperative: true,
            keys: claimDetails.theirKeys,
            txHash: claimDetails.lockupTx.getHash(),
            blindingPrivateKey: claimDetails.blindingPrivateKey,
          },
        ],
        liquidWallet.decodeAddress(await elementsClient.getNewAddress('')),
        200,
        false,
        LiquidNetworks.liquidRegtest,
      );

      expect.assertions(2);

      const res = await signer.signClaim(chainSwapInfo, {
        index: 0,
        transaction: claimTx.toBuffer(),
        pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
      });

      claimDetails.musig.aggregateNonces([
        [
          liquidWallet.getKeysByIndex(chainSwapInfo.sendingData.keyIndex!)
            .publicKey,
          res.pubNonce,
        ],
      ]);
      claimDetails.musig.initializeSession(
        await hashForWitnessV1(liquidCurrency, claimTx, 0),
      );
      claimDetails.musig.addPartial(
        liquidWallet.getKeysByIndex(chainSwapInfo.sendingData.keyIndex!)
          .publicKey,
        res.signature,
      );
      claimDetails.musig.signPartial();

      claimTx.ins[0].witness = [claimDetails.musig.aggregatePartials()];

      await elementsClient.sendRawTransaction(claimTx.toHex());
    });

    test('should not create partial signature when no claim details have been created', async () => {
      const { chainSwapInfo, claimDetails, preimage } = await createOutputs();

      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
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

        await signer.registerForClaim(chainSwapInfo);
        await signer.getCooperativeDetails(chainSwapInfo);
        await expect(
          signer.signClaim(
            chainSwapInfo,
            {
              index: 0,
              transaction: Buffer.alloc(0),
              pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
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

      await signer.registerForClaim(chainSwapInfo);
      await signer.getCooperativeDetails(chainSwapInfo);
      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
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
      lockupDetails.musig.aggregateNonces([
        [coopDetails.publicKey, coopDetails.pubNonce],
      ]);
      lockupDetails.musig.initializeSession(randomBytes(32));

      await expect(
        signer.signClaim(
          chainSwapInfo,
          {
            index: 0,
            transaction: Buffer.alloc(0),
            pubNonce: Buffer.from(claimDetails.musig.getPublicNonce()),
          },
          preimage,
          {
            pubNonce: Buffer.from(lockupDetails.musig.getPublicNonce()),
            signature: Buffer.from(lockupDetails.musig.signPartial()),
          },
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
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
