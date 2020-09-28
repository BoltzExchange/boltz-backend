import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { BigNumber, constants } from 'ethers';
import { getSigner, getSwapContracts, getTokenContract } from '../EthereumTools';
import { ERC20SwapValues, EtherSwapValues } from '../../../../lib/wallet/ethereum/ContractEventHandler';
import {
  queryEtherSwapValues,
  queryERC20SwapValues,
  queryEtherSwapValuesFromLock,
  queryERC20SwapValuesFromLock
} from '../../../../lib/wallet/ethereum/ContractUtils';

describe('ContractUtils', () => {
  const { etherBase, signer, provider } = getSigner();

  const tokenContract = getTokenContract(etherBase);
  const { etherSwap, erc20Swap } = getSwapContracts(etherBase);

  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  let etherSwapValues: EtherSwapValues;
  let etherSwapLockTransactionHash: string;

  let erc20SwapValues: ERC20SwapValues;
  let erc20SwapLockTransactionHash: string;

  beforeAll(async () => {
    // EtherSwap
    etherSwapValues = {
      preimageHash,
      timelock: 1,
      amount: BigNumber.from(1),
      claimAddress: await signer.getAddress(),
      refundAddress: await etherBase.getAddress(),
    };

    const etherSwapLock = await etherSwap.lock(
      etherSwapValues.preimageHash,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
      {
        value: etherSwapValues.amount,
      }
    );
    await etherSwapLock.wait(1);

    etherSwapLockTransactionHash = etherSwapLock.hash;

    // ERC20Swap
    erc20SwapValues = {
      preimageHash,
      timelock: 2,
      amount: BigNumber.from(2),
      tokenAddress: tokenContract.address,
      claimAddress: await signer.getAddress(),
      refundAddress: await etherBase.getAddress(),
    };

    await tokenContract.approve(erc20Swap.address, constants.MaxUint256);
    const erc20SwapLock = await erc20Swap.lock(
      erc20SwapValues.preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );
    await erc20SwapLock.wait(1);

    erc20SwapLockTransactionHash = erc20SwapLock.hash;
  });

  test('should query EtherSwap values from lock transaction hash', async () => {
    expect(await queryEtherSwapValuesFromLock(etherSwap, etherSwapLockTransactionHash)).toEqual(etherSwapValues);
  });

  test('should query ERC20Swap values from lock transaction hash', async () => {
    expect(await queryERC20SwapValuesFromLock(erc20Swap, erc20SwapLockTransactionHash)).toEqual(erc20SwapValues);
  });

  test('should query EtherSwap values from preimage hash', async () => {
    expect(await queryEtherSwapValues(etherSwap, etherSwapValues.preimageHash)).toEqual(etherSwapValues);
  });

  test('should query ERC20Swap values from preimage hash', async () => {
    expect(await queryERC20SwapValues(erc20Swap, erc20SwapValues.preimageHash)).toEqual(erc20SwapValues);
  });

  afterAll(async () => {
    await provider.destroy();
  });
});
