import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import type LndClient from '../../../../lib/lightning/LndClient';
import type ClnClient from '../../../../lib/lightning/cln/ClnClient';
import MusigSigner from '../../../../lib/service/cooperative/MusigSigner';
import type SwapNursery from '../../../../lib/swap/SwapNursery';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import type { Currency } from '../../../../lib/wallet/WalletManager';

describe('MusigSigner', () => {
  const btcCurrency = {
    lndClient: {} as unknown as LndClient,
    clnClient: {} as unknown as ClnClient,
  };

  const currencies = new Map<string, Currency>([
    ['BTC', btcCurrency as Currency],
  ]);

  const signer = new MusigSigner(
    Logger.disabledLogger,
    currencies,
    {} as unknown as WalletManager,
    {} as unknown as SwapNursery,
  );

  describe('hasPendingHtlcs', () => {
    const hasPendingHtlcs = signer['hasPendingHtlcs'];

    test('should return false when there are no pending HTLCs', async () => {
      btcCurrency.lndClient.listChannels = jest.fn().mockResolvedValue([]);
      btcCurrency.clnClient.listChannels = jest.fn().mockResolvedValue([]);

      await expect(hasPendingHtlcs('BTC', randomBytes(32))).resolves.toEqual(
        false,
      );
    });

    test('should return true when there are pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);
      btcCurrency.clnClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return true when LND has pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);
      btcCurrency.clnClient.listChannels = jest.fn().mockResolvedValue([]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return true when CLN has pending HTLCs', async () => {
      const preimageHash = randomBytes(32);

      btcCurrency.lndClient.listChannels = jest.fn().mockResolvedValue([]);
      btcCurrency.clnClient.listChannels = jest
        .fn()
        .mockResolvedValue([{ htlcs: [{ preimageHash }] }]);

      await expect(hasPendingHtlcs('BTC', preimageHash)).resolves.toEqual(true);
    });

    test('should return false when currency is undefined', async () => {
      await expect(
        hasPendingHtlcs('unknown', randomBytes(32)),
      ).resolves.toEqual(false);
    });
  });
});
