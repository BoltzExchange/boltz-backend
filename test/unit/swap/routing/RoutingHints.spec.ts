import Logger from '../../../../lib/Logger';
import { Currency } from '../../../../lib/wallet/WalletManager';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import RoutingHints from '../../../../lib/swap/routing/RoutingHints';

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
    stop: jest.fn(),
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
    expect(providers.get('neither')).toBeUndefined();
  });

  test('should start', async () => {
    await hints.start();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  test('should stop', async () => {
    hints.stop();
    expect(mockStop).toHaveBeenCalledTimes(2);
    expect(clnClient.stop).toHaveBeenCalledTimes(2);
  });

  test.each`
    symbol       | nodeType        | expected
    ${'lnd'}     | ${undefined}    | ${'lnd'}
    ${'lnd'}     | ${NodeType.LND} | ${'lnd'}
    ${'lnd'}     | ${NodeType.CLN} | ${'lnd'}
    ${'cln'}     | ${undefined}    | ${'cln'}
    ${'cln'}     | ${NodeType.LND} | ${'cln'}
    ${'cln'}     | ${NodeType.CLN} | ${'cln'}
    ${'both'}    | ${undefined}    | ${'lnd'}
    ${'both'}    | ${NodeType.LND} | ${'lnd'}
    ${'both'}    | ${NodeType.CLN} | ${'cln'}
    ${'neither'} | ${undefined}    | ${[]}
  `(
    'should get routing hints for $symbol $nodeType',
    async ({ symbol, nodeType, expected }) => {
      await expect(
        hints.getRoutingHints(symbol, 'node', nodeType),
      ).resolves.toEqual(expected);
    },
  );

  test.each`
    type            | expected
    ${NodeType.LND} | ${'lnd'}
    ${NodeType.CLN} | ${'cln'}
    ${'asdf'}       | ${undefined}
    ${42}           | ${undefined}
  `('should get provider for node type $type', ({ type, expected }) => {
    expect(
      RoutingHints['getProviderForNodeType'](
        { lnd: 'lnd', cln: 'cln' } as any,
        type,
      ),
    ).toEqual(expected);
  });
});
