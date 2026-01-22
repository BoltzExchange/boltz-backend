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

  describe('feeFloor config parsing', () => {
    test('should use default feeFloor when not provided in config', () => {
      const client = new ChainClient(
        Logger.disabledLogger,
        mockSidecar,
        'mainnet',
        baseConfig,
        'BTC',
      );

      expect(client.feeFloor).toEqual(0.2);
    });

    test('should use custom feeFloor when provided in config', () => {
      const customFeeFloor = 1.0;
      const client = new ChainClient(
        Logger.disabledLogger,
        mockSidecar,
        'mainnet',
        {
          ...baseConfig,
          feeFloor: customFeeFloor,
        },
        'BTC',
      );

      expect(client.feeFloor).toEqual(customFeeFloor);
    });
  });
});
