import Logger from '../../../../lib/Logger';
import { Currency } from '../../../../lib/wallet/WalletManager';
import RoutingHints from '../../../../lib/swap/routing/RoutingHints';

const mockStart = jest.fn().mockResolvedValue(undefined);
const mockRoutingHints = jest.fn().mockResolvedValue('lnd');

jest.mock('../../../../lib/swap/routing/RoutingHintsLnd', () => {
  return jest.fn().mockImplementation(() => {
    return {
      start: mockStart,
      routingHints: mockRoutingHints,
    };
  });
});

describe('RoutingHints', () => {
  const clnClient = {
    routingHints: jest.fn().mockResolvedValue('cln'),
  };

  const hints = new RoutingHints(Logger.disabledLogger, [
    {
      symbol: 'lnd',
      lndClient: {},
    } as unknown as Currency,
    {
      clnClient,
      symbol: 'cln',
    } as unknown as Currency,
    {
      clnClient,
      symbol: 'both',
      lndClient: {},
    } as unknown as Currency,
    {
      symbol: 'neither',
    } as unknown as Currency,
  ]);

  test('should initialize', () => {
    const providers = hints['providers'];

    expect(providers.size).toEqual(3);
    expect(providers.get('lnd')).toEqual({
      lnd: expect.anything(),
    });
    expect(providers.get('cln')).toEqual({
      cln: clnClient,
    });
    expect(providers.get('both')).toEqual({
      cln: clnClient,
      lnd: expect.anything(),
    });
  });

  test('should start', async () => {
    await hints.start();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  test.each`
    symbol       | expected
    ${'lnd'}     | ${'lnd'}
    ${'cln'}     | ${'cln'}
    ${'both'}    | ${'lnd'}
    ${'neither'} | ${[]}
  `('should get routing hints for $symbol', async ({ symbol, expected }) => {
    await expect(hints.getRoutingHints(symbol, 'node')).resolves.toEqual(
      expected,
    );
  });
});
