import { Transaction } from 'ethers';
import type { RskConfig } from '../../../../lib/Config';
import Logger from '../../../../lib/Logger';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import Errors from '../../../../lib/wallet/ethereum/Errors';
import { Ethereum, Rsk } from '../../../../lib/wallet/ethereum/EvmNetworks';
import InjectedProvider, {
  EthProviderService,
} from '../../../../lib/wallet/ethereum/InjectedProvider';
import {
  fundSignerWallet,
  getSigner,
  providerEndpoint,
} from '../EthereumTools';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    addTransaction: jest.fn().mockResolvedValue(null),
    getHighestNonce: jest.fn().mockResolvedValue(undefined),
  }),
);

describe('InjectedProvider', () => {
  let provider: InjectedProvider;

  beforeAll(async () => {
    provider = new InjectedProvider(Logger.disabledLogger, Ethereum, {
      providerEndpoint,
    } as never);
    await provider.init();
  });

  test('should throw when no provider is set', () => {
    expect(
      () => new InjectedProvider(Logger.disabledLogger, Rsk, {} as RskConfig),
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

  describe('getTransactionCount', () => {
    const address = '0x0000000000000000000000000000000000000000';

    afterAll(() => {
      PendingEthereumTransactionRepository.getHighestNonce = jest
        .fn()
        .mockResolvedValue(undefined);
    });

    test('should get transaction count from provider when there are no pending transactions', async () => {
      PendingEthereumTransactionRepository.getHighestNonce = jest
        .fn()
        .mockResolvedValue(undefined);
      await expect(provider.getTransactionCount(address)).resolves.toEqual(0);
    });

    test('should get transaction count from db when there are pending transactions', async () => {
      const highestNonce = 10;
      PendingEthereumTransactionRepository.getHighestNonce = jest
        .fn()
        .mockResolvedValue(highestNonce);
      await expect(provider.getTransactionCount(address)).resolves.toEqual(
        highestNonce,
      );
    });
  });

  test('should save broadcast transactions to database', async () => {
    const setup = await getSigner();
    await fundSignerWallet(setup.signer, setup.etherBase);
    const signer = setup.signer.connect(provider);

    const tx = await signer.sendTransaction({
      to: await signer.getAddress(),
      value: 321,
    });

    expect(
      PendingEthereumTransactionRepository.addTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(
      PendingEthereumTransactionRepository.addTransaction,
    ).toHaveBeenCalledWith(
      tx.hash,
      tx.nonce,
      tx.value,
      Transaction.from(tx).serialized,
    );
  });
});
