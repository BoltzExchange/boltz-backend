import {
  Contract,
  Wallet as EthersWallet,
  HDNodeWallet,
  Transaction,
} from 'ethers';
import type { EthereumConfig } from '../../../../lib/Config';
import Logger from '../../../../lib/Logger';
import OverpaymentProtector from '../../../../lib/swap/OverpaymentProtector';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import Contracts from '../../../../lib/wallet/ethereum/contracts/Contracts';
import ERC20SwapABIv5 from '../../../../lib/wallet/ethereum/contracts/abis/v5/ERC20Swap.json';
import EtherSwapABIv5 from '../../../../lib/wallet/ethereum/contracts/abis/v5/EtherSwap.json';
import { createDeferred } from '../../../Utils';

jest.mock('../../../../lib/wallet/ethereum/InjectedProvider', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    removeAllListeners: jest.fn().mockResolvedValue(undefined),
    onBlock: jest.fn(),
    onReconnect: jest.fn(),
    on: jest.fn(),
  }));
});

describe('EthereumManager derivation path', () => {
  const mnemonic =
    'test test test test test test test test test test test junk';

  const overpaymentProtector = new OverpaymentProtector(Logger.disabledLogger);

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
      overpaymentProtector,
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
        overpaymentProtector,
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
      overpaymentProtector,
    );
    const signer = manager['getSigner'](mnemonic);

    expect(signer.address).toEqual(EthersWallet.fromPhrase(mnemonic).address);

    await manager.destroy();
  });

  test('decodes the legacy Rootstock claimBatch pending tx with lowercase configured contract addresses', async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Rootstock,
      createConfig(),
      overpaymentProtector,
    );

    // Addresses as commonly written in boltz.conf: lowercase. tx.to from
    // Transaction.from() comes back checksummed, so a strict === comparison
    // against these lowercase strings would miss the contract.
    const etherSwapAddress = '0xe761e1354097757c019855637746e7dd1bef1654';
    const erc20SwapAddress = '0x46d956cf6e154980ad7b07970f22311227052ae0';

    const contracts = new Contracts(Logger.disabledLogger, networks.Rootstock, {
      etherSwap: etherSwapAddress,
      erc20Swap: erc20SwapAddress,
    });
    contracts.etherSwap = new Contract(etherSwapAddress, EtherSwapABIv5) as any;
    contracts.erc20Swap = new Contract(erc20SwapAddress, ERC20SwapABIv5) as any;
    manager['contracts'].push(contracts);

    const res = await manager.getClaimedAmount(
      '0xf902ec8219ea84018dbac0830142a394e761e1354097757c019855637746e7dd1bef165480b90284c2c3a8c90000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000383f234209f775a025be39326d986de7d51017b71b8f189426a0f03fa0b4339d64068ca7e1850701f21ee7dc32f1b1835c5df83481e0e141e2e2466c9b65ff5bfda4c87be917fcc1901ae6f3d7dd9af811fcb5f3a995c4ffc2102de9ed9352aca0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000006fe915466cc00000000000000000000000000000000000000000000000000000c646e638ea200000000000000000000000000000000000000000000000000000aecb23aaf30000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000046d956cf6e154980ad7b07970f22311227052ae000000000000000000000000046d956cf6e154980ad7b07970f22311227052ae000000000000000000000000046d956cf6e154980ad7b07970f22311227052ae0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000008622690000000000000000000000000000000000000000000000000000000000862271000000000000000000000000000000000000000000000000000000000086227d5fa03b601e9426c2863b0df0f45938c6a9a7c90ed5cbc5d19fda11ec7b6e810e137aa041fcc87bd74cc43040be2ba400d4e9210536d6b367787c769092059facf2ac20',
    );

    expect(res).toEqual({
      amount:
        31_500_000_000_000_000n +
        55_810_000_000_000_000n +
        49_200_000_000_000_000n,
      token: undefined,
    });

    await manager.destroy();
  });

  test('selects the ERC20Swap claim decoder when tx.to matches a lowercase configured ERC20Swap address', async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Rootstock,
      createConfig(),
      overpaymentProtector,
    );

    const etherSwapAddress = '0xe761e1354097757c019855637746e7dd1bef1654';
    const erc20SwapAddress = '0x46d956cf6e154980ad7b07970f22311227052ae0';

    const contracts = new Contracts(Logger.disabledLogger, networks.Rootstock, {
      etherSwap: etherSwapAddress,
      erc20Swap: erc20SwapAddress,
    });
    contracts.etherSwap = new Contract(etherSwapAddress, EtherSwapABIv5) as any;
    contracts.erc20Swap = new Contract(erc20SwapAddress, ERC20SwapABIv5) as any;
    manager['contracts'].push(contracts);

    const decodeSpy = jest
      .spyOn(contracts, 'decodeClaimData')
      .mockReturnValue([{ amount: 1n, token: '0xtoken' } as any]);

    // Minimal tx whose `to` is the lowercase erc20Swap address; ethers will
    // surface tx.to in checksum form, so without case-insensitive comparison
    // the wrong (etherSwap) decoder branch would be selected.
    const tx = Transaction.from({
      to: erc20SwapAddress,
      data: '0x',
      gasLimit: 21000,
      nonce: 0,
    });

    await manager.getClaimedAmount(tx.unsignedSerialized);

    expect(decodeSpy).toHaveBeenCalledTimes(1);
    expect(decodeSpy.mock.calls[0][0]).toBe(false);

    decodeSpy.mockRestore();
    await manager.destroy();
  });

  test('coalesces overlapping missed event rescans', async () => {
    const manager = new EthereumManager(
      Logger.disabledLogger,
      networks.Ethereum,
      createConfig(),
      overpaymentProtector,
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
