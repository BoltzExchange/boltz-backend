import Logger from '../../../lib/Logger';
import ChainClient from '../../../lib/chain/ChainClient';
import type Sidecar from '../../../lib/sidecar/Sidecar';

jest.mock('../../../lib/chain/RpcClient', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('../../../lib/chain/Rebroadcaster', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('ChainClient', () => {
  const mockSidecar = {
    on: jest.fn(),
  } as unknown as Sidecar;

  const baseConfig = {
    host: '127.0.0.1',
    port: 8332,
    user: 'bitcoin',
    password: 'password',
  };

  test.each`
    network      | expectedIsRegtest
    ${'mainnet'} | ${false}
    ${'testnet'} | ${false}
    ${'signet'}  | ${false}
    ${'regtest'} | ${true}
  `(
    'should construct with network $network',
    ({ network, expectedIsRegtest }) => {
      const symbol = 'BTC';
      const client = new ChainClient(
        Logger.disabledLogger,
        mockSidecar,
        network,
        baseConfig,
        symbol,
      );

      expect(client.symbol).toEqual(symbol);
      expect(client.isRegtest).toEqual(expectedIsRegtest);
    },
  );
});
