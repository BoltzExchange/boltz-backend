import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import SequentialSigner from '../../../../lib/wallet/ethereum/SequentialSigner';
import type { EthereumSetup } from '../EthereumTools';
import { fundSignerWallet, getSigner } from '../EthereumTools';

describe('SequentialSigner', () => {
  let setup: EthereumSetup;
  let signer: SequentialSigner;

  beforeAll(async () => {
    setup = await getSigner();
    signer = new SequentialSigner('ETH', setup.signer);

    await fundSignerWallet(setup.signer, setup.etherBase);

    PendingEthereumTransactionRepository.getTotalSent = jest
      .fn()
      .mockResolvedValue(0n);
  });

  test('should get address', async () => {
    expect(await signer.getAddress()).toBe(await setup.signer.getAddress());
  });

  test('should connect to provider', async () => {
    expect(signer.provider).toBe(setup.signer.provider);
  });

  describe('signTransaction', () => {
    test('should sign transactions', async () => {
      const tx = await signer.sendTransaction({
        to: await setup.etherBase.getAddress(),
        value: 1_000,
      });

      expect(tx.hash).toBeDefined();
      await tx.wait(1);
    });

    test('should throw when we do not have enough balance', async () => {
      const balance = await signer.provider!.getBalance(
        await signer.getAddress(),
      );

      PendingEthereumTransactionRepository.getTotalSent = jest
        .fn()
        .mockResolvedValue(balance / 2n);

      await expect(
        signer.sendTransaction({
          to: await setup.etherBase.getAddress(),
          value: balance / 2n + 1n,
        }),
      ).rejects.toThrow('insufficient balance');
    });
  });

  test('should sign messages', async () => {
    const message = 'Hello, world!';
    const signature = await signer.signMessage(message);
    expect(signature).toEqual(await setup.signer.signMessage(message));
  });

  test('should sign typed data', async () => {
    const domain = {
      name: 'EtherSwap',
      version: '1',
      chainId: 1,
    };
    const types = {
      test: [
        {
          name: 'test',
          type: 'string',
        },
      ],
    };
    const value = {
      test: 'test',
    };

    expect(await signer.signTypedData(domain, types, value)).toEqual(
      await setup.signer.signTypedData(domain, types, value),
    );
  });
});
