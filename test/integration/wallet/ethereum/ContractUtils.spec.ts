import { MaxUint256 } from 'ethers';
import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EthereumSetup, getSigner } from '../EthereumTools';
import { getContracts } from '../../../../lib/cli/ethereum/EthereumUtils';
import { ERC20SwapValues, EtherSwapValues } from '../../../../lib/consts/Types';
import {
  queryEtherSwapValues,
  queryERC20SwapValues,
  queryEtherSwapValuesFromLock,
  queryERC20SwapValuesFromLock
} from '../../../../lib/wallet/ethereum/ContractUtils';

describe('ContractUtils', () => {
  let setup: EthereumSetup;

  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;

  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  let etherSwapValues: EtherSwapValues;
  let etherSwapLockTransactionHash: string;

  let erc20SwapValues: ERC20SwapValues;
  let erc20SwapLockTransactionHash: string;

  beforeAll(async () => {
    setup = await getSigner();
    const contracts = await getContracts(setup.etherBase);

    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;

    // EtherSwap
    etherSwapValues = {
      preimageHash,
      timelock: 1,
      amount: BigInt(1),
      claimAddress: await setup.signer.getAddress(),
      refundAddress: await setup.etherBase.getAddress(),
    };

    const etherSwapLock = await etherSwap.lock(
      etherSwapValues.preimageHash,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
      {
        value: etherSwapValues.amount,
      }
    );

    etherSwapLockTransactionHash = etherSwapLock.hash;

    // ERC20Swap
    erc20SwapValues = {
      preimageHash,
      timelock: 2,
      amount: BigInt(2),
      tokenAddress: await contracts.token.getAddress(),
      claimAddress: await setup.signer.getAddress(),
      refundAddress: await setup.etherBase.getAddress(),
    };

    await contracts.token.approve(await erc20Swap.getAddress(), MaxUint256);
    const erc20SwapLock = await erc20Swap.lock(
      erc20SwapValues.preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );

    erc20SwapLockTransactionHash = erc20SwapLock.hash;

    await Promise.all([
      erc20SwapLock.wait(1),
      etherSwapLock.wait(1),
    ]);
  });

  test('should query EtherSwap values from lock transaction hash', async () => {
    expect(
      await queryEtherSwapValuesFromLock(setup.provider, etherSwap, etherSwapLockTransactionHash)
    ).toEqual(etherSwapValues);
  });

  test('should query ERC20Swap values from lock transaction hash', async () => {
    expect(
      await queryERC20SwapValuesFromLock(setup.provider, erc20Swap, erc20SwapLockTransactionHash)
    ).toEqual(erc20SwapValues);
  });

  test('should query EtherSwap values from preimage hash', async () => {
    expect(await queryEtherSwapValues(etherSwap, etherSwapValues.preimageHash)).toEqual(etherSwapValues);
  });

  test('should query ERC20Swap values from preimage hash', async () => {
    expect(await queryERC20SwapValues(erc20Swap, erc20SwapValues.preimageHash)).toEqual(erc20SwapValues);
  });

  afterAll(() => {
    setup.provider.destroy();
  });
});
