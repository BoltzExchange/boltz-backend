import { Transaction } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  PercentageFeeType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';
import RateProvider from '../../../lib/rates/RateProvider';
import BalanceCheck from '../../../lib/service/BalanceCheck';
import Errors from '../../../lib/service/Errors';
import Renegotiator from '../../../lib/service/Renegotiator';
import ChainSwapSigner from '../../../lib/service/cooperative/ChainSwapSigner';
import EipSigner from '../../../lib/service/cooperative/EipSigner';
import ErrorsSwap from '../../../lib/swap/Errors';
import EthereumNursery from '../../../lib/swap/EthereumNursery';
import SwapNursery from '../../../lib/swap/SwapNursery';
import UtxoNursery from '../../../lib/swap/UtxoNursery';
import WalletManager from '../../../lib/wallet/WalletManager';
import Contracts from '../../../lib/wallet/ethereum/contracts/Contracts';
import { bitcoinClient } from '../Nodes';
import { getContracts, getSigner } from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('Renegotiator', () => {
  const currencies = new Map<string, any>([
    [
      'BTC',
      {
        symbol: 'BTC',
        chainClient: bitcoinClient,
        type: CurrencyType.BitcoinLike,
      },
    ],
  ]);

  const walletManager = {
    wallets: new Map<string, any>([['BTC', { the: 'BTC wallet' }]]),
  } as any as WalletManager;

  const contracts = {} as Contracts;
  const swapNursery = {
    utxoNursery: {
      checkChainSwapTransaction: jest.fn().mockImplementation(async () => {}),
    } as any as UtxoNursery,
    ethereumNurseries: [
      {
        ethereumManager: {
          hasSymbol: jest.fn().mockReturnValue(true),
          contractsForAddress: jest.fn().mockResolvedValue(contracts),
        },

        checkEtherSwapLockup: jest.fn(),
        checkErc20SwapLockup: jest.fn(),
      },
    ] as any as EthereumNursery[],
  } as any as SwapNursery;

  const chainSwapSigner = {
    refundSignatureLock: jest.fn().mockImplementation((cb) => cb()),
  } as any as ChainSwapSigner;

  const eipSigner = {
    refundSignatureLock: jest.fn().mockImplementation((cb) => cb()),
  } as any as EipSigner;

  const rateProvider = {
    providers: {
      [SwapVersion.Taproot]: {
        getChainPairs: jest.fn().mockReturnValue(
          new Map<string, any>([
            [
              'BTC',
              new Map<string, any>([
                [
                  'BTC',
                  {
                    rate: 1,
                    limits: {
                      minimal: 1_000,
                      maximal: 100_000,
                    },
                  },
                ],
              ]),
            ],
            [
              'RBTC',
              new Map<string, any>([
                [
                  'BTC',
                  {
                    rate: 1,
                    limits: {
                      minimal: 1_000,
                      maximal: 100_000,
                    },
                  },
                ],
              ]),
            ],
            [
              'TBTC',
              new Map<string, any>([
                [
                  'BTC',
                  {
                    rate: 1,
                    limits: {
                      minimal: 1_000,
                      maximal: 100_000,
                    },
                  },
                ],
              ]),
            ],
          ]),
        ),
      },
    },
    feeProvider: {
      getPercentageFee: jest.fn().mockReturnValue(0.05),
      getSwapBaseFees: jest.fn().mockReturnValue({
        server: 123,
      }),
    },
  } as any as RateProvider;

  const balanceCheck = {
    checkBalance: jest.fn().mockImplementation(async () => {}),
  } as unknown as BalanceCheck;

  let negotiator: Renegotiator;

  beforeAll(async () => {
    const { provider, signer } = await getSigner();
    currencies.set('RBTC', {
      provider,
      symbol: 'RBTC',
      type: CurrencyType.Ether,
    } as any);
    currencies.set('TBTC', {
      provider,
      symbol: 'TBTC',
      type: CurrencyType.ERC20,
    } as any);

    const { etherSwap, erc20Swap } = await getContracts(signer);

    (swapNursery.ethereumNurseries[0].ethereumManager as any).provider =
      provider;

    contracts.etherSwap = etherSwap;
    contracts.erc20Swap = erc20Swap;

    await bitcoinClient.connect();
  });

  beforeEach(() => {
    negotiator = new Renegotiator(
      Logger.disabledLogger,
      currencies,
      walletManager,
      swapNursery,
      chainSwapSigner,
      eipSigner,
      rateProvider,
      balanceCheck,
    );

    jest.clearAllMocks();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  test('should get quote', async () => {
    const swapId = 'someId';

    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
      chainSwap: {},
      receivingData: {
        symbol: 'BTC',
        amount: 100_000,
      },
      sendingData: {
        symbol: 'BTC',
      },
    });
    negotiator['validateEligibility'] = jest
      .fn()
      .mockImplementation(async () => {});

    await expect(negotiator.getQuote(swapId)).resolves.toEqual(94_877);
  });

  describe('acceptQuote', () => {
    test('should throw when quote is invalid', async () => {
      const swapId = 'someId';

      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        chainSwap: {},
        receivingData: {
          symbol: 'BTC',
          amount: 100_000,
        },
        sendingData: {
          symbol: 'BTC',
        },
      });
      negotiator['validateEligibility'] = jest
        .fn()
        .mockImplementation(async () => {});

      await expect(negotiator.acceptQuote(swapId, 121)).rejects.toEqual(
        Errors.INVALID_QUOTE(),
      );
    });

    test('should throw when balance check fails', async () => {
      const swapId = 'someId';

      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        chainSwap: {},
        receivingData: {
          symbol: 'BTC',
          amount: 100_000,
        },
        sendingData: {
          symbol: 'BTC',
        },
      });
      negotiator['validateEligibility'] = jest
        .fn()
        .mockImplementation(async () => {});

      balanceCheck.checkBalance = jest.fn().mockImplementation(async () => {
        throw Errors.INSUFFICIENT_LIQUIDITY();
      });

      await expect(negotiator.acceptQuote(swapId, 94_877)).rejects.toEqual(
        Errors.INSUFFICIENT_LIQUIDITY(),
      );
      expect(balanceCheck.checkBalance).toHaveBeenCalledTimes(1);
      expect(balanceCheck.checkBalance).toHaveBeenCalledWith('BTC', 94_877);

      balanceCheck.checkBalance = jest.fn().mockImplementation(async () => {});
    });

    describe('UTXO based chain', () => {
      test.each`
        confirmed
        ${true}
        ${false}
      `(
        'should check chain swap lockups of confirmed ($confirmed) transactions',
        async ({ confirmed }) => {
          const transactionId = await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          );

          if (confirmed) {
            await bitcoinClient.generate(1);
          }

          ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
            chainSwap: {},
            receivingData: {
              transactionId,
              symbol: 'BTC',
              amount: 100_000,
            },
            sendingData: {
              symbol: 'BTC',
            },
          });
          ChainSwapRepository.setExpectedAmounts = jest
            .fn()
            .mockImplementation(async (swap) => swap);

          negotiator['validateEligibility'] = jest
            .fn()
            .mockImplementation(async () => {});

          const quote = 94_877;
          await negotiator.acceptQuote('someId', quote);

          expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledTimes(
            1,
          );
          expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledWith(
            expect.anything(),
            5_000,
            100_000,
            quote,
          );

          expect(
            swapNursery.utxoNursery.checkChainSwapTransaction,
          ).toHaveBeenCalledTimes(1);
          expect(
            swapNursery.utxoNursery.checkChainSwapTransaction,
          ).toHaveBeenCalledWith(
            expect.anything(),
            bitcoinClient,
            walletManager.wallets.get('BTC'),
            Transaction.fromHex(
              await bitcoinClient.getRawTransaction(transactionId),
            ),
            confirmed,
          );
        },
      );
    });

    describe('EVM chain', () => {
      test('should throw when there is no receipt for transaction', async () => {
        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
          chainSwap: {},
          receivingData: {
            symbol: 'RBTC',
            amount: 100_000,
            transactionId: `0x${getHexString(randomBytes(32))}`,
          },
          sendingData: {
            symbol: 'BTC',
          },
        });
        ChainSwapRepository.setExpectedAmounts = jest
          .fn()
          .mockImplementation(async (swap) => swap);

        negotiator['validateEligibility'] = jest
          .fn()
          .mockImplementation(async () => {});

        const quote = 94_877;
        await expect(negotiator.acceptQuote('someId', quote)).rejects.toEqual(
          Errors.LOCKUP_NOT_REJECTED(),
        );
      });

      test('should throw when no lockup event can be found in logs of receipt', async () => {
        const { etherBase } = await getSigner();
        const transaction = await etherBase.sendTransaction({
          value: 1,
          to: await etherBase.getAddress(),
        });
        await transaction.wait(1);

        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
          chainSwap: {},
          receivingData: {
            symbol: 'RBTC',
            amount: 100_000,
            transactionId: transaction.hash,
          },
          sendingData: {
            symbol: 'BTC',
          },
        });
        ChainSwapRepository.setExpectedAmounts = jest
          .fn()
          .mockImplementation(async (swap) => swap);

        negotiator['validateEligibility'] = jest
          .fn()
          .mockImplementation(async () => {});

        const swapId = 'someId';
        const quote = 94_877;
        await expect(negotiator.acceptQuote(swapId, quote)).rejects.toEqual(
          Errors.LOCKUP_NOT_REJECTED(),
        );
      });

      test('should handle EtherSwap lockups', async () => {
        const { etherBase, signer, provider } = await getSigner();
        const { etherSwap } = await getContracts(etherBase);

        const preimageHash = randomBytes(32);
        const timelock = 21;
        const amount = 212_212n;

        const transaction = await etherSwap.lock(
          preimageHash,
          await signer.getAddress(),
          timelock,
          {
            value: amount,
          },
        );
        await transaction.wait(1);

        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
          chainSwap: {},
          receivingData: {
            symbol: 'RBTC',
            amount: 100_000,
            transactionId: transaction.hash,
          },
          sendingData: {
            symbol: 'BTC',
          },
        });
        ChainSwapRepository.setExpectedAmounts = jest
          .fn()
          .mockImplementation(async (swap) => swap);

        negotiator['validateEligibility'] = jest
          .fn()
          .mockImplementation(async () => {});

        const swapId = 'someId';
        const quote = 94_877;
        await negotiator.acceptQuote(swapId, quote);

        expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledWith(
          expect.anything(),
          5_000,
          100_000,
          quote,
        );

        const receipt = await provider.getTransactionReceipt(transaction.hash);

        expect(
          swapNursery.ethereumNurseries[0].checkEtherSwapLockup,
        ).toHaveBeenCalledTimes(1);
        expect(
          swapNursery.ethereumNurseries[0].checkEtherSwapLockup,
        ).toHaveBeenCalledWith(expect.anything(), receipt, {
          amount,
          timelock,
          preimageHash,
          claimAddress: await signer.getAddress(),
          refundAddress: await etherBase.getAddress(),
        });
      });

      test('should handle ERC20 lockups', async () => {
        const { etherBase, signer, provider } = await getSigner();
        const { token, erc20Swap } = await getContracts(etherBase);

        const preimageHash = randomBytes(32);
        const timelock = 21;
        const amount = 212_212n;

        await (
          await token.approve(await erc20Swap.getAddress(), amount)
        ).wait(1);
        const transaction = await erc20Swap.lock(
          preimageHash,
          amount,
          await token.getAddress(),
          await signer.getAddress(),
          timelock,
        );
        await transaction.wait(1);

        ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
          chainSwap: {},
          receivingData: {
            symbol: 'TBTC',
            amount: 100_000,
            transactionId: transaction.hash,
          },
          sendingData: {
            symbol: 'BTC',
          },
        });
        ChainSwapRepository.setExpectedAmounts = jest
          .fn()
          .mockImplementation(async (swap) => swap);

        negotiator['validateEligibility'] = jest
          .fn()
          .mockImplementation(async () => {});

        const swapId = 'someId';
        const quote = 94_877;
        await negotiator.acceptQuote(swapId, quote);

        expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledTimes(1);
        expect(ChainSwapRepository.setExpectedAmounts).toHaveBeenCalledWith(
          expect.anything(),
          5_000,
          100_000,
          quote,
        );

        const receipt = await provider.getTransactionReceipt(transaction.hash);

        expect(
          swapNursery.ethereumNurseries[0].checkErc20SwapLockup,
        ).toHaveBeenCalledTimes(1);
        expect(
          swapNursery.ethereumNurseries[0].checkErc20SwapLockup,
        ).toHaveBeenCalledWith(expect.anything(), receipt, {
          amount,
          timelock,
          preimageHash,
          tokenAddress: await token.getAddress(),
          claimAddress: await signer.getAddress(),
          refundAddress: await etherBase.getAddress(),
        });
      });
    });
  });

  test.each`
    rate | userLockAmount | feePercent    | baseFee | expected
    ${1} | ${100_000}     | ${0.01}       | ${500}  | ${{ percentageFee: 1_000, serverLockAmount: 98_500 }}
    ${1} | ${100_000}     | ${0.02}       | ${500}  | ${{ percentageFee: 2_000, serverLockAmount: 97_500 }}
    ${1} | ${100_000}     | ${0.02}       | ${256}  | ${{ percentageFee: 2_000, serverLockAmount: 97_744 }}
    ${1} | ${100_000}     | ${0.01999999} | ${256}  | ${{ percentageFee: 2_000, serverLockAmount: 97_744 }}
    ${2} | ${100_000}     | ${0.02}       | ${500}  | ${{ percentageFee: 4_000, serverLockAmount: 195_500 }}
  `(
    'should calculate server lock amount',
    ({ rate, userLockAmount, feePercent, baseFee, expected }) => {
      expect(
        negotiator.calculateServerLockAmount(
          rate,
          userLockAmount,
          feePercent,
          baseFee,
        ),
      ).toEqual(expected);
    },
  );

  test('should get fees', () => {
    const pair = 'BTC/BTC';
    const side = OrderSide.BUY;

    expect(negotiator.getFees(pair, side, null)).toEqual({
      baseFee: 123,
      feePercent: 0.05,
    });

    expect(rateProvider.feeProvider.getSwapBaseFees).toHaveBeenCalledTimes(1);
    expect(rateProvider.feeProvider.getSwapBaseFees).toHaveBeenCalledWith(
      pair,
      side,
      SwapType.Chain,
      SwapVersion.Taproot,
    );

    expect(rateProvider.feeProvider.getPercentageFee).toHaveBeenCalledTimes(1);
    expect(rateProvider.feeProvider.getPercentageFee).toHaveBeenCalledWith(
      pair,
      side,
      SwapType.Chain,
      PercentageFeeType.Calculation,
      null,
    );
  });

  describe('calculateNewQuote', () => {
    test('should calculate new quotes', async () => {
      await expect(
        negotiator['calculateNewQuote']({
          pair: 'BTC/BTC',
          chainSwap: {},
          receivingData: {
            symbol: 'BTC',
            amount: 10_000,
          },
          sendingData: {
            symbol: 'BTC',
          },
        } as any),
      ).resolves.toEqual({ percentageFee: 500, serverLockAmount: 9377 });
    });

    test('should calculate new quotes with a referral premium', async () => {
      const referral = { some: 'data' };
      ReferralRepository.getReferralById = jest
        .fn()
        .mockResolvedValue(referral);

      await expect(
        negotiator['calculateNewQuote']({
          pair: 'BTC/BTC',
          chainSwap: {
            referral: 'id',
          },
          receivingData: {
            symbol: 'BTC',
            amount: 10_000,
          },
          sendingData: {
            symbol: 'BTC',
          },
        } as any),
      ).resolves.toEqual({ percentageFee: 500, serverLockAmount: 9377 });

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith('id');

      expect(
        rateProvider.providers[SwapVersion.Taproot].getChainPairs,
      ).toHaveBeenCalledTimes(1);
      expect(
        rateProvider.providers[SwapVersion.Taproot].getChainPairs,
      ).toHaveBeenCalledWith(referral);
    });

    test('should throw when pair cannot be found', async () => {
      await expect(
        negotiator['calculateNewQuote']({
          pair: 'not/found',
          chainSwap: {},
          receivingData: {
            symbol: 'not',
          },
          sendingData: {
            symbol: 'found',
          },
        } as any),
      ).rejects.toEqual(Errors.PAIR_NOT_FOUND('not/found'));
    });

    test('should throw when limit is more than maxima', async () => {
      await expect(
        negotiator['calculateNewQuote']({
          pair: 'BTC/BTC',
          chainSwap: {},
          receivingData: {
            symbol: 'BTC',
            amount: 100_001,
          },
          sendingData: {
            symbol: 'BTC',
          },
        } as any),
      ).rejects.toEqual(Errors.EXCEED_MAXIMAL_AMOUNT(100_001, 100_000));
    });

    test('should throw when limit is less than minima', async () => {
      await expect(
        negotiator['calculateNewQuote']({
          pair: 'BTC/BTC',
          chainSwap: {},
          receivingData: {
            symbol: 'BTC',
            amount: 999,
          },
          sendingData: {
            symbol: 'BTC',
          },
        } as any),
      ).rejects.toEqual(Errors.BENEATH_MINIMAL_AMOUNT(999, 1_000));
    });
  });

  describe('validateEligibility', () => {
    test.each`
      swap                                                                                                                                   | failureReason
      ${{ status: SwapUpdateEvent.TransactionLockupFailed, receivingData: { amount: 1, expectedAmount: 2, timeoutBlockHeight: 1_000_000 } }} | ${ErrorsSwap.INSUFFICIENT_AMOUNT(1, 2).message}
      ${{ status: SwapUpdateEvent.TransactionLockupFailed, receivingData: { amount: 2, expectedAmount: 1, timeoutBlockHeight: 1_000_000 } }} | ${ErrorsSwap.OVERPAID_AMOUNT(2, 1).message}
    `(
      'should accept failure reason: $failureReason',
      async ({ swap, failureReason }) => {
        await negotiator['validateEligibility'](
          {
            ...swap,
            chainSwap: { failureReason },
            createdRefundSignature: false,
          } as any,
          currencies.get('BTC'),
        );
      },
    );

    test('should throw when a refund signature was created already', async () => {
      await expect(
        negotiator['validateEligibility'](
          { createdRefundSignature: true } as any,
          {} as any,
        ),
      ).rejects.toEqual(Errors.REFUND_SIGNED_ALREADY());
    });

    test.each`
      swap
      ${{ status: SwapUpdateEvent.SwapCreated }}
      ${{ status: SwapUpdateEvent.TransactionClaimed }}
      ${{ status: SwapUpdateEvent.TransactionConfirmed }}
      ${{ status: SwapUpdateEvent.TransactionServerMempool }}
      ${{ status: SwapUpdateEvent.TransactionLockupFailed, chainSwap: { failureReason: ErrorsSwap.INVALID_ADDRESS().message }, receivingData: { amount: 1, expectedAmount: 2 } }}
    `('should throw when status is not lockup failed', async ({ swap }) => {
      await expect(
        negotiator['validateEligibility'](
          {
            ...swap,
            createdRefundSignature: false,
          } as any,
          {} as any,
        ),
      ).rejects.toEqual(Errors.LOCKUP_NOT_REJECTED());
    });

    test('should throw when there is too little time left until expiry', async () => {
      const timeoutBlockHeight = Math.floor(
        (await bitcoinClient.getBlockchainInfo()).blocks +
          Renegotiator['minimumLeftUntilExpiryMinutes'] / 10 -
          1,
      );

      await expect(
        negotiator['validateEligibility'](
          {
            createdRefundSignature: false,
            status: SwapUpdateEvent.TransactionLockupFailed,
            chainSwap: {
              failureReason: ErrorsSwap.INSUFFICIENT_AMOUNT(1, 2).message,
            },
            receivingData: {
              timeoutBlockHeight,
              amount: 1,
              expectedAmount: 2,
            },
          } as any,
          currencies.get('BTC'),
        ),
      ).rejects.toEqual(Errors.TIME_UNTIL_EXPIRY_TOO_SHORT());
    });
  });

  describe('getSwap', () => {
    test('should get swap and receiving currency', async () => {
      const swap = {
        id: 'asdf',
        receivingData: {
          symbol: 'BTC',
        },
      };
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(swap);

      await expect(negotiator['getSwap'](swap.id)).resolves.toEqual({
        swap,
        receivingCurrency: currencies.get('BTC'),
      });

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: swap.id,
      });
    });

    test('should throw when swap cannot be found', async () => {
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      const id = 'someId';
      await expect(negotiator['getSwap'](id)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(id),
      );
    });

    test('should throw when receiving currency cannot be found', async () => {
      const symbol = 'notFound';
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        receivingData: {
          symbol,
        },
      });

      await expect(negotiator['getSwap']('someId')).rejects.toEqual(
        Errors.CURRENCY_NOT_FOUND(symbol),
      );
    });
  });

  describe('getBlockHeight', () => {
    test('should get block height for chain clients', async () => {
      await expect(
        negotiator['getBlockHeight'](currencies.get('BTC')),
      ).resolves.toEqual((await bitcoinClient.getBlockchainInfo()).blocks);
    });

    test('should get block height for Ethereum providers', async () => {
      const currency = currencies.get('RBTC');
      await expect(negotiator['getBlockHeight'](currency)).resolves.toEqual(
        await currency.provider.getBlockNumber(),
      );
    });

    test('should throw when no chain connection is available for currency', async () => {
      const currency = { symbol: 'ETH' } as any;
      await expect(negotiator['getBlockHeight'](currency)).rejects.toEqual(
        Errors.CURRENCY_NOT_FOUND(currency.symbol),
      );
    });
  });
});
