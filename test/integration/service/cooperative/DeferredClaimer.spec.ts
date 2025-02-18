import { BIP32Factory } from 'bip32';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Transaction, address, crypto } from 'bitcoinjs-lib';
import {
  Musig,
  Networks,
  OutputType,
  SwapTreeSerializer,
  detectSwap,
  swapTree,
} from 'boltz-core';
import { secp } from 'boltz-core/dist/lib/liquid/init';
import { p2trOutput } from 'boltz-core/dist/lib/swap/Scripts';
import { randomBytes } from 'crypto';
import * as ecc from 'tiny-secp256k1';
import {
  createMusig,
  hashForWitnessV1,
  setup,
  tweakMusig,
} from '../../../../lib/Core';
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
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import Swap from '../../../../lib/db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../../../lib/db/repositories/ChainSwapRepository';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';
import Errors from '../../../../lib/service/Errors';
import DeferredClaimer from '../../../../lib/service/cooperative/DeferredClaimer';
import SwapOutputType from '../../../../lib/swap/SwapOutputType';
import Wallet from '../../../../lib/wallet/Wallet';
import WalletManager, { Currency } from '../../../../lib/wallet/WalletManager';
import { Ethereum } from '../../../../lib/wallet/ethereum/EvmNetworks';
import ContractHandler from '../../../../lib/wallet/ethereum/contracts/ContractHandler';
import Contracts, {
  Feature,
} from '../../../../lib/wallet/ethereum/contracts/Contracts';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import { wait } from '../../../Utils';
import { bitcoinClient, bitcoinLndClient, clnClient } from '../../Nodes';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
} from '../../wallet/EthereumTools';

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
    status: SwapUpdateEvent.TransactionClaimed,
  })),
  setSwapStatus: jest
    .fn()
    .mockImplementation(async (swap: Swap, status: string) => ({
      ...swap,
      status,
    })),
}));
jest.mock('../../../../lib/db/repositories/ChainSwapRepository', () => ({
  getChainSwapsClaimable: jest.fn().mockResolvedValue([]),
  setClaimMinerFee: jest
    .fn()
    .mockImplementation(async (swap, preimage, minerFee) => ({
      ...swap,
      preimage: getHexString(preimage),
      status: SwapUpdateEvent.TransactionClaimed,
      receivingData: {
        ...swap.receivingData,
        fee: minerFee,
      },
    })),
  setTransactionClaimPending: jest
    .fn()
    .mockImplementation(async (swap, preimage) => ({
      ...swap,
      preimage: getHexString(preimage),
      status: SwapUpdateEvent.TransactionClaimPending,
    })),
}));

describe('DeferredClaimer', () => {
  let ethereumSetup: EthereumSetup;
  let contracts: Awaited<ReturnType<typeof getContracts>>;

  const bip32 = BIP32Factory(ecc);

  const btcCurrency = {
    clnClient,
    symbol: 'BTC',
    chainClient: bitcoinClient,
    lndClient: bitcoinLndClient,
    type: CurrencyType.BitcoinLike,
  } as unknown as Currency;

  const btcWallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
    Networks.bitcoinRegtest,
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
      deferredClaimSymbols: ['BTC', 'RBTC', 'TRC', 'DOGE'],
      expiryTolerance: 10,
      batchClaimInterval: '*/15 * * * *',
    },
  );

  const createClaimableOutput = async (timeoutBlockHeight?: number) => {
    const refundKeys = ECPair.makeRandom();
    const swap = {
      pair: 'L-BTC/BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      id: generateSwapId(SwapVersion.Taproot),
      theirPublicKey: getHexString(refundKeys.publicKey),
      refundPublicKey: getHexString(refundKeys.publicKey),
      timeoutBlockHeight:
        timeoutBlockHeight ||
        (await bitcoinClient.getBlockchainInfo()).blocks + 100,
    } as Partial<Swap> as Swap;

    const preimage = randomBytes(32);
    swap.preimage = getHexString(preimage);
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
          btcWallet.encodeAddress(p2trOutput(tweakedKey)).new,
          100_000,
          undefined,
          false,
          '',
        ),
      ),
    );
    swap.lockupTransactionId = tx.getId();
    swap.lockupTransactionVout = detectSwap(tweakedKey, tx)!.vout;

    return { swap, preimage, refundKeys, lockupTransactionId: tx.getId() };
  };

  const createClaimableChainSwapOutput = async () => {
    // Same claim logic; different data structure
    const { swap, preimage, refundKeys, lockupTransactionId } =
      await createClaimableOutput();

    const chainSwap = {
      id: swap.id,
      pair: swap.pair,
      type: SwapType.Chain,
      version: swap.version,
      preimage: swap.preimage,
      orderSide: swap.orderSide,
      preimageHash: swap.preimageHash,
      receivingData: {
        symbol: 'BTC',
        keyIndex: swap.keyIndex,
        swapTree: swap.redeemScript,
        theirPublicKey: swap.refundPublicKey!,
        transactionVout: swap.lockupTransactionVout,
        timeoutBlockHeight: swap.timeoutBlockHeight,
        lockupTransactionId: swap.lockupTransactionId,
      },
    } as Partial<ChainSwapInfo> as ChainSwapInfo;

    return { preimage, refundKeys, lockupTransactionId, swap: chainSwap };
  };

  const lockupEther = async (nonce: number) => {
    const swap = {
      pair: 'RBTC/BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.SELL,
      version: SwapVersion.Taproot,
      id: generateSwapId(SwapVersion.Taproot),
      preimage: getHexString(randomBytes(32)),
      timeoutBlockHeight:
        (await ethereumSetup.provider.getBlockNumber()) + 21_21_21,
    } as Partial<Swap> as Swap;

    swap.preimageHash = getHexString(
      crypto.sha256(getHexBuffer(swap.preimage!)),
    );

    const tx = await contracts.etherSwap.lock(
      getHexBuffer(swap.preimageHash),
      await ethereumSetup.signer.getAddress(),
      swap.timeoutBlockHeight,
      {
        nonce,
        value: 100_000,
      },
    );
    await tx.wait(1);

    swap.lockupTransactionId = tx.hash;
    return { swap, preimage: getHexBuffer(swap.preimage!) };
  };

  const lockupEtherChainSwap = async (nonce: number) => {
    const { swap, preimage } = await lockupEther(nonce);

    const chainSwap = {
      id: swap.id,
      pair: swap.pair,
      type: SwapType.Chain,
      version: swap.version,
      preimage: swap.preimage,
      orderSide: swap.orderSide,
      preimageHash: swap.preimageHash,
      receivingData: {
        symbol: 'RBTC',
        lockupTransactionId: swap.lockupTransactionId,
      },
    } as Partial<ChainSwapInfo> as ChainSwapInfo;

    return { preimage, swap: chainSwap };
  };

  const lockupToken = async (nonce: number) => {
    const swap = {
      pair: 'TRC/BTC',
      type: SwapType.Submarine,
      orderSide: OrderSide.SELL,
      version: SwapVersion.Taproot,
      id: generateSwapId(SwapVersion.Taproot),
      preimage: getHexString(randomBytes(32)),
      timeoutBlockHeight:
        (await ethereumSetup.provider.getBlockNumber()) + 21_21_21,
    } as Partial<Swap> as Swap;

    swap.preimageHash = getHexString(
      crypto.sha256(getHexBuffer(swap.preimage!)),
    );

    const amount = 100_000n;

    const approveTx = await contracts.token.approve(
      await contracts.erc20Swap.getAddress(),
      amount,
      {
        nonce,
      },
    );
    await approveTx.wait(1);

    const tx = await contracts.erc20Swap.lock(
      getHexBuffer(swap.preimageHash),
      amount,
      await contracts.token.getAddress(),
      await ethereumSetup.signer.getAddress(),
      swap.timeoutBlockHeight,
      {
        nonce: nonce + 1,
      },
    );
    await tx.wait(1);

    swap.lockupTransactionId = tx.hash;
    return { swap, preimage: getHexBuffer(swap.preimage!) };
  };

  const lockupTokenChainSwap = async (nonce: number) => {
    const { swap, preimage } = await lockupToken(nonce);

    const chainSwap = {
      id: swap.id,
      pair: swap.pair,
      type: SwapType.Chain,
      version: swap.version,
      preimage: swap.preimage,
      orderSide: swap.orderSide,
      preimageHash: swap.preimageHash,
      receivingData: {
        symbol: 'TRC',
        lockupTransactionId: swap.lockupTransactionId,
      },
    } as Partial<ChainSwapInfo> as ChainSwapInfo;

    return { preimage, swap: chainSwap };
  };

  beforeAll(async () => {
    btcWallet.initKeyProvider(
      'm/0/0',
      0,
      bip32.fromSeed(mnemonicToSeedSync(generateMnemonic())),
    );

    ethereumSetup = await getSigner();
    contracts = await getContracts(ethereumSetup.signer);

    await Promise.all([setup(), bitcoinClient.connect()]);

    await Promise.all([
      bitcoinClient.generate(1),
      fundSignerWallet(
        ethereumSetup.signer,
        ethereumSetup.etherBase,
        contracts.token,
      ),
    ]);

    const contractHandler = new ContractHandler(Ethereum);
    contractHandler.init(
      new Set<Feature>([Feature.BatchClaim]),
      ethereumSetup.provider,
      contracts.etherSwap,
      contracts.erc20Swap,
    );

    const cts = {
      contractHandler,
      version: Contracts.maxVersion,
      etherSwap: contracts.etherSwap,
      erc20Swap: contracts.erc20Swap,
    };

    walletManager.ethereumManagers = [
      {
        contractHandler,
        provider: ethereumSetup.provider,
        hasSymbol: jest.fn().mockReturnValue(true),
        contractsForAddress: jest
          .fn()
          .mockImplementation(async (address: string) => {
            if (address == 'outdated') {
              return {
                ...cts,
                version: Contracts.maxVersion - 1n,
              };
            } else {
              return cts;
            }
          }),
        highestContractsVersion: jest.fn().mockReturnValue(cts),
      } as any,
    ];
    claimer['currencies'].set('RBTC', {
      type: CurrencyType.Ether,
      provider: ethereumSetup.provider,
    } as any);

    claimer['currencies'].set('TRC', {
      type: CurrencyType.ERC20,
      provider: ethereumSetup.provider,
    } as any);

    const erc20WalletProvider = new ERC20WalletProvider(
      Logger.disabledLogger,
      ethereumSetup.signer,
      {
        decimals: 18,
        symbol: 'TRC',
        contract: contracts.token,
        address: await contracts.token.getAddress(),
      },
    );
    walletManager.wallets.set('TRC', {
      walletProvider: erc20WalletProvider,
    } as any);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    claimer['swapsToClaim'].get('BTC')?.clear();
    claimer['chainSwapsToClaim'].get('BTC')?.clear();
  });

  afterAll(() => {
    claimer.close();

    bitcoinClient.disconnect();
  });

  test.each`
    symbol     | chunkSize
    ${'L-BTC'} | ${15}
    ${'BTC'}   | ${100}
    ${'RBTC'}  | ${100}
    ${'SMTHG'} | ${100}
  `('should get max batch chunk size of $symbol', ({ symbol, chunkSize }) => {
    expect(DeferredClaimer['maxBatchClaimChunk'].get(symbol)).toEqual(
      chunkSize,
    );
  });

  describe('init', () => {
    test('should init', async () => {
      await claimer.init();

      expect(SwapRepository.getSwapsClaimable).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwapsClaimable).toHaveBeenCalledTimes(
        1,
      );
      expect(claimer['batchClaimSchedule']).not.toBeUndefined();
    });

    test('should not crash when batch claim of leftovers fails', async () => {
      claimer.close();

      const original = claimer['batchClaimLeftovers'];
      claimer['batchClaimLeftovers'] = jest.fn().mockRejectedValue('fails');

      await claimer.init();

      claimer['batchClaimLeftovers'] = original;
    });
  });

  test('should close', () => {
    expect(claimer['batchClaimSchedule']).not.toBeUndefined();
    claimer.close();
    expect(claimer['batchClaimSchedule']).toBeUndefined();
  });

  describe('deferClaim', () => {
    test('should defer claim transactions of Submarine Swaps', async () => {
      const swap = {
        id: 'swapId',
        pair: 'L-BTC/BTC',
        type: SwapType.Submarine,
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
      expect(claimer['chainSwapsToClaim'].get('BTC')!.size).toEqual(0);
    });

    test('should defer claim transactions of Chain Swaps', async () => {
      const swap = {
        id: 'chainSwapId',
        pair: 'L-BTC/BTC',
        type: SwapType.Chain,
        orderSide: OrderSide.BUY,
        version: SwapVersion.Taproot,
        receivingData: {
          symbol: 'BTC',
        },
      } as Partial<ChainSwapInfo> as ChainSwapInfo;
      const preimage = randomBytes(32);

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

      expect(
        ChainSwapRepository.setTransactionClaimPending,
      ).toHaveBeenCalledTimes(1);
      expect(
        ChainSwapRepository.setTransactionClaimPending,
      ).toHaveBeenCalledWith(swap, preimage);

      expect(claimer['chainSwapsToClaim'].get('BTC')!.size).toEqual(1);
      expect(claimer['chainSwapsToClaim'].get('BTC')!.get(swap.id)).toEqual({
        preimage,
        swap: {
          ...swap,
          preimage: getHexString(preimage),
          status: SwapUpdateEvent.TransactionClaimPending,
        },
      });
      expect(claimer['swapsToClaim'].get('BTC')!.size).toEqual(0);
    });

    test('should trigger sweep when deferring claim transaction with close expiry', async () => {
      const { swap, preimage } = await createClaimableOutput(
        (await bitcoinClient.getBlockchainInfo()).blocks,
      );

      expect.assertions(4);

      claimer.once('claim', (args) => {
        expect(args.swap).toEqual({
          ...swap,
          minerFee: expect.anything(),
          status: SwapUpdateEvent.TransactionClaimed,
        });
        expect(args.channelCreation).toBeUndefined();
      });

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

      expect(
        claimer.pendingSweeps()[SwapType.Submarine].get('BTC'),
      ).toBeUndefined();
    });

    test('should not defer claim transactions on chains that were not configured', async () => {
      const swap = {
        pair: 'L-BTC/BTC',
        type: SwapType.Submarine,
        orderSide: OrderSide.SELL,
      } as Partial<Swap> as Swap;
      const preimage = randomBytes(32);

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(false);
    });

    test('should not defer claim transactions of legacy swaps', async () => {
      const swap = {
        pair: 'BTC/BTC',
        type: SwapType.Submarine,
        orderSide: OrderSide.SELL,
        version: SwapVersion.Legacy,
      } as Partial<Swap> as Swap;
      const preimage = randomBytes(32);

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(false);
    });

    test('should not defer claim transactions of swaps to outdated contracts', async () => {
      const swap = {
        pair: 'RBTC/BTC',
        type: SwapType.Submarine,
        orderSide: OrderSide.SELL,
        lockupAddress: 'outdated',
        version: SwapVersion.Taproot,
      } as Partial<Swap> as Swap;

      await expect(claimer.deferClaim(swap, randomBytes(32))).resolves.toEqual(
        false,
      );
    });
  });

  test('should get ids of pending sweeps', async () => {
    const swap = {
      id: 'swapId',
      pair: 'L-BTC/BTC',
      onchainAmount: 123,
      type: SwapType.Submarine,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
    } as Partial<Swap> as Swap;
    const preimage = randomBytes(32);

    await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

    const chainSwap = {
      id: 'chainSwapId',
      pair: 'L-BTC/BTC',
      type: SwapType.Chain,
      orderSide: OrderSide.BUY,
      version: SwapVersion.Taproot,
      receivingData: {
        symbol: 'BTC',
        amount: 212_212,
      },
    } as Partial<ChainSwapInfo> as ChainSwapInfo;
    const chainPreimage = randomBytes(32);

    await expect(claimer.deferClaim(chainSwap, chainPreimage)).resolves.toEqual(
      true,
    );

    expect(claimer.pendingSweeps()).toEqual({
      [SwapType.Submarine]: new Map<string, string[]>([['BTC', [swap.id]]]),
      [SwapType.Chain]: new Map<string, string[]>([['BTC', [chainSwap.id]]]),
    });

    const pendingSweepValues = claimer.pendingSweepsValues();
    expect(pendingSweepValues.get('DOGE')).toBeUndefined();
    const btcPendingSweeps = pendingSweepValues.get('BTC')!;
    expect(btcPendingSweeps.length).toEqual(2);
    expect(btcPendingSweeps[0]).toEqual({
      id: swap.id,
      type: SwapType.Submarine,
      onchainAmount: swap.onchainAmount,
    });
    expect(btcPendingSweeps[1]).toEqual({
      id: chainSwap.id,
      type: SwapType.Chain,
      onchainAmount: chainSwap.receivingData!.amount,
    });
  });

  describe('sweep', () => {
    test('should sweep all configured currencies', async () => {
      const spy = jest.spyOn(claimer, 'sweepSymbol');
      await expect(claimer.sweep()).resolves.toEqual(new Map());

      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith('BTC');
      expect(spy).toHaveBeenCalledWith('RBTC');
      expect(spy).toHaveBeenCalledWith('DOGE');
    });

    test('should keep pending swaps in map when claim fails', async () => {
      const rejection = 'no good';
      const sendRawTransaction = btcCurrency.chainClient!.sendRawTransaction;
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

      btcCurrency.chainClient!.sendRawTransaction = sendRawTransaction;
    });

    test('should keep pending chain swaps in map when claim fails', async () => {
      const rejection = 'no good';
      const sendRawTransaction = btcCurrency.chainClient!.sendRawTransaction;
      btcCurrency.chainClient!.sendRawTransaction = jest
        .fn()
        .mockRejectedValue(rejection);

      const { swap, preimage } = await createClaimableChainSwapOutput();
      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

      await expect(claimer.sweep()).rejects.toEqual(rejection);
      expect(claimer['chainSwapsToClaim'].get('BTC')!.size).toEqual(1);
      expect(claimer['chainSwapsToClaim'].get('BTC')!.get(swap.id)).toEqual({
        preimage,
        swap: {
          ...swap,
          status: SwapUpdateEvent.TransactionClaimPending,
        },
      });

      btcCurrency.chainClient!.sendRawTransaction = sendRawTransaction;
    });
  });

  describe('sweepSymbol', () => {
    test('should sweep multiple swaps of a currency', async () => {
      await bitcoinClient.generate(1);
      const swaps = await Promise.all([
        createClaimableOutput(),
        createClaimableChainSwapOutput(),
      ]);

      for (const { swap, preimage } of swaps) {
        await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
      }

      await claimer.sweepSymbol('BTC');

      const lockupTxs = swaps.map(
        ({ lockupTransactionId }) => lockupTransactionId,
      );
      const claimTx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          (await bitcoinClient.getRawMempool()).find(
            (txId) => !lockupTxs.includes(txId),
          )!,
        ),
      );

      expect(claimTx.ins.length).toEqual(swaps.length);
      expect(claimTx.outs.length).toEqual(1);

      const addressInfo = await bitcoinClient.getAddressInfo(
        address.fromOutputScript(
          claimTx.outs[0].script,
          Networks.bitcoinRegtest,
        ),
      );
      expect(addressInfo.ismine).toEqual(true);
      expect(addressInfo.labels).toEqual([
        `Batch claim of Swaps ${swaps.map((s) => s.swap.id).join(', ')}`,
      ]);
    });

    test('should sweep Ether like currencies', async () => {
      TransactionLabelRepository.addLabel = jest.fn();

      const nonce = await ethereumSetup.signer.getNonce();
      const swaps = [
        await lockupEther(nonce),
        await lockupEtherChainSwap(nonce + 1),
      ];
      for (const { swap, preimage } of swaps) {
        await claimer.deferClaim(swap, preimage);
      }

      // Wait for nonce update
      await wait(150);

      await claimer.sweepSymbol('RBTC');
      // Wait for confirmation
      await wait(150);

      const claimReceipt = await ethereumSetup.provider.getTransactionReceipt(
        (
          await contracts.etherSwap.queryFilter(
            contracts.etherSwap.filters.Claim(
              getHexBuffer(swaps[0].swap.preimageHash),
            ),
          )
        )[0].transactionHash,
      );
      expect(claimReceipt!.status).toEqual(1);
      expect(claimReceipt!.logs).toHaveLength(swaps.length);

      expect(TransactionLabelRepository.addLabel).toHaveBeenCalledTimes(1);
      expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
        claimReceipt!.hash,
        'ETH',
        `Batch claim of Swaps ${swaps.map((s) => s.swap.id).join(', ')}`,
      );
    });

    test('should sweep ERC20 like currencies', async () => {
      TransactionLabelRepository.addLabel = jest.fn();

      const nonce = await ethereumSetup.signer.getNonce();
      const swaps = [
        await lockupToken(nonce),
        await lockupTokenChainSwap(nonce + 2),
      ];
      for (const { swap, preimage } of swaps) {
        await claimer.deferClaim(swap, preimage);
      }

      // Wait for nonce update
      await wait(150);

      await claimer.sweepSymbol('TRC');
      // Wait for confirmation
      await wait(150);

      const claimReceipt = await ethereumSetup.provider.getTransactionReceipt(
        (
          await contracts.erc20Swap.queryFilter(
            contracts.erc20Swap.filters.Claim(
              getHexBuffer(swaps[0].swap.preimageHash),
            ),
          )
        )[0].transactionHash,
      );
      expect(claimReceipt!.status).toEqual(1);
      // One event for the token transfer
      expect(claimReceipt!.logs).toHaveLength(swaps.length + 1);

      expect(TransactionLabelRepository.addLabel).toHaveBeenCalledTimes(1);
      expect(TransactionLabelRepository.addLabel).toHaveBeenCalledWith(
        claimReceipt!.hash,
        'TRC',
        `Batch claim of Swaps ${swaps.map((s) => s.swap.id).join(', ')}`,
      );
    });

    test('should sweep currency with no pending swaps', async () => {
      await expect(claimer.sweepSymbol('BTC')).resolves.toEqual([]);
    });

    test('should sweep currency that is not configured', async () => {
      await expect(claimer.sweepSymbol('notConfigured')).resolves.toEqual([]);
    });
  });

  test('should claim leftovers on startup', async () => {
    await bitcoinClient.generate(1);

    const paidSwaps = [
      await createClaimableOutput(),
      await createClaimableChainSwapOutput(),
    ];

    SwapRepository.getSwapsClaimable = jest
      .fn()
      .mockResolvedValue([paidSwaps[0].swap]);

    ChainSwapRepository.getChainSwapsClaimable = jest
      .fn()
      .mockResolvedValue([paidSwaps[1].swap]);

    await claimer.init();

    const lockupTxs = paidSwaps.map(
      ({ lockupTransactionId }) => lockupTransactionId,
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

  describe('getCooperativeDetails', () => {
    test.each`
      name           | type
      ${'Submarine'} | ${SwapType.Submarine}
      ${'Chain'}     | ${SwapType.Chain}
    `('should get cooperative details of $name swaps', async ({ type }) => {
      const { swap, preimage } =
        type === SwapType.Submarine
          ? await createClaimableOutput()
          : await createClaimableChainSwapOutput();

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
      const details = await claimer.getCooperativeDetails(swap);
      const toClaim = claimer[
        type === SwapType.Submarine ? 'swapsToClaim' : 'chainSwapsToClaim'
      ]
        .get('BTC')!
        .get(swap.id)!;

      expect(toClaim.cooperative).not.toBeUndefined();
      expect(toClaim.cooperative!.musig).not.toBeUndefined();
      expect(toClaim.cooperative!.transaction).not.toBeUndefined();
      expect(toClaim.cooperative!.sweepAddress).not.toBeUndefined();
      expect(toClaim.cooperative!.transaction.ins).toHaveLength(1);
      expect(toClaim.cooperative!.transaction.ins[0].witness).toHaveLength(1);
      expect(toClaim.cooperative!.transaction.outs).toHaveLength(1);
      expect(toClaim.cooperative!.transaction.outs[0].script).toEqual(
        btcWallet.decodeAddress(toClaim.cooperative!.sweepAddress),
      );

      expect(details.preimage).toEqual(preimage);
      expect(details.publicKey).toEqual(
        btcWallet.getKeysByIndex(
          type === SwapType.Submarine
            ? (swap as Swap).keyIndex!
            : (swap as ChainSwapInfo).receivingData.keyIndex!,
        ).publicKey,
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
    });

    test.each`
      name           | type
      ${'Submarine'} | ${SwapType.Submarine}
      ${'Chain'}     | ${SwapType.Chain}
    `(
      'should keep same address for multiple cooperative details calls of $name swaps',
      async ({ type }) => {
        const { swap, preimage } =
          type === SwapType.Submarine
            ? await createClaimableOutput()
            : await createClaimableChainSwapOutput();

        await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
        await claimer.getCooperativeDetails(swap);
        const coop = claimer[
          type === SwapType.Submarine ? 'swapsToClaim' : 'chainSwapsToClaim'
        ]
          .get('BTC')!
          .get(swap.id)!.cooperative!;

        await claimer.getCooperativeDetails(swap);
        const newCoop = claimer[
          type === SwapType.Submarine ? 'swapsToClaim' : 'chainSwapsToClaim'
        ]
          .get('BTC')!
          .get(swap.id)!.cooperative!;

        // Same address and transaction
        expect(newCoop.sweepAddress).toEqual(coop.sweepAddress);
        expect(newCoop.transaction.toHex()).toEqual(coop.transaction.toHex());

        // Different musig
        expect(newCoop.musig).not.toEqual(coop.musig);
        expect(newCoop.musig.getPublicNonce()).not.toEqual(
          coop.musig.getPublicNonce(),
        );
      },
    );

    test('should throw when getting cooperative details for swap that is not claimable', async () => {
      await expect(
        claimer.getCooperativeDetails({
          id: 'notFound',
          pair: 'BTC/BTC',
          type: SwapType.Submarine,
          orderSide: OrderSide.BUY,
        } as any),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM());
    });
  });

  describe('broadcastCooperative', () => {
    test('should broadcast submarine swaps cooperatively', async () => {
      expect.assertions(7);

      await bitcoinClient.generate(1);
      const { swap, preimage, refundKeys } = await createClaimableOutput();

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
      const details = await claimer.getCooperativeDetails(swap);

      const musig = new Musig(secp, refundKeys, randomBytes(32), [
        btcWallet.getKeysByIndex(swap.keyIndex!).publicKey,
        refundKeys.publicKey,
      ]);
      tweakMusig(
        CurrencyType.BitcoinLike,
        musig,
        SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!),
      );
      musig.aggregateNonces([[details.publicKey, details.pubNonce]]);
      musig.initializeSession(details.transactionHash);

      claimer.once('claim', ({ swap, channelCreation }) => {
        expect(swap.status).toEqual(SwapUpdateEvent.TransactionClaimed);
        expect((swap as Swap).minerFee).toBeGreaterThan(0);
        expect(channelCreation).toBeUndefined();
      });

      await claimer.broadcastCooperative(
        swap,
        Buffer.from(musig.getPublicNonce()),
        Buffer.from(musig.signPartial()),
      );

      expect(claimer['swapsToClaim'].get('BTC')!.get(swap.id)).toBeUndefined();

      const claimTx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          (await bitcoinClient.getRawMempool()).find(
            (txId) => txId !== swap.lockupTransactionId,
          )!,
        ),
      );
      expect(claimTx.ins).toHaveLength(1);
      expect(claimTx.outs).toHaveLength(1);
    });

    test('should broadcast chains swaps cooperatively', async () => {
      await bitcoinClient.generate(1);
      const { swap, preimage, refundKeys } =
        await createClaimableChainSwapOutput();

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
      const details = await claimer.getCooperativeDetails(swap);

      const musig = new Musig(secp, refundKeys, randomBytes(32), [
        btcWallet.getKeysByIndex(swap.receivingData.keyIndex!).publicKey,
        refundKeys.publicKey,
      ]);
      tweakMusig(
        CurrencyType.BitcoinLike,
        musig,
        SwapTreeSerializer.deserializeSwapTree(swap.receivingData.swapTree!),
      );
      musig.aggregateNonces([[details.publicKey, details.pubNonce]]);
      musig.initializeSession(details.transactionHash);

      claimer.once('claim', ({ swap }) => {
        expect(swap.status).toEqual(SwapUpdateEvent.TransactionClaimed);
        expect((swap as ChainSwapInfo).receivingData.fee).toBeGreaterThan(0);
      });

      await claimer.broadcastCooperative(
        swap,
        Buffer.from(musig.getPublicNonce()),
        Buffer.from(musig.signPartial()),
      );

      expect(
        claimer['chainSwapsToClaim'].get('BTC')!.get(swap.id),
      ).toBeUndefined();

      const claimTx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          (await bitcoinClient.getRawMempool()).find(
            (txId) => txId !== swap.receivingData.lockupTransactionId,
          )!,
        ),
      );
      expect(claimTx.ins).toHaveLength(1);
      expect(claimTx.outs).toHaveLength(1);
    });

    test('should throw when cooperatively broadcasting a submarine swap with invalid partial signature', async () => {
      await bitcoinClient.generate(1);
      const { swap, preimage, refundKeys } = await createClaimableOutput();

      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);
      await claimer.getCooperativeDetails(swap);

      const musig = new Musig(secp, refundKeys, randomBytes(32), [
        btcWallet.getKeysByIndex(swap.keyIndex!).publicKey,
        refundKeys.publicKey,
      ]);
      await expect(
        claimer.broadcastCooperative(
          swap,
          Buffer.from(musig.getPublicNonce()),
          randomBytes(32),
        ),
      ).rejects.toEqual(Errors.INVALID_PARTIAL_SIGNATURE());
    });

    test('should throw when cooperatively broadcasting a submarine swap that does not exist', async () => {
      await expect(
        claimer.broadcastCooperative(
          {
            id: 'notFound',
            pair: 'BTC/BTC',
            type: SwapType.Submarine,
            orderSide: OrderSide.BUY,
          } as any,
          Buffer.alloc(0),
          Buffer.alloc(0),
        ),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST());
    });

    test('should throw when cooperatively broadcasting a submarine swap that was not initialized for it', async () => {
      const { swap, preimage } = await createClaimableOutput();
      await expect(claimer.deferClaim(swap, preimage)).resolves.toEqual(true);

      await expect(
        claimer.broadcastCooperative(swap, Buffer.alloc(0), Buffer.alloc(0)),
      ).rejects.toEqual(Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST());
    });
  });
});
