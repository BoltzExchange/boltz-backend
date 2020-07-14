import { constants } from 'ethers';
import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import Logger from '../../../../lib/Logger';
import { getSigner, getSwapContracts, getTokenContract } from '../EthereumTools';
import ContractEventHandler from '../../../../lib/wallet/ethereum/ContractEventHandler';

describe('ContractEventHandler', () => {
  const { signer, provider } = getSigner();

  const tokenContract = getTokenContract(signer);
  const { etherSwap, erc20Swap } = getSwapContracts(signer);

  const contractEventHandler = new ContractEventHandler(
    Logger.disabledLogger,
    etherSwap,
    erc20Swap,
  );

  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  let startingHeight: number;

  let eventsEmitted = 0;

  const registerEtherSwapListeners = () => {
    contractEventHandler.once('eth.lockup', (emittedPreimageHash) => {
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });

    contractEventHandler.once('eth.claim', (emittedPreimageHash, emittedPreimage) => {
      expect(preimage).toEqual(emittedPreimage);
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });

    contractEventHandler.once('eth.refund', (emittedPreimageHash) => {
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });
  };

  const registerErc20SwapListeners = () => {
    contractEventHandler.once('erc20.lockup', (emittedPreimageHash) => {
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });

    contractEventHandler.once('erc20.claim', (emittedPreimageHash, emittedPreimage) => {
      expect(preimage).toEqual(emittedPreimage);
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });

    contractEventHandler.once('erc20.refund', (emittedPreimageHash) => {
      expect(emittedPreimageHash).toEqual(preimageHash);

      eventsEmitted += 1;
    });
  };

  beforeAll(async () => {
    startingHeight = await provider.getBlockNumber();
  });

  beforeEach(() => {
    eventsEmitted = 0;
  });

  test('should init', async () => {
    await contractEventHandler.init();
  });

  test('should subscribe to the Ethereum Swap contract events', async () => {
    registerEtherSwapListeners();

    // Lockup
    let lockupTransaction = await etherSwap.lock(preimageHash, await signer.getAddress(), 0, {
      value: 1,
    });
    await lockupTransaction.wait(1);

    expect(eventsEmitted).toEqual(1);

    // Claim
    const claimTransaction = await etherSwap.claim(preimage);
    await claimTransaction.wait(1);

    expect(eventsEmitted).toEqual(2);

    // Refund
    lockupTransaction = await etherSwap.lock(preimageHash, await signer.getAddress(), 0, {
      value: 1,
    });
    await lockupTransaction.wait(1);

    const refundTransaction = await etherSwap.refund(preimageHash);
    await refundTransaction.wait(1);

    expect(eventsEmitted).toEqual(3);
  });

  test('should subscribe to the ERC20 Swap contract events', async () => {
    registerErc20SwapListeners();

    await tokenContract.approve(erc20Swap.address, constants.MaxUint256);

    // Lockup
    let lockupTransaction = await erc20Swap.lock(preimageHash, 1, tokenContract.address, await signer.getAddress(), 0);
    await lockupTransaction.wait(1);

    expect(eventsEmitted).toEqual(1);

    // Claim
    const claimTransaction = await erc20Swap.claim(preimage);
    await claimTransaction.wait(1);

    expect(eventsEmitted).toEqual(2);

    // Refund
    lockupTransaction = await erc20Swap.lock(preimageHash, 1, tokenContract.address, await signer.getAddress(), 0);
    await lockupTransaction.wait(1);

    const refundTransaction = await erc20Swap.refund(preimageHash);
    await refundTransaction.wait(1);

    expect(eventsEmitted).toEqual(3);

    await tokenContract.approve(erc20Swap.address, 0);
  });

  test('should rescan', async () => {
    registerEtherSwapListeners();
    registerErc20SwapListeners();

    await contractEventHandler.rescan(startingHeight);

    expect(eventsEmitted).toEqual(6);
  });

  afterAll(() => {
    contractEventHandler.removeAllListeners();
    provider.removeAllListeners();
  });
});
