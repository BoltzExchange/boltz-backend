import { MaxUint256 } from 'ethers';
import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import Errors from '../../../../lib/wallet/Errors';
import Wallet from '../../../../lib/wallet/Wallet';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { Ethereum, Rsk } from '../../../../lib/wallet/ethereum/EvmNetworks';
import Contracts from '../../../../lib/wallet/ethereum/contracts/Contracts';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
  providerEndpoint,
} from '../EthereumTools';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    getTransactions: jest.fn().mockResolvedValue([]),
    addTransaction: jest.fn().mockResolvedValue(null),
  }),
);
jest.mock('../../../../lib/db/repositories/ChainTipRepository');

describe('EthereumManager', () => {
  let database: Database;

  let setup: EthereumSetup;
  let manager: EthereumManager;
  let wallets: Map<string, Wallet>;

  const oldContracts = {
    version: 1,
    etherSwap: {
      getAddress: jest
        .fn()
        .mockResolvedValue('0x8F78a4f8A9931FE8F7CBc6B5fD4976dcBe8f1832'),
    },
    erc20Swap: {
      getAddress: jest
        .fn()
        .mockResolvedValue('0xBf074e2a0b85c975b41F33C99b14992EFba62776'),
    },
  } as unknown as Contracts;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();

    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
    const contracts = await getContracts(setup.signer);

    manager = new EthereumManager(Logger.disabledLogger, false, {
      providerEndpoint,
      networkName: 'Anvil',
      contracts: [
        {
          etherSwap: await contracts.etherSwap.getAddress(),
          erc20Swap: await contracts.erc20Swap.getAddress(),
        },
      ],
      tokens: [
        {
          symbol: Ethereum.symbol,
          minWalletBalance: 100_000,
        },
        {
          symbol: 'USDT',
          decimals: 18,
          minWalletBalance: 100_000,
          contractAddress: await contracts.token.getAddress(),
        },
      ],
    });
    manager['contracts'].push(oldContracts);

    wallets = await manager.init(setup.mnemonic);
  });

  afterAll(async () => {
    await manager.destroy();
    await database.close();
    setup.provider.destroy();
    manager.contractEventHandler.destroy();
  });

  test.each`
    config
    ${null}
    ${undefined}
    ${{}}
    ${{ etherSwapAddress: '0x1' }}
    ${{ erc20SwapAddress: '0x2' }}
  `('constructor should throw with invalid config $config', ({ config }) => {
    expect(
      () => new EthereumManager(Logger.disabledLogger, false, config),
    ).toThrow(Errors.MISSING_SWAP_CONTRACTS().message);
  });

  test('should use network name in config', async () => {
    expect((await manager.getContractDetails()).network).toEqual({
      name: manager['config'].networkName,
      chainId: Number((await setup.provider.getNetwork()).chainId),
    });
  });

  test('should set token allowance on init', async () => {
    expect(
      await (
        wallets.get('USDT')!.walletProvider as ERC20WalletProvider
      ).getAllowance(
        await manager.highestContractsVersion().erc20Swap.getAddress(),
      ),
    ).toEqual(MaxUint256);
  });

  test.each`
    symbol             | expected
    ${Ethereum.symbol} | ${true}
    ${'USDT'}          | ${true}
    ${Rsk.symbol}      | ${false}
    ${'WBTC'}          | ${false}
  `('should have symbol $symbol -> $expected', ({ symbol, expected }) => {
    expect(manager.hasSymbol(symbol)).toEqual(expected);
  });

  test('should get highest contracts version', async () => {
    expect(manager.highestContractsVersion()).not.toEqual(oldContracts);
    expect(manager.highestContractsVersion()).toEqual(manager['contracts'][1]);
  });

  test('should get contracts for address', async () => {
    await expect(
      manager.contractsForAddress(
        await manager.highestContractsVersion().etherSwap.getAddress(),
      ),
    ).resolves.toEqual(manager['contracts'][1]);
    await expect(
      manager.contractsForAddress(
        await manager.highestContractsVersion().erc20Swap.getAddress(),
      ),
    ).resolves.toEqual(manager['contracts'][1]);

    await expect(
      manager.contractsForAddress(await oldContracts.etherSwap.getAddress()),
    ).resolves.toEqual(oldContracts);
    await expect(
      manager.contractsForAddress(await oldContracts.erc20Swap.getAddress()),
    ).resolves.toEqual(oldContracts);

    await expect(manager.contractsForAddress('0x')).resolves.toBeUndefined();
  });
});
