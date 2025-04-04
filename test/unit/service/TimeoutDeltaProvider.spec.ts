import { existsSync, unlinkSync } from 'fs';
import type { ConfigType } from '../../../lib/Config';
import { ECPair } from '../../../lib/ECPairHelper';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import { OrderSide, SwapType, SwapVersion } from '../../../lib/consts/Enums';
import type { PairConfig } from '../../../lib/consts/Types';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
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
import { Ethereum, Rsk } from '../../../lib/wallet/ethereum/EvmNetworks';

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
] as any as PairConfig[];

describe('TimeoutDeltaProvider', () => {
  const configpath = 'config.toml';

  const cleanup = () => {
    if (existsSync(configpath)) {
      unlinkSync(configpath);
    }
  };

  const sidecar = {} as unknown as Sidecar;

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
    new Map<string, Currency>(),
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

  beforeAll(() => {
    cleanup();

    deltaProvider.init(currencies, [
      {
        networkDetails: Ethereum,
        tokenAddresses: new Map<string, string>([
          ['USDT', '0xUSDT'],
          ['USDC', '0xUSDC'],
        ]),
      } as EthereumManager,
      {
        networkDetails: Rsk,
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
    expect(TimeoutDeltaProvider.blockTimes.size).toEqual(9);
    expect(TimeoutDeltaProvider.blockTimes.get('USDT')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(Ethereum.symbol),
    );
    expect(TimeoutDeltaProvider.blockTimes.get('USDC')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(Ethereum.symbol),
    );
    expect(TimeoutDeltaProvider.blockTimes.get('DLLR')).toEqual(
      TimeoutDeltaProvider.blockTimes.get(Rsk.symbol),
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
    const mockQueryRoutes = jest.fn().mockResolvedValue({ routesList: [] });
    const lnd = {
      queryRoutes: mockQueryRoutes,
    } as unknown as LndClient;

    const dec = {
      minFinalCltv: 80,
      routingHints: [],
      amountMsat: 10_000_000,
      type: InvoiceType.Bolt11,
      features: new Set<InvoiceFeature>(),
      payee: ECPair.makeRandom().publicKey,
    } as unknown as DecodedInvoice;

    const cltvLimit = 123;

    await deltaProvider.checkRoutability(lnd, dec, cltvLimit);
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
      1,
      getHexString(dec.payee!),
      msatToSat(dec.amountMsat),
      cltvLimit,
      dec.minFinalCltv,
      dec.routingHints,
    );

    await deltaProvider.checkRoutability(
      lnd,
      {
        ...dec,
        features: new Set<InvoiceFeature>([InvoiceFeature.MPP]),
      } as unknown as DecodedInvoice,
      cltvLimit,
    );
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
      2,
      getHexString(dec.payee!),
      Math.ceil(msatToSat(dec.amountMsat) / LndClient.paymentMaxParts),
      cltvLimit,
      dec.minFinalCltv,
      dec.routingHints,
    );
  });

  test('should have a floor of 1 sat for querying routes', async () => {
    const mockQueryRoutes = jest.fn().mockResolvedValue({ routesList: [] });
    const lnd = {
      queryRoutes: mockQueryRoutes,
    } as unknown as LndClient;

    const dec: DecodedInvoice = {
      amountMsat: 0,
      minFinalCltv: 80,
      routingHints: [],
      payee: ECPair.makeRandom().publicKey,
      features: new Set<InvoiceFeature>(),
    } as unknown as DecodedInvoice;

    const cltvLimit = 210;

    await deltaProvider.checkRoutability(lnd, dec, cltvLimit);
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
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
    await expect(
      deltaProvider.checkRoutability(
        {} as unknown as LndClient,
        {
          paymentHash,
          minFinalCltv: 144,
        } as unknown as DecodedInvoice,
        cltvLimit,
      ),
    ).resolves.toEqual(160);

    expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
      preimageHash: getHexString(paymentHash),
    });
    expect(sidecar.decodeInvoiceOrOffer).toHaveBeenCalledWith('invoice');
  });
});
