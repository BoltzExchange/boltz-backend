import Logger from '../../../../lib/Logger';
import ArbitrumProvider from '../../../../lib/wallet/ethereum/ArbitrumProvider';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    addTransaction: jest.fn().mockResolvedValue(null),
    getHighestNonce: jest.fn().mockResolvedValue(undefined),
  }),
);

const arbitrumEndpoint = 'https://arb1.arbitrum.io/rpc';

describe('ArbitrumProvider (integration)', () => {
  jest.setTimeout(60_000);

  let provider: ArbitrumProvider;

  beforeAll(async () => {
    provider = new ArbitrumProvider(Logger.disabledLogger, networks.Arbitrum, {
      providers: [{ name: 'arb1', endpoint: arbitrumEndpoint }],
    } as never);
    await provider.init();
  });

  afterAll(async () => {
    await provider.destroy();
  });

  describe('getLatestBlock', () => {
    test('returns the L1 block referenced by the latest L2 block', async () => {
      const blk = await provider['getLatestBlock']();

      expect(typeof blk.number).toEqual('number');
      expect(blk.number).toBeGreaterThan(0);
      expect(typeof blk.l1BlockNumber).toEqual('number');
      expect(blk.l1BlockNumber).toBeGreaterThan(0);
    });

    test('agrees with the L1 ref reported by a separate eth_getBlockByNumber call', async () => {
      const [blk, raw] = await Promise.all([
        provider['getLatestBlock'](),
        provider['forwardMethod']<{ number: string; l1BlockNumber: string }>(
          'send',
          'eth_getBlockByNumber',
          ['latest', false],
        ),
      ]);

      const rawL2 = parseInt(raw.number, 16);
      const rawL1 = parseInt(raw.l1BlockNumber, 16);

      expect(Math.abs(blk.number - rawL2)).toBeLessThanOrEqual(5);
      expect(
        Math.abs((blk.l1BlockNumber as number) - rawL1),
      ).toBeLessThanOrEqual(2);
    });
  });

  describe('block poller', () => {
    test('delivers a BlockEvent with both number and l1BlockNumber via onBlock', async () => {
      const block = await new Promise<{
        number: number;
        l1BlockNumber?: number;
      }>((resolve) => {
        provider.onBlock(resolve);
      });

      expect(block.number).toBeGreaterThan(0);
      expect(block.l1BlockNumber).toBeGreaterThan(0);
    });
  });
});
