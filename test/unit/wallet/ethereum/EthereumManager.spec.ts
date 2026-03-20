import { Wallet as EthersWallet, HDNodeWallet } from 'ethers';
import type { EthereumConfig } from '../../../../lib/Config';
import Logger from '../../../../lib/Logger';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import { createDeferred } from '../../../Utils';

describe('EthereumManager derivation path', () => {
  const mnemonic =
    'test test test test test test test test test test test junk';

  const createConfig = (
    overrides: Partial<EthereumConfig> = {},
  ): EthereumConfig => ({
    providerEndpoint: 'http://127.0.0.1:8545',
    requiredConfirmations: 1,
    contracts: [
      {
        etherSwap: '0x1',
        erc20Swap: '0x2',
      },
    ],
    tokens: [
      {
        symbol: networks.Ethereum.symbol,
        minWalletBalance: 100_000,
      },
    ],
    ...overrides,
  });

  test('uses a custom derivation path when configured', async () => {
    const derivationPath = "m/44'/60'/0'/0/7";
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Ethereum,
      createConfig({ derivationPath }),
    );
    const signer = manager['getSigner'](mnemonic);

    expect(signer.address).toEqual(
      HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath).address,
    );

    await manager.destroy();
  });

  test.each(['', '  ', '\t'])(
    'rejects empty derivation path "%s"',
    async (derivationPath) => {
      const manager = new EthereumManager(
        Logger.disabledLogger,
        networks.Ethereum,
        createConfig({ derivationPath }),
      );

      expect(() => manager['getSigner'](mnemonic)).toThrow(
        'derivationPath must not be empty',
      );

      await manager.destroy();
    },
  );

  test('is backward compatible with default wallet derivation', async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Ethereum,
      createConfig(),
    );
    const signer = manager['getSigner'](mnemonic);

    expect(signer.address).toEqual(EthersWallet.fromPhrase(mnemonic).address);

    await manager.destroy();
  });

  test('coalesces overlapping missed event rescans', async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Ethereum,
      createConfig(),
    );
    const firstCheckStarted = createDeferred();
    const releaseFirstCheck = createDeferred();
    const checkMissedEvents = jest
      .fn()
      .mockImplementationOnce(async () => {
        firstCheckStarted.resolve();
        await releaseFirstCheck.promise;
      })
      .mockResolvedValue(undefined);

    manager['contracts'].push({
      version: 6n,
      contractEventHandler: {
        checkMissedEvents,
      },
    } as any);

    manager['scheduleMissedEventChecks']();
    await firstCheckStarted.promise;

    manager['scheduleMissedEventChecks']();
    manager['scheduleMissedEventChecks']();

    expect(checkMissedEvents).toHaveBeenCalledTimes(1);

    releaseFirstCheck.resolve();
    await manager['missedEventsCheckPromise'];

    expect(checkMissedEvents).toHaveBeenCalledTimes(2);

    await manager.destroy();
  });
});
