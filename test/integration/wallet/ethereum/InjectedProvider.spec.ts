import Logger from '../../../../lib/Logger';
import { RskConfig } from '../../../../lib/Config';
import {
  fundSignerWallet,
  getSigner,
  providerEndpoint,
} from '../EthereumTools';
import Errors from '../../../../lib/wallet/ethereum/Errors';
import InjectedProvider, {
  EthProviderService,
} from '../../../../lib/wallet/ethereum/InjectedProvider';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    addTransaction: jest.fn().mockResolvedValue(null),
  }),
);

describe('InjectedProvider', () => {
  let provider: InjectedProvider;

  beforeAll(async () => {
    provider = new InjectedProvider(Logger.disabledLogger, {
      providerEndpoint,
      tokens: [],
      etherSwapAddress: '0x',
      erc20SwapAddress: '0x',
    });
    await provider.init();
  });

  test('should throw when no provider is set', () => {
    expect(
      () => new InjectedProvider(Logger.disabledLogger, {} as RskConfig),
    ).toThrow(Errors.NO_PROVIDER_SPECIFIED().message);
  });

  test(`should init ${EthProviderService.Node} provider`, () => {
    expect(provider['providers'].size).toEqual(1);
    expect(
      provider['providers'].get(EthProviderService.Node),
    ).not.toBeUndefined();
  });

  test.each`
    method
    ${'getTransaction'}
    ${'getTransactionReceipt'}
  `('should handle nullable calls to $method', async ({ method }) => {
    await expect(
      provider[method](
        '0xeba77b6d0133e61bc931cb9bbdf07c51a09caa2d6699c3782de10cf7d765c06c',
      ),
    ).resolves.toEqual(null);
  });

  test('should save broadcast transactions to database', async () => {
    const setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
    const signer = setup.signer.connect(provider);

    const tx = await signer.sendTransaction({
      to: await signer.getAddress(),
    });

    expect(
      PendingEthereumTransactionRepository.addTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(
      PendingEthereumTransactionRepository.addTransaction,
    ).toHaveBeenCalledWith(tx.hash, tx.nonce);
  });
});
