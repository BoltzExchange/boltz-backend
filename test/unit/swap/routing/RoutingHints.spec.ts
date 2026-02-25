import Logger from '../../../../lib/Logger';
import RoutingHints from '../../../../lib/swap/routing/RoutingHints';
import type { Currency } from '../../../../lib/wallet/WalletManager';

const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn();
const mockRoutingHints = jest.fn().mockResolvedValue('lnd');

jest.mock('../../../../lib/swap/routing/RoutingHintsLnd', () => {
  return jest.fn().mockImplementation(() => {
    return {
      start: mockStart,
      stop: mockStop,
      routingHints: mockRoutingHints,
    };
  });
});

describe('RoutingHints', () => {
  const clnClient = {
    id: 'cln-1',
    stop: jest.fn(),
    routingHints: jest.fn().mockResolvedValue('cln'),
  };

  const hints = new RoutingHints(Logger.disabledLogger, [
    {
      symbol: 'lnd',
      lndClients: new Map([['lnd-1', {}]]),
    } as unknown as Currency,
    {
      clnClient,
      symbol: 'cln',
      lndClients: new Map(),
    } as unknown as Currency,
    {
      clnClient,
      symbol: 'both',
      lndClients: new Map([['lnd-2', {}]]),
    } as unknown as Currency,
    {
      symbol: 'neither',
      lndClients: new Map(),
    } as unknown as Currency,
  ]);

  test('should initialize', () => {
    const providers = hints['providers'];

    expect(providers.size).toEqual(3);
    expect(providers.get('lnd')?.lnds.size).toEqual(1);
    expect(providers.get('lnd')?.cln).toBeUndefined();
    expect(providers.get('cln')?.lnds.size).toEqual(0);
    expect(providers.get('cln')?.cln).toEqual(clnClient);
    expect(providers.get('both')?.lnds.size).toEqual(1);
    expect(providers.get('both')?.cln).toEqual(clnClient);
    expect(providers.get('neither')).toBeUndefined();
  });

  test('should start', async () => {
    await hints.start();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  test('should stop', async () => {
    hints.stop();
    expect(mockStop).toHaveBeenCalledTimes(2);
    expect(clnClient.stop).not.toHaveBeenCalled();
  });

  test.each`
    symbol       | nodeId       | expected
    ${'lnd'}     | ${undefined} | ${'lnd'}
    ${'lnd'}     | ${'lnd-1'}   | ${'lnd'}
    ${'lnd'}     | ${'cln-1'}   | ${'lnd'}
    ${'cln'}     | ${undefined} | ${'cln'}
    ${'cln'}     | ${'lnd-1'}   | ${'cln'}
    ${'cln'}     | ${'cln-1'}   | ${'cln'}
    ${'both'}    | ${undefined} | ${'lnd'}
    ${'both'}    | ${'lnd-2'}   | ${'lnd'}
    ${'both'}    | ${'cln-1'}   | ${'cln'}
    ${'neither'} | ${undefined} | ${[]}
  `(
    'should get routing hints for $symbol $nodeId',
    async ({ symbol, nodeId, expected }) => {
      await expect(
        hints.getRoutingHints(symbol, 'node', nodeId),
      ).resolves.toEqual(expected);
    },
  );
});
