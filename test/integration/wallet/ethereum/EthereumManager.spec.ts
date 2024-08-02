import { generateMnemonic } from 'bip39';
import { MaxUint256 } from 'ethers';
import Logger from '../../../../lib/Logger';
import Errors from '../../../../lib/wallet/Errors';
import Wallet from '../../../../lib/wallet/Wallet';
import EthereumManager from '../../../../lib/wallet/ethereum/EthereumManager';
import { Ethereum, Rsk } from '../../../../lib/wallet/ethereum/EvmNetworks';
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
  let setup: EthereumSetup;
  let manager: EthereumManager;
  let wallets: Map<string, Wallet>;

  beforeAll(async () => {
    setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
    const contracts = await getContracts(setup.signer);

    manager = new EthereumManager(Logger.disabledLogger, false, {
      providerEndpoint,
      networkName: 'Anvil',
      etherSwapAddress: await contracts.etherSwap.getAddress(),
      erc20SwapAddress: await contracts.erc20Swap.getAddress(),
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
    wallets = await manager.init(setup.mnemonic);
  });

  afterAll(async () => {
    await manager.destroy();
    setup.provider.destroy();
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

  test.each`
    versions | isEtherSwap
    ${{
  EtherSwap: 2,
  ERC20Swap: 3,
}} | ${true}
    ${{
  EtherSwap: 4,
  ERC20Swap: 3,
}} | ${true}
    ${{
  EtherSwap: 3,
  ERC20Swap: 2,
}} | ${false}
    ${{
  EtherSwap: 3,
  ERC20Swap: 4,
}} | ${false}
  `(
    'should throw for invalid contract versions $versions',
    async ({ versions, isEtherSwap }) => {
      EthereumManager['supportedContractVersions'] = versions;
      const throwManager = new EthereumManager(Logger.disabledLogger, false, {
        providerEndpoint,
        tokens: [],
        etherSwapAddress: await manager.etherSwap.getAddress(),
        erc20SwapAddress: await manager.erc20Swap.getAddress(),
      });

      await expect(throwManager.init(generateMnemonic())).rejects.toEqual(
        Errors.UNSUPPORTED_CONTRACT_VERSION(
          `${Ethereum.name} ${isEtherSwap ? 'EtherSwap' : 'ERC20Swap'}`,
          await (
            isEtherSwap ? manager.etherSwap : manager.erc20Swap
          ).getAddress(),
          BigInt(3),
          isEtherSwap ? versions.EtherSwap : versions.ERC20Swap,
        ),
      );
    },
  );

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
      ).getAllowance(await manager.erc20Swap.getAddress()),
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
});
