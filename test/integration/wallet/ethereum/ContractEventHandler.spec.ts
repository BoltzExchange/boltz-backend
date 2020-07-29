import { BigNumber, constants } from 'ethers';
import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import Logger from '../../../../lib/Logger';
import { waitForFunctionToBeTrue } from '../../../Utils';
import { getSigner, getSwapContracts, getTokenContract } from '../EthereumTools';
import ContractEventHandler from '../../../../lib/wallet/ethereum/ContractEventHandler';

describe('ContractEventHandler', () => {
  const { signer, provider } = getSigner();

  const claimSigner = provider.getSigner('0x3E17171f4A22794c626B6f4B204af2481fC67e30');

  const tokenContract = getTokenContract(signer);
  const { etherSwap, erc20Swap } = getSwapContracts(signer);

  const contractEventHandler = new ContractEventHandler(Logger.disabledLogger);

  let startingHeight: number;

  let eventsEmitted = 0;

  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  const etherSwapValues = {
    amount: BigNumber.from(1),
    claimAddress: '',
    timelock: 2,
  };

  const erc20SwapValues = {
    amount: BigNumber.from(1),
    tokenAddress: tokenContract.address,
    claimAddress: '',
    timelock: 3,
  };

  const etherSwapTransactionHashes = {
    lockup: '',
    claim: '',
    refund: '',
  };

  const erc20SwapTransactionHashes = {
    lockup: '',
    claim: '',
    refund: '',
  };

  const registerEtherSwapListeners = () => {
    contractEventHandler.once('eth.lockup', async (transactionHash, emittedPreimageHash, amount, claimAddress, timelock) => {
      await waitForFunctionToBeTrue(() => {
        return etherSwapTransactionHashes.lockup !== '';
      });

      expect(transactionHash).toEqual(etherSwapTransactionHashes.lockup);

      expect(emittedPreimageHash).toEqual(preimageHash);
      expect(amount).toEqual(etherSwapValues.amount);
      expect(claimAddress).toEqual(etherSwapValues.claimAddress);
      expect(timelock.toNumber()).toEqual(etherSwapValues.timelock);

      eventsEmitted += 1;
    });

    contractEventHandler.once('eth.claim', async (transactionHash, emittedPreimageHash, emittedPreimage) => {
      await waitForFunctionToBeTrue(() => {
        return etherSwapTransactionHashes.claim !== '';
      });

      expect(transactionHash).toEqual(etherSwapTransactionHashes.claim);
      expect(emittedPreimageHash).toEqual(preimageHash);
      expect(preimage).toEqual(emittedPreimage);

      eventsEmitted += 1;
    });

    contractEventHandler.once('eth.refund', async (transactionHash, emittedPreimageHash) => {
      await waitForFunctionToBeTrue(() => {
        return etherSwapTransactionHashes.refund !== '';
      });

      expect(transactionHash).toEqual(etherSwapTransactionHashes.refund);
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });
  };

  const registerErc20SwapListeners = () => {
    contractEventHandler.once('erc20.lockup', async (transactionHash, emittedPreimageHash, amount, tokenAddress, claimAddress, timelock) => {
      await waitForFunctionToBeTrue(() => {
        return erc20SwapTransactionHashes.lockup !== '';
      });

      expect(transactionHash).toEqual(erc20SwapTransactionHashes.lockup);

      expect(emittedPreimageHash).toEqual(preimageHash);
      expect(amount).toEqual(erc20SwapValues.amount);
      expect(tokenAddress).toEqual(erc20SwapValues.tokenAddress);
      expect(claimAddress).toEqual(erc20SwapValues.claimAddress);
      expect(timelock.toNumber()).toEqual(erc20SwapValues.timelock);

      eventsEmitted += 1;
    });

    contractEventHandler.once('erc20.claim', async (transactionHash, emittedPreimageHash, emittedPreimage) => {
      await waitForFunctionToBeTrue(() => {
        return erc20SwapTransactionHashes.claim !== '';
      });

      expect(transactionHash).toEqual(erc20SwapTransactionHashes.claim);
      expect(preimage).toEqual(emittedPreimage);
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });

    contractEventHandler.once('erc20.refund', async (transactionHash, emittedPreimageHash) => {
      await waitForFunctionToBeTrue(() => {
        return erc20SwapTransactionHashes.refund !== '';
      });

      expect(transactionHash).toEqual(erc20SwapTransactionHashes.refund);
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });
  };

  beforeAll(async () => {
    startingHeight = await provider.getBlockNumber();

    etherSwapValues.claimAddress = await claimSigner.getAddress();
    erc20SwapValues.claimAddress = await claimSigner.getAddress();
  });

  beforeEach(() => {
    eventsEmitted = 0;
  });

  test('should init', async () => {
    await contractEventHandler.init(
      etherSwap,
      erc20Swap,
    );
  });

  test('should subscribe to the Ethereum Swap contract events', async () => {
    registerEtherSwapListeners();

    // Lockup
    let lockupTransaction = await etherSwap.lock(preimageHash, etherSwapValues.claimAddress, etherSwapValues.timelock, {
      value: etherSwapValues.amount,
    });
    etherSwapTransactionHashes.lockup = lockupTransaction.hash;

    await lockupTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 1;
    });

    // Claim
    const claimTransaction = await etherSwap.connect(claimSigner).claim(
      preimage,
      etherSwapValues.amount,
      await signer.getAddress(),
      etherSwapValues.timelock,
    );
    etherSwapTransactionHashes.claim = claimTransaction.hash;

    await claimTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 2;
    });

    // Refund
    lockupTransaction = await etherSwap.lock(preimageHash, etherSwapValues.claimAddress, etherSwapValues.timelock, {
      value: etherSwapValues.amount,
    });

    await lockupTransaction.wait(1);

    const refundTransaction = await etherSwap.refund(
      preimageHash,
      etherSwapValues.amount,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
    );
    etherSwapTransactionHashes.refund = refundTransaction.hash;

    await refundTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 3;
    });
  });

  test('should subscribe to the ERC20 Swap contract events', async () => {
    registerErc20SwapListeners();

    await tokenContract.approve(erc20Swap.address, constants.MaxUint256);

    // Lockup
    let lockupTransaction = await erc20Swap.lock(
      preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );
    erc20SwapTransactionHashes.lockup = lockupTransaction.hash;

    await lockupTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 1;
    });

    // Claim
    const claimTransaction = await erc20Swap.connect(claimSigner).claim(
      preimage,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      await signer.getAddress(),
      erc20SwapValues.timelock,
    );
    erc20SwapTransactionHashes.claim = claimTransaction.hash;

    await claimTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 2;
    });

    // Refund
    lockupTransaction = await erc20Swap.lock(
      preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );
    await lockupTransaction.wait(1);

    const refundTransaction = await erc20Swap.refund(
      preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );
    erc20SwapTransactionHashes.refund = refundTransaction.hash;

    await refundTransaction.wait(1);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 3;
    });

    await tokenContract.approve(erc20Swap.address, 0);
  });

  test('should rescan', async () => {
    registerEtherSwapListeners();
    registerErc20SwapListeners();

    await contractEventHandler.rescan(startingHeight);

    await waitForFunctionToBeTrue(() => {
      return eventsEmitted === 6;
    });
  });

  afterAll(() => {
    contractEventHandler.removeAllListeners();
    provider.removeAllListeners();
  });
});
