import { crypto } from 'bitcoinjs-lib';
import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { MaxUint256 } from 'ethers';
import Logger from '../../../../../lib/Logger';
import { Ethereum } from '../../../../../lib/wallet/ethereum/EvmNetworks';
import ContractEventHandler from '../../../../../lib/wallet/ethereum/contracts/ContractEventHandler';
import type { EthereumSetup } from '../../EthereumTools';
import { fundSignerWallet, getContracts, getSigner } from '../../EthereumTools';

type Transactions = {
  lockup?: string;
  claim?: string;
  refund?: string;
};

describe('ContractEventHandler', () => {
  const contractEventHandler = new ContractEventHandler(Logger.disabledLogger);

  const contractsVersion = 4n;

  const preimage = randomBytes(32);
  const timelock = 1;
  const amount = BigInt(123_321);

  const transactions: {
    etherSwap: Transactions;
    erc20Swap: Transactions;
  } = {
    etherSwap: {},
    erc20Swap: {},
  };

  let setup: EthereumSetup;
  let contracts: {
    token: ERC20;
    etherSwap: EtherSwap;
    erc20Swap: ERC20Swap;
  };

  let startingHeight: number;

  beforeAll(async () => {
    setup = await getSigner();
    contracts = await getContracts(setup.signer);

    startingHeight = (await setup.provider.getBlockNumber()) + 1;

    await Promise.all([
      contracts.token.approve(contracts.erc20Swap.getAddress(), MaxUint256),
      fundSignerWallet(setup.signer, setup.etherBase, contracts.token),
    ]);
  });

  afterAll(() => {
    contractEventHandler.removeAllListeners();
    contractEventHandler.destroy();
    setup.provider.destroy();
  });

  test('should init', async () => {
    await contractEventHandler.init(
      contractsVersion,
      Ethereum,
      setup.provider,
      contracts.etherSwap,
      contracts.erc20Swap,
    );
  });

  test('should listen to EtherSwap lockup events', async () => {
    const tx = await contracts.etherSwap.lock(
      crypto.sha256(preimage),
      await setup.etherBase.getAddress(),
      timelock,
      {
        value: amount,
      },
    );
    transactions.etherSwap.lockup = tx.hash;

    const lockupPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.lockup',
        async ({ version, transaction, etherSwapValues }) => {
          expect(version).toEqual(contractsVersion);
          expect(transaction).toEqual(
            await setup.provider.getTransaction(tx.hash),
          );
          expect(etherSwapValues).toEqual({
            amount,
            timelock,
            preimageHash: crypto.sha256(preimage),
            refundAddress: await setup.signer.getAddress(),
            claimAddress: await setup.etherBase.getAddress(),
          });
          resolve();
        },
      );
    });

    await tx.wait(1);

    await lockupPromise;
  });

  test('should listen to EtherSwap claim events', async () => {
    const tx = await contracts.etherSwap
      .connect(setup.etherBase)
      [
        'claim(bytes32,uint256,address,uint256)'
      ](preimage, amount, await setup.signer.getAddress(), timelock);
    transactions.etherSwap.claim = tx.hash;

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.claim',
        async ({ version, transactionHash, preimageHash, preimage }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(tx.hash);
          expect(preimageHash).toEqual(preimageHash);
          expect(preimage).toEqual(preimage);
          resolve();
        },
      );
    });

    await tx.wait(1);

    await claimPromise;
  });

  test('should listen to EtherSwap refund events', async () => {
    const claimTx = await contracts.etherSwap.lock(
      crypto.sha256(preimage),
      await setup.etherBase.getAddress(),
      timelock,
      {
        value: amount,
      },
    );
    await claimTx.wait(1);

    const tx = await contracts.etherSwap[
      'refund(bytes32,uint256,address,uint256)'
    ](
      crypto.sha256(preimage),
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    transactions.etherSwap.refund = tx.hash;

    const refundPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.refund',
        async ({ version, transactionHash, preimageHash }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(tx.hash);
          expect(preimageHash).toEqual(preimageHash);
          resolve();
        },
      );
    });

    await tx.wait(1);

    await refundPromise;
  });

  test('should listen to ERC20Swap lockup events', async () => {
    const tx = await contracts.erc20Swap.lock(
      crypto.sha256(preimage),
      amount,
      await contracts.token.getAddress(),
      await setup.etherBase.getAddress(),
      timelock,
    );
    transactions.erc20Swap.lockup = tx.hash;

    const lockupPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.lockup',
        async ({ version, transaction, erc20SwapValues }) => {
          expect(version).toEqual(contractsVersion);
          expect(transaction).toEqual(
            await setup.provider.getTransaction(tx.hash),
          );
          expect(erc20SwapValues).toEqual({
            amount,
            timelock,
            preimageHash: crypto.sha256(preimage),
            refundAddress: await setup.signer.getAddress(),
            claimAddress: await setup.etherBase.getAddress(),
            tokenAddress: await contracts.token.getAddress(),
          });
          resolve();
        },
      );
    });

    await tx.wait(1);

    await lockupPromise;
  });

  test('should listen to ERC20Swap claim events', async () => {
    const tx = await contracts.erc20Swap
      .connect(setup.etherBase)
      [
        'claim(bytes32,uint256,address,address,uint256)'
      ](preimage, amount, await contracts.token.getAddress(), await setup.signer.getAddress(), timelock);
    transactions.erc20Swap.claim = tx.hash;

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.claim',
        async ({ version, transactionHash, preimageHash, preimage }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(tx.hash);
          expect(preimageHash).toEqual(preimageHash);
          expect(preimage).toEqual(preimage);
          resolve();
        },
      );
    });

    await tx.wait(1);

    await claimPromise;
  });

  test('should listen to ERC20 refund events', async () => {
    const claimTx = await contracts.erc20Swap.lock(
      crypto.sha256(preimage),
      amount,
      await contracts.token.getAddress(),
      await setup.etherBase.getAddress(),
      timelock,
    );
    await claimTx.wait(1);

    const tx = await contracts.erc20Swap[
      'refund(bytes32,uint256,address,address,uint256)'
    ](
      crypto.sha256(preimage),
      amount,
      await contracts.token.getAddress(),
      await setup.etherBase.getAddress(),
      timelock,
    );
    transactions.erc20Swap.refund = tx.hash;

    const refundPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.refund',
        async ({ version, transactionHash, preimageHash }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(tx.hash);
          expect(preimageHash).toEqual(preimageHash);
          resolve();
        },
      );
    });

    await tx.wait(1);

    await refundPromise;
  });

  test('should rescan EtherSwap', async () => {
    const lockupPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.lockup',
        async ({ version, transaction, etherSwapValues }) => {
          expect(version).toEqual(contractsVersion);
          expect(transaction).toEqual(
            await setup.provider.getTransaction(transactions.etherSwap.lockup!),
          );
          expect(etherSwapValues).toEqual({
            amount,
            timelock,
            preimageHash: crypto.sha256(preimage),
            refundAddress: await setup.signer.getAddress(),
            claimAddress: await setup.etherBase.getAddress(),
          });
          resolve();
        },
      );
    });

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.claim',
        async ({ version, transactionHash, preimageHash, preimage }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(transactions.etherSwap.claim);
          expect(preimageHash).toEqual(preimageHash);
          expect(preimage).toEqual(preimage);
          resolve();
        },
      );
    });

    const refundPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.refund',
        async ({ version, transactionHash, preimageHash }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(transactions.etherSwap.refund);
          expect(preimageHash).toEqual(preimageHash);
          resolve();
        },
      );
    });

    await contractEventHandler.rescan(startingHeight);
    await Promise.all([lockupPromise, claimPromise, refundPromise]);
  });

  test('should rescan ERC20Swap', async () => {
    const lockupPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.lockup',
        async ({ version, transaction, erc20SwapValues }) => {
          expect(version).toEqual(contractsVersion);
          expect(transaction).toEqual(
            await setup.provider.getTransaction(transactions.erc20Swap.lockup!),
          );
          expect(erc20SwapValues).toEqual({
            amount,
            timelock,
            preimageHash: crypto.sha256(preimage),
            refundAddress: await setup.signer.getAddress(),
            claimAddress: await setup.etherBase.getAddress(),
            tokenAddress: await contracts.token.getAddress(),
          });
          resolve();
        },
      );
    });

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.claim',
        async ({ version, transactionHash, preimageHash, preimage }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(transactions.erc20Swap.claim);
          expect(preimageHash).toEqual(preimageHash);
          expect(preimage).toEqual(preimage);
          resolve();
        },
      );
    });

    const refundPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.refund',
        async ({ version, transactionHash, preimageHash }) => {
          expect(version).toEqual(contractsVersion);
          expect(transactionHash).toEqual(transactions.erc20Swap.refund);
          expect(preimageHash).toEqual(preimageHash);
          resolve();
        },
      );
    });

    await contractEventHandler.rescan(startingHeight);
    await Promise.all([lockupPromise, claimPromise, refundPromise]);
  });

  describe('checkTransaction', () => {
    test('should check transaction', async () => {
      const lockupPromise = new Promise<void>((resolve) => {
        contractEventHandler.once(
          'eth.lockup',
          async ({ version, transaction, etherSwapValues }) => {
            expect(version).toEqual(contractsVersion);
            expect(transaction).toEqual(
              await setup.provider.getTransaction(
                transactions.etherSwap.lockup!,
              ),
            );
            expect(etherSwapValues).toEqual({
              amount,
              timelock,
              preimageHash: crypto.sha256(preimage),
              refundAddress: await setup.signer.getAddress(),
              claimAddress: await setup.etherBase.getAddress(),
            });
            resolve();
          },
        );
      });

      await contractEventHandler.checkTransaction(
        transactions.etherSwap.lockup!,
      );

      await lockupPromise;
    });

    test('should throw when transaction is not found', async () => {
      await expect(
        contractEventHandler.checkTransaction(
          '0xc94dbe074d07f650a2658357677f5c669e79e30eb13a5f5367138b3eb25c5db6',
        ),
      ).rejects.toEqual(new Error('transaction not found'));
    });
  });

  test('should check for missed events', async () => {
    contractEventHandler['rescanLastHeight'] =
      await setup.provider.getBlockNumber();

    const preimage = randomBytes(32);

    const lockupTx = await contracts.etherSwap.lock(
      crypto.sha256(preimage),
      await setup.etherBase.getAddress(),
      timelock,
      {
        value: amount,
      },
    );
    await lockupTx.wait(1);

    const claimTx = await contracts.etherSwap
      .connect(setup.etherBase)
      [
        'claim(bytes32,uint256,address,uint256)'
      ](preimage, amount, await setup.signer.getAddress(), timelock);
    await claimTx.wait(1);

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once('eth.claim', async (args) => {
        expect(args.version).toEqual(contractsVersion);
        expect(args.transactionHash).toEqual(claimTx.hash);
        expect(args.preimageHash).toEqual(crypto.sha256(preimage));
        expect(args.preimage).toEqual(preimage);
        resolve();
      });
    });

    await contractEventHandler['checkMissedEvents'](setup.provider);
    await claimPromise;

    expect(contractEventHandler['rescanLastHeight']).toEqual(
      await setup.provider.getBlockNumber(),
    );
  });
});
