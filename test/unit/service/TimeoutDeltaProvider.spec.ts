import { existsSync, unlinkSync } from 'fs';
import type { ConfigType } from '../../../lib/Config';
import { ECPair } from '../../../lib/ECPairHelper';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import ArkClient from '../../../lib/chain/ArkClient';
import ElementsClient from '../../../lib/chain/ElementsClient';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapVersion,
} from '../../../lib/consts/Enums';
import type { PairConfig } from '../../../lib/consts/Types';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type Swap from '../../../lib/db/models/Swap';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import { msatToSat } from '../../../lib/lightning/ChannelUtils';
import { InvoiceFeature } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import Errors from '../../../lib/service/Errors';
import type { PairTimeoutBlocksDelta } from '../../../lib/service/TimeoutDeltaProvider';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import type DecodedInvoice from '../../../lib/sidecar/DecodedInvoice';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import type { Currency } from '../../../lib/wallet/WalletManager';
import type EthereumManager from '../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';

const currencies = [
  {
    base: 'BTC',
    quote: 'BTC',
    timeoutDelta: {
      chain: 1000,
      reverse: 1440,
      swapMinimal: 360,
      swapMaximal: 2880,
      swapTaproot: 10080,
    },
  },
  {
    base: 'LTC',
    quote: 'BTC',
    timeoutDelta: 20,
  },
  {
    base: 'L-BTC',
    quote: 'BTC',
    timeoutDelta: {
      reverse: 1440,
      swapMinimal: 1400,
      swapMaximal: 2880,
      swapTaproot: 10080,
    },
  },
  {
    base: 'ETH',
    quote: 'BTC',
    timeoutDelta: 10,
  },
  {
    base: 'USDT',
    quote: 'BTC',
    timeoutDelta: 10,
  },
  {
    base: 'ARK',
    quote: 'BTC',
    timeoutDelta: 1000,
  },
] as any as PairConfig[];

describe('TimeoutDeltaProvider', () => {
  const configpath = 'config.toml';

  const cleanup = () => {
    if (existsSync(configpath)) {
      unlinkSync(configpath);
    }
  };

  const sidecar = {} as unknown as Sidecar;

  const currenciesMap = new Map<string, Currency>([
    [
      'BTC',
      {
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        chainClient: {
          getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: 100 }),
        },
      } as unknown as Currency,
    ],
    [
      'LTC',
      {
        symbol: 'LTC',
        type: CurrencyType.BitcoinLike,
        chainClient: {
          getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: 50 }),
        },
      } as unknown as Currency,
    ],
    [
      ElementsClient.symbol,
      {
        symbol: ElementsClient.symbol,
        type: CurrencyType.Liquid,
        chainClient: {
          getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: 200 }),
        },
      } as unknown as Currency,
    ],
    [
      'ETH',
      {
        symbol: 'ETH',
        type: CurrencyType.Ether,
        provider: {
          getLocktimeHeight: jest.fn().mockResolvedValue(1000),
        },
      } as unknown as Currency,
    ],
    [
      'USDT',
      {
        symbol: 'USDT',
        type: CurrencyType.ERC20,
        provider: {
          getLocktimeHeight: jest.fn().mockResolvedValue(1500),
        },
      } as unknown as Currency,
    ],
    [
      ArkClient.symbol,
      {
        symbol: ArkClient.symbol,
        type: CurrencyType.Ark,
        arkNode: {
          getBlockHeight: jest.fn().mockResolvedValue(500),
          usesLocktimeSeconds: false,
        },
      } as unknown as Currency,
    ],
  ]);

  const deltaProvider = new TimeoutDeltaProvider(
    Logger.disabledLogger,
    {
      configpath,
      pairs: [
        {
          base: 'LTC',
          quote: 'BTC',
        },
      ],
      currencies: [],
    } as unknown as ConfigType,
    sidecar,
    currenciesMap,
    new NodeSwitch(Logger.disabledLogger),
    {
      cltvDelta: 20,
    },
  );

  const createDeltas = (val: number): PairTimeoutBlocksDelta => {
    return {
      chain: val,
      reverse: val,
      swapMinimal: val,
      swapMaximal: val,
      swapTaproot: val,
    };
  };

  const mockChainClient = {
    getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: 100 }),
  } as any;

  const createMockLndClient = (queryRoutesResponse: any[] = []) =>
    ({
      type: NodeType.LND,
      queryRoutes: jest.fn().mockResolvedValue(queryRoutesResponse),
    }) as unknown as LndClient;

  const createMockClnClient = (queryRoutesResponse: any[] = []) =>
    ({
      type: NodeType.CLN,
      queryRoutes: jest.fn().mockResolvedValue(queryRoutesResponse),
    }) as unknown as LndClient;

  const createDecodedInvoice = (
    overrides: Partial<DecodedInvoice> = {},
  ): DecodedInvoice =>
    ({
      minFinalCltv: 80,
      routingHints: [],
      amountMsat: 10_000_000,
      type: InvoiceType.Bolt11,
      features: new Set<InvoiceFeature>(),
      payee: ECPair.makeRandom().publicKey,
      ...overrides,
    }) as unknown as DecodedInvoice;

  beforeAll(() => {
    cleanup();

    deltaProvider.init(currencies, [
      {
        networkDetails: networks.Ethereum,
        tokenAddresses: new Map<string, string>([
          ['USDT', '0xUSDT'],
          ['USDC', '0xUSDC'],
        ]),
      } as EthereumManager,
      {
        networkDetails: networks.Rootstock,
        tokenAddresses: new Map<string, string>([['DLLR', '0xDLLR']]),
      } as EthereumManager,
    ]);
  });

  afterAll(() => {
    cleanup();
  });

  test('should init', () => {
    const deltas = deltaProvider['timeoutDeltas'];

    expect(deltas.size).toEqual(currencies.length);
    expect(deltas.get('BTC/BTC')).toEqual({
      base: {
        chain: 100,
        reverse: 144,
        swapMinimal: 36,
        swapMaximal: 288,
        swapTaproot: 1008,
      },
      quote: {
        chain: 100,
        reverse: 144,
        swapMinimal: 36,
        swapMaximal: 288,
        swapTaproot: 1008,
      },
    });
    expect(deltas.get('LTC/BTC')).toEqual({
      base: createDeltas(8),
      quote: createDeltas(2),
    });
    expect(deltas.get('ETH/BTC')).toEqual({
      base: createDeltas(50),
      quote: createDeltas(1),
    });
    expect(deltas.get('USDT/BTC')).toEqual({
      base: createDeltas(50),
      quote: createDeltas(1),
    });
    expect(deltas.get('ARK/BTC')).toEqual({
      base: createDeltas(100),
      quote: createDeltas(100),
    });
  });

  test('should not init if no timeout delta was provided', () => {
    expect(() =>
      deltaProvider.init(
        [
          {
            base: 'should',
            quote: 'throw',
          },
        ] as PairConfig[],
        [],
      ),
    ).toThrow(Errors.NO_TIMEOUT_DELTA('should/throw').message);
  });

  test('should set block times of tokens', () => {
    expect(TimeoutDeltaProvider.blockTimes.size).toEqual(10);
    expect(TimeoutDeltaProvider.blockTimes.get('USDT')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(networks.Ethereum.symbol),
    );
    expect(TimeoutDeltaProvider.blockTimes.get('USDC')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(networks.Ethereum.symbol),
    );
    expect(TimeoutDeltaProvider.blockTimes.get('DLLR')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(networks.Rootstock.symbol),
    );
  });

  test('should get timeout deltas', async () => {
    const pairId = 'LTC/BTC';

    await expect(
      deltaProvider.getTimeout(
        pairId,
        OrderSide.BUY,
        SwapType.ReverseSubmarine,
        SwapVersion.Legacy,
      ),
    ).resolves.toEqual([8, false]);
    await expect(
      deltaProvider.getTimeout(
        pairId,
        OrderSide.BUY,
        SwapType.Submarine,
        SwapVersion.Legacy,
      ),
    ).resolves.toEqual([2, true]);

    await expect(
      deltaProvider.getTimeout(
        pairId,
        OrderSide.SELL,
        SwapType.ReverseSubmarine,
        SwapVersion.Legacy,
      ),
    ).resolves.toEqual([2, false]);
    await expect(
      deltaProvider.getTimeout(
        pairId,
        OrderSide.SELL,
        SwapType.Submarine,
        SwapVersion.Legacy,
      ),
    ).resolves.toEqual([8, true]);

    await expect(
      deltaProvider.getTimeout(
        'BTC/BTC',
        OrderSide.SELL,
        SwapType.Submarine,
        SwapVersion.Legacy,
      ),
    ).resolves.toEqual([36, true]);
    await expect(
      deltaProvider.getTimeout(
        'BTC/BTC',
        OrderSide.SELL,
        SwapType.Submarine,
        SwapVersion.Taproot,
      ),
    ).resolves.toEqual([1008, true]);

    // Should throw if pair cannot be found
    const notFound = 'notFound';

    await expect(
      deltaProvider.getTimeout(
        notFound,
        OrderSide.SELL,
        SwapType.ReverseSubmarine,
        SwapVersion.Legacy,
      ),
    ).rejects.toEqual(Errors.PAIR_NOT_FOUND(notFound));
  });

  test('should convert blocks', () => {
    expect(TimeoutDeltaProvider.convertBlocks('LTC', 'BTC', 1)).toEqual(1);
    expect(TimeoutDeltaProvider.convertBlocks('LTC', 'BTC', 11)).toEqual(3);

    expect(TimeoutDeltaProvider.convertBlocks('BTC', 'LTC', 1)).toEqual(4);
    expect(TimeoutDeltaProvider.convertBlocks('BTC', 'LTC', 3)).toEqual(12);
  });

  test('should detect invoice MPP support', async () => {
    const lnd = createMockLndClient([]);
    const dec = createDecodedInvoice();
    const cltvLimit = 123;

    await deltaProvider.checkRoutability(mockChainClient, lnd, dec, cltvLimit);
    expect(lnd.queryRoutes).toHaveBeenNthCalledWith(
      1,
      getHexString(dec.payee!),
      msatToSat(dec.amountMsat),
      cltvLimit,
      dec.minFinalCltv,
      dec.routingHints,
    );

    const lndWithMpp = createMockLndClient([]);
    const decWithMpp = createDecodedInvoice({
      features: new Set<InvoiceFeature>([InvoiceFeature.MPP]),
    });
    await deltaProvider.checkRoutability(
      mockChainClient,
      lndWithMpp,
      decWithMpp,
      cltvLimit,
    );
    expect(lndWithMpp.queryRoutes).toHaveBeenNthCalledWith(
      1,
      getHexString(decWithMpp.payee!),
      Math.ceil(msatToSat(decWithMpp.amountMsat) / LndClient.paymentMaxParts),
      cltvLimit,
      decWithMpp.minFinalCltv,
      decWithMpp.routingHints,
    );
  });

  test('should have a floor of 1 sat for querying routes', async () => {
    const lnd = createMockLndClient([]);
    const dec = createDecodedInvoice({ amountMsat: 0 });
    const cltvLimit = 210;

    await deltaProvider.checkRoutability(mockChainClient, lnd, dec, cltvLimit);
    expect(lnd.queryRoutes).toHaveBeenNthCalledWith(
      1,
      getHexString(dec.payee!),
      1,
      cltvLimit,
      dec.minFinalCltv,
      dec.routingHints,
    );
  });

  test('should try to find reverse swap with preimage hash', async () => {
    ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
      invoice: 'invoice',
    } as unknown as ReverseSwap);

    sidecar.decodeInvoiceOrOffer = jest.fn().mockResolvedValue({
      minFinalCltv: 160,
    } as unknown as DecodedInvoice);

    const cltvLimit = 123;
    const paymentHash = getHexBuffer(
      'f4fc9c57827914015ab7375d2542e87af9e0cb11e182059ab2d4974a053c38d6',
    );
    const dec = createDecodedInvoice({
      paymentHash,
      minFinalCltv: 144,
    });

    await expect(
      deltaProvider.checkRoutability(
        mockChainClient,
        {} as unknown as LndClient,
        dec,
        cltvLimit,
      ),
    ).resolves.toEqual(160);

    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(paymentHash),
    });
    expect(sidecar.decodeInvoiceOrOffer).toHaveBeenCalledWith('invoice');
  });

  test('should calculate CLTV for LND (absolute blocks)', async () => {
    const currentBlocks = 800_000;
    const routeCltv = 800_144;
    const lnd = createMockLndClient([
      { ctlv: routeCltv },
      { ctlv: routeCltv - 10 },
    ]);
    const mockChain = {
      getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: currentBlocks }),
    } as any;
    const dec = createDecodedInvoice();

    const result = await deltaProvider.checkRoutability(
      mockChain,
      lnd,
      dec,
      200,
    );

    // LND returns absolute blocks, so it should subtract current block height
    expect(result).toEqual(routeCltv - currentBlocks);
  });

  test('should calculate CLTV for CLN (relative blocks)', async () => {
    const routeCltv = 144;
    const cln = createMockClnClient([{ ctlv: routeCltv }, { ctlv: routeCltv }]);
    const dec = createDecodedInvoice();

    const result = await deltaProvider.checkRoutability(
      mockChainClient,
      cln,
      dec,
      200,
    );

    // CLN returns relative blocks, so it should return the value as is
    expect(result).toEqual(routeCltv);
  });

  test('should return highest CLTV from multiple routes', async () => {
    const lnd = createMockLndClient([
      { ctlv: 800_100 },
      { ctlv: 800_200 },
      { ctlv: 800_150 },
    ]);
    const mockChain = {
      getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: 800_000 }),
    } as any;
    const dec = createDecodedInvoice();

    const result = await deltaProvider.checkRoutability(
      mockChain,
      lnd,
      dec,
      250,
    );

    expect(result).toEqual(200);
  });

  test('should return noRoutes when routes query fails', async () => {
    const mockQueryRoutes = jest
      .fn()
      .mockRejectedValue(new Error('No route found'));
    const lnd = {
      type: NodeType.LND,
      queryRoutes: mockQueryRoutes,
    } as unknown as LndClient;
    const dec = createDecodedInvoice();

    const result = await deltaProvider.checkRoutability(
      mockChainClient,
      lnd,
      dec,
      200,
    );

    expect(result).toEqual(TimeoutDeltaProvider.noRoutes);
  });

  test('should return noRoutes when no routes are available', async () => {
    const cln = createMockClnClient([]);
    const dec = createDecodedInvoice();

    const result = await deltaProvider.checkRoutability(
      mockChainClient,
      cln,
      dec,
      200,
    );

    expect(result).toEqual(TimeoutDeltaProvider.noRoutes);
  });

  describe('getCltvLimit', () => {
    test.each`
      description                 | pair                              | orderSide         | timeoutBlockHeight | expectedLimit
      ${'BitcoinLike currencies'} | ${'BTC/BTC'}                      | ${OrderSide.BUY}  | ${150}             | ${30}
      ${'Liquid currencies'}      | ${`${ElementsClient.symbol}/BTC`} | ${OrderSide.SELL} | ${2_500}           | ${210}
      ${'Ether currencies'}       | ${'ETH/BTC'}                      | ${OrderSide.SELL} | ${6_050}           | ${81}
      ${'ERC20 currencies'}       | ${'USDT/BTC'}                     | ${OrderSide.SELL} | ${15_050}          | ${251}
      ${'ARK with block heights'} | ${`${ArkClient.symbol}/BTC`}      | ${OrderSide.BUY}  | ${550}             | ${430}
    `(
      'should get CLTV limit for $description',
      async ({ pair, orderSide, timeoutBlockHeight, expectedLimit }) => {
        const swap = {
          pair,
          orderSide,
          timeoutBlockHeight,
        } as Swap;

        await expect(deltaProvider.getCltvLimit(swap)).resolves.toEqual(
          expectedLimit,
        );
      },
    );

    test('should get CLTV limit for ARK with timestamp-based locks', async () => {
      const currentTimestamp = 1_000_000;

      const arkCurrency = currenciesMap.get(ArkClient.symbol)!;

      arkCurrency.arkNode = {
        usesLocktimeSeconds: true,
        getBlockHeight: jest.fn().mockResolvedValue(500),
        getBlockTimestamp: jest.fn().mockResolvedValue(currentTimestamp),
      } as any;

      const swap = {
        pair: `${ArkClient.symbol}/BTC`,
        orderSide: OrderSide.SELL,
        timeoutBlockHeight: currentTimestamp + 500 * 60,
      } as Swap;

      await expect(deltaProvider.getCltvLimit(swap)).resolves.toEqual(30);

      arkCurrency.arkNode = {
        getBlockHeight: jest.fn().mockResolvedValue(500),
        usesLocktimeSeconds: false,
      } as any;
    });
  });
});
