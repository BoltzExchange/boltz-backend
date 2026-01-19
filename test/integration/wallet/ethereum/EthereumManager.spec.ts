import { MaxUint256 } from 'ethers';
import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import Errors from '../../../../lib/wallet/Errors';
import type Wallet from '../../../../lib/wallet/Wallet';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider from '../../../../lib/wallet/ethereum/InjectedProvider';
import type Contracts from '../../../../lib/wallet/ethereum/contracts/Contracts';
import type ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import type { EthereumSetup } from '../EthereumTools';
import {
  fundSignerWallet,
  getContracts,
  getSigner,
  providerEndpoint,
} from '../EthereumTools';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    getTotalSent: jest.fn().mockResolvedValue(0n),
    getTransactions: jest.fn().mockResolvedValue([]),
    addTransaction: jest.fn().mockResolvedValue(null),
    getHighestNonce: jest.fn().mockResolvedValue(undefined),
  }),
);
jest.mock('../../../../lib/db/repositories/ChainTipRepository');

describe('EthereumManager', () => {
  InjectedProvider.allowHttpOnly = true;

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

    manager = new EthereumManager(Logger.disabledLogger, networks.Ethereum, {
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
          symbol: networks.Ethereum.symbol,
          minWalletBalance: 100_000,
        },
        {
          symbol: 'USDT',
          decimals: 18,
          minWalletBalance: 100_000,
          contractAddress: await contracts.token.getAddress(),
        },
      ],
    } as any);
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
      () =>
        new EthereumManager(Logger.disabledLogger, networks.Ethereum, config),
    ).toThrow(Errors.MISSING_SWAP_CONTRACTS().message);
  });

  test('should use network name in config', async () => {
    expect((await manager.getContractDetails()).network).toEqual({
      name: manager['config'].networkName,
      chainId: Number((await setup.provider.getNetwork()).chainId),
    });
  });

  test('should return swap contracts', async () => {
    const details = await manager.getContractDetails();
    const highestContracts = manager.highestContractsVersion();

    expect(details.swapContracts).toEqual({
      EtherSwap: await highestContracts.etherSwap.getAddress(),
      ERC20Swap: await highestContracts.erc20Swap.getAddress(),
    });
  });

  test('should return supported contracts as Map', async () => {
    const details = await manager.getContractDetails();

    expect(details.supportedContracts).toBeInstanceOf(Map);
    expect(details.supportedContracts.size).toEqual(2);

    expect(details.supportedContracts.has(1)).toBe(true);
    expect(details.supportedContracts.get(1)).toEqual({
      EtherSwap: await oldContracts.etherSwap.getAddress(),
      ERC20Swap: await oldContracts.erc20Swap.getAddress(),
    });

    const highestContracts = manager.highestContractsVersion();
    const highestVersion = Number(highestContracts.version);
    expect(details.supportedContracts.has(highestVersion)).toBe(true);
    expect(details.supportedContracts.get(highestVersion)).toEqual({
      EtherSwap: await highestContracts.etherSwap.getAddress(),
      ERC20Swap: await highestContracts.erc20Swap.getAddress(),
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
    symbol                       | expected
    ${networks.Ethereum.symbol}  | ${true}
    ${'USDT'}                    | ${true}
    ${networks.Rootstock.symbol} | ${false}
    ${'WBTC'}                    | ${false}
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

  describe('getClaimedAmount', () => {
    beforeAll(() => {
      manager.contractsForAddress = jest
        .fn()
        .mockResolvedValue(manager['contracts'][1]);
    });

    test('should get claimed amount for batch claims', async () => {
      const res = await manager.getClaimedAmount(
        '0xf9036c8205eb840191818683012b22943d9cc5780ca1db78760ad3d35458509178a85a4a80b90304c2c3a8c90000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000004b83f443c31e99ef7180edcc2f9f7454b25572e57da054be58421f77aabf08ee778a6c9a32078afa8e59e7e69bccbff6de0232dd21d3e1a6c00addaaea87b772ce82d686340cebc45b909803de9b07067dadfae822fae3b10b31e602023dd593652407e4d3438bb6a6e58594deda5af606c9e49b3fb5a7d6726252994870212210000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000001550f7dca700000000000000000000000000000000000000000000000000000000dace6570a8000000000000000000000000000000000000000000000000000001116be05bdc00000000000000000000000000000000000000000000000000000148095b471000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000001c7531ec1de19e859c4f0dd160760f0aef2e6e3000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000d468040d79aac566a782006febe5e414d4bb9556000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000006f821900000000000000000000000000000000000000000000000000000000006f82c300000000000000000000000000000000000000000000000000000000006f82d100000000000000000000000000000000000000000000000000000000006f82d95fa0e136d7615b02f9696f9ce535244d91b20fe17c5d2593f5aba7426d572ff3e2f0a035089572f3f272beb6008e95fb34a0e1f079368ee0262145249a8711066bcc6f',
      );
      expect(res?.amount).toEqual(6901890000000000n);
      expect(res?.token).toBeUndefined();
    });

    test('should get claimed amount for claims', async () => {
      const res = await manager.getClaimedAmount(
        '0xf8ea825e76840191b4f082a9ea943d9cc5780ca1db78760ad3d35458509178a85a4a80b884c3c37fbce9248e0d2e4943c368b26f24d3a961e4604be3cf46b7c654289a9a5c73f8b4470000000000000000000000000000000000000000000000000162e12979444c000000000000000000000000001bdf482f5da32ef51c20d9a94960385c5be9aab700000000000000000000000000000000000000000000000000000000006f449060a077f9d033d1a0b3d3df07589946bf825faaf1a827a2ec154d3bbb232bd05ef93aa04a6de314e6ddbe18399e46c4727bb87fed590aed614a7f0ec6cf732390925c2a',
      );
      expect(res?.amount).toEqual(99889710000000000n);
      expect(res?.token).toBeUndefined();
    });

    test('should get claimed amount for batch claims with commitment', async () => {
      const res = await manager.getClaimedAmount(
        '0x02f901868080808080947b778dcfa6d720752cb372a143d16b51b411ac6c80b90124f3382d57000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000012cf9a927405d32c47bf90ba0cd3b86ef8feae8478d7f7fb213e755cbb31000c0000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000007b778dcfa6d720752cb372a143d16b51b411ac6c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000112345678901234567890123456789012345678901234567890123456789012341234567890123456789012345678901234567890123456789012345678901234c001a0c3f59dbf8227f5ec4d5635a809d1e93db65ec77a2013159ea63475bdcb693a3ca062923c0dee8b4c2efcf1297204d46dc9baf30fdf5ae57e6596e60f4b877c1c00',
      );
      expect(res?.amount).toEqual(123n);
      expect(res?.token).toBeUndefined();
    });
  });
});
