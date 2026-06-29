import { Transaction, Wallet } from 'ethers';
import type { Provider, TransactionRequest } from 'ethers';
import PendingEthereumTransactionRepository from '../../../../lib/db/repositories/PendingEthereumTransactionRepository';
import SequentialSigner from '../../../../lib/wallet/ethereum/SequentialSigner';

jest.mock(
  '../../../../lib/db/repositories/PendingEthereumTransactionRepository',
  () => ({
    getTotalSent: jest.fn().mockResolvedValue(0n),
    addTransaction: jest.fn().mockResolvedValue(null),
  }),
);

describe('SequentialSigner nonce reservation', () => {
  const getTotalSent =
    PendingEthereumTransactionRepository.getTotalSent as jest.MockedFunction<
      typeof PendingEthereumTransactionRepository.getTotalSent
    >;
  const addTransaction =
    PendingEthereumTransactionRepository.addTransaction as jest.MockedFunction<
      typeof PendingEthereumTransactionRepository.addTransaction
    >;

  const build = (
    symbol: string,
    getCount: () => Promise<number>,
  ): SequentialSigner => {
    const provider = {
      getTransactionCount: jest.fn(getCount),
    } as unknown as Provider;
    return new SequentialSigner(
      symbol,
      Wallet.createRandom().connect(provider),
    );
  };

  const makeTx = (nonce: number): TransactionRequest => ({
    to: '0x000000000000000000000000000000000000dEaD',
    chainId: 1,
    type: 2,
    nonce,
    gasLimit: 21_000n,
    maxFeePerGas: 2_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
  });

  const sortedNonces = (signed: string[]): number[] =>
    signed.map((s) => Transaction.from(s).nonce).sort((a, b) => a - b);

  beforeEach(() => {
    getTotalSent.mockReset();
    addTransaction.mockReset();

    getTotalSent.mockResolvedValue(0n);
    addTransaction.mockResolvedValue(null as never);
  });

  test('bursty concurrent sends get distinct nonces even when the resolved count is stale', async () => {
    const signer = build('RACE-1', () => Promise.resolve(5));

    const signed = await Promise.all([
      signer.signTransaction(makeTx(5)),
      signer.signTransaction(makeTx(5)),
      signer.signTransaction(makeTx(5)),
    ]);

    expect(sortedNonces(signed)).toEqual([5, 6, 7]);
    expect(new Set(sortedNonces(signed)).size).toBe(3);
  });

  test('re-syncs forward when the chain moves ahead of the reservation', async () => {
    let count = 5;
    const signer = build('RACE-2', () => Promise.resolve(count));

    await signer.signTransaction(makeTx(5));
    count = 10;
    const signed = await signer.signTransaction(makeTx(5));

    expect(Transaction.from(signed).nonce).toBe(10);
  });

  test('rolls back the nonce reservation when the signing path fails', async () => {
    const signer = build('RACE-3', () => Promise.resolve(20));
    addTransaction.mockRejectedValueOnce(new Error('db down'));

    await expect(signer.signTransaction(makeTx(20))).rejects.toThrow('db down');

    const signed = await signer.signTransaction(makeTx(20));

    expect(Transaction.from(signed).nonce).toBe(20);
  });
});
