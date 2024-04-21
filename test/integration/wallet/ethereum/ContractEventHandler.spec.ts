import { crypto } from 'bitcoinjs-lib';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { MaxUint256 } from 'ethers';
import Logger from '../../../../lib/Logger';
import ContractEventHandler from '../../../../lib/wallet/ethereum/ContractEventHandler';
import { Ethereum } from '../../../../lib/wallet/ethereum/EvmNetworks';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
} from '../EthereumTools';

type Transactions = {
  lockup?: string;
  claim?: string;
  refund?: string;
};

describe('ContractEventHandler', () => {
  const contractEventHandler = new ContractEventHandler(Logger.disabledLogger);

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
    setup.provider.destroy();
  });

  test('should init', async () => {
    await contractEventHandler.init(
      Ethereum,
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
        async ({ transaction, etherSwapValues }) => {
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
    const tx = await contracts.etherSwap.connect(setup.etherBase)[
      // eslint-disable-next-line no-unexpected-multiline
      'claim(bytes32,uint256,address,uint256)'
    ](preimage, amount, await setup.signer.getAddress(), timelock);
    transactions.etherSwap.claim = tx.hash;

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.claim',
        async ({ transactionHash, preimageHash, preimage }) => {
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

    const tx = await contracts.etherSwap.refund(
      crypto.sha256(preimage),
      amount,
      await setup.etherBase.getAddress(),
      timelock,
    );
    transactions.etherSwap.refund = tx.hash;

    const refundPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'eth.refund',
        async ({ transactionHash, preimageHash }) => {
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
        async ({ transaction, erc20SwapValues }) => {
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
    const tx = await contracts.erc20Swap.connect(setup.etherBase)[
      // eslint-disable-next-line no-unexpected-multiline
      'claim(bytes32,uint256,address,address,uint256)'
    ](preimage, amount, await contracts.token.getAddress(), await setup.signer.getAddress(), timelock);
    transactions.erc20Swap.claim = tx.hash;

    const claimPromise = new Promise<void>((resolve) => {
      contractEventHandler.once(
        'erc20.claim',
        async ({ transactionHash, preimageHash, preimage }) => {
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

    const tx = await contracts.erc20Swap.refund(
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
        async ({ transactionHash, preimageHash }) => {
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
        async ({ transaction, etherSwapValues }) => {
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
        async ({ transactionHash, preimageHash, preimage }) => {
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
        async ({ transactionHash, preimageHash }) => {
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
        async ({ transaction, erc20SwapValues }) => {
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
        async ({ transactionHash, preimageHash, preimage }) => {
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
        async ({ transactionHash, preimageHash }) => {
          expect(transactionHash).toEqual(transactions.erc20Swap.refund);
          expect(preimageHash).toEqual(preimageHash);
          resolve();
        },
      );
    });

    await contractEventHandler.rescan(startingHeight);
    await Promise.all([lockupPromise, claimPromise, refundPromise]);
  });
});
