import Logger from '../../../lib/Logger';
import { CurrencyType } from '../../../lib/consts/Enums';
import LndClient from '../../../lib/lightning/LndClient';
import RoutingFee from '../../../lib/lightning/RoutingFee';
import Sidecar from '../../../lib/sidecar/Sidecar';
import {
  type Currency,
  getLightningClientById,
  getLightningClients,
} from '../../../lib/wallet/WalletManager';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  clnClient,
  lndDataPath,
} from '../Nodes';
import { sidecar, startSidecar } from '../sidecar/Utils';

describe('MultiNodeConnection', () => {
  const createUnreachableLndClient = () =>
    new LndClient(
      Logger.disabledLogger,
      'BTC',
      {
        host: '127.0.0.1',
        port: 59999, // Nothing listening
        certpath: `${lndDataPath(1)}/tls.cert`,
        macaroonpath: `${lndDataPath(1)}/data/chain/bitcoin/regtest/admin.macaroon`,
      },
      sidecar,
      new RoutingFee(Logger.disabledLogger),
    );

  beforeAll(async () => {
    await startSidecar();
    await bitcoinClient.generate(1);
    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );
  });

  afterAll(async () => {
    await Sidecar.stop();
    sidecar.disconnect();

    bitcoinLndClient.removeAllListeners();
    bitcoinLndClient.disconnect();
    bitcoinLndClient2.removeAllListeners();
    bitcoinLndClient2.disconnect();
    clnClient.removeAllListeners();
    clnClient.disconnect();
  });

  describe('Multiple LND connection', () => {
    test('should connect multiple LNDs and populate lndClients map', async () => {
      // Connect both LNDs
      await Promise.all([
        bitcoinLndClient.connect(false),
        bitcoinLndClient2.connect(false),
      ]);

      // Verify both connected
      expect(bitcoinLndClient.isConnected()).toBe(true);
      expect(bitcoinLndClient2.isConnected()).toBe(true);

      // Verify IDs are populated (happens on connect via getInfo)
      expect(bitcoinLndClient.id).toBeDefined();
      expect(bitcoinLndClient2.id).toBeDefined();
      expect(bitcoinLndClient.id).not.toBe(bitcoinLndClient2.id);

      // Create currency with both in map (mirrors Boltz.ts logic)
      const currency = {
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        chainClient: bitcoinClient,
        lndClients: new Map([
          [bitcoinLndClient.id, bitcoinLndClient],
          [bitcoinLndClient2.id, bitcoinLndClient2],
        ]),
      } as unknown as Currency;

      expect(currency.lndClients.size).toBe(2);
      expect(currency.lndClients.get(bitcoinLndClient.id)).toBe(
        bitcoinLndClient,
      );
      expect(currency.lndClients.get(bitcoinLndClient2.id)).toBe(
        bitcoinLndClient2,
      );
    });

    test('should get lightning client by ID from lndClients map', async () => {
      const lndClientId1 = 'btc-client-1';
      const lndClientId2 = 'btc-client-2';

      const currency = {
        symbol: 'BTC',
        lndClients: new Map([
          [lndClientId1, bitcoinLndClient],
          [lndClientId2, bitcoinLndClient2],
        ]),
      } as unknown as Currency;

      expect(getLightningClientById(currency, lndClientId1)).toBe(
        bitcoinLndClient,
      );
      expect(getLightningClientById(currency, lndClientId2)).toBe(
        bitcoinLndClient2,
      );
      expect(getLightningClientById(currency, 'non-existent')).toBeUndefined();
    });
  });

  describe('CLN + Multiple LND', () => {
    test('should connect CLN and multiple LNDs together', async () => {
      // Connect all nodes (LNDs may already be connected from previous test)
      if (!bitcoinLndClient.isConnected()) {
        await bitcoinLndClient.connect(false);
      }
      if (!bitcoinLndClient2.isConnected()) {
        await bitcoinLndClient2.connect(false);
      }
      await clnClient.connect();

      // Verify all connected
      expect(clnClient.isConnected()).toBe(true);
      expect(bitcoinLndClient.isConnected()).toBe(true);
      expect(bitcoinLndClient2.isConnected()).toBe(true);

      // Verify CLN ID is populated
      expect(clnClient.id).toBeDefined();

      // Verify all can be used together in Currency
      const currency = {
        clnClient,
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        chainClient: bitcoinClient,
        lndClients: new Map([
          [bitcoinLndClient.id, bitcoinLndClient],
          [bitcoinLndClient2.id, bitcoinLndClient2],
        ]),
      } as unknown as Currency;

      // getLightningClients returns all LNDs + CLN
      const allClients = getLightningClients(currency);
      expect(allClients).toHaveLength(3);
      expect(allClients).toContain(bitcoinLndClient);
      expect(allClients).toContain(bitcoinLndClient2);
      expect(allClients).toContain(clnClient);
    });

    test('should get CLN client by ID', async () => {
      const lndClientId1 = 'btc-client-1';
      const lndClientId2 = 'btc-client-2';

      const currency = {
        clnClient,
        symbol: 'BTC',
        lndClients: new Map([
          [lndClientId1, bitcoinLndClient],
          [lndClientId2, bitcoinLndClient2],
        ]),
      } as unknown as Currency;

      // Should find CLN by its ID
      expect(getLightningClientById(currency, clnClient.id)).toBe(clnClient);

      // Should find LNDs by their IDs
      expect(getLightningClientById(currency, lndClientId1)).toBe(
        bitcoinLndClient,
      );
      expect(getLightningClientById(currency, lndClientId2)).toBe(
        bitcoinLndClient2,
      );
      expect(getLightningClientById(currency, 'non-existent')).toBeUndefined();
    });
  });

  describe('Connection failure handling', () => {
    test('should return false and not connect when LND is unreachable', async () => {
      const badLndClient = createUnreachableLndClient();

      // connect() returns false on failure (doesn't throw)
      const result = await badLndClient.connect(false);
      expect(result).toBe(false);

      // Client should not be connected
      expect(badLndClient.isConnected()).toBe(false);

      // Disconnect to clear any reconnection timers
      badLndClient.disconnect();
    });

    test('should skip failed LND and continue with others', async () => {
      // This mirrors the logic in Boltz.ts lines 302-328
      const lndClients = new Map<string, LndClient>();

      // Good client connects
      if (!bitcoinLndClient.isConnected()) {
        await bitcoinLndClient.connect(false);
      }
      lndClients.set(bitcoinLndClient.id, bitcoinLndClient);

      // Bad client fails - connect() returns false, not throws
      const badClient = createUnreachableLndClient();
      const connected = await badClient.connect(false);
      if (connected) {
        // Only add if connection succeeded
        lndClients.set(badClient.id, badClient);
      }
      // Disconnect to clear reconnection timer regardless
      badClient.disconnect();

      // Good client 2 connects
      if (!bitcoinLndClient2.isConnected()) {
        await bitcoinLndClient2.connect(false);
      }
      lndClients.set(bitcoinLndClient2.id, bitcoinLndClient2);

      // Map should have both good clients but not the bad one
      expect(lndClients.size).toBe(2);
      expect(lndClients.get(bitcoinLndClient.id)?.isConnected()).toBe(true);
      expect(lndClients.get(bitcoinLndClient2.id)?.isConnected()).toBe(true);
    });

    test('should handle currency with only CLN when all LNDs fail', async () => {
      // Ensure CLN is connected
      if (!clnClient.isConnected()) {
        await clnClient.connect();
      }

      // Create currency with empty lndClients (all LNDs failed to connect)
      const currency = {
        clnClient,
        symbol: 'BTC',
        type: CurrencyType.BitcoinLike,
        lndClients: new Map<string, LndClient>(),
      } as unknown as Currency;

      // Should still have CLN available
      const allClients = getLightningClients(currency);
      expect(allClients).toHaveLength(1);
      expect(allClients[0]).toBe(clnClient);

      // getLightningClientById should find CLN
      expect(getLightningClientById(currency, clnClient.id)).toBe(clnClient);
    });
  });
});
