import { crypto } from 'bitcoinjs-lib';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { MaxUint256 } from 'ethers';
import type {
  AnySwap,
  ERC20SwapValues,
  EtherSwapValues,
} from '../../../../../lib/consts/Types';
import CommitmentRepository from '../../../../../lib/db/repositories/CommitmentRepository';
import Errors from '../../../../../lib/wallet/ethereum/Errors';
import {
  computeLockupHash,
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../../../../../lib/wallet/ethereum/contracts/ContractUtils';
import type { EthereumSetup } from '../../EthereumTools';
import { getContracts, getSigner } from '../../EthereumTools';

describe('ContractUtils', () => {
  let setup: EthereumSetup;

  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;

  const preimage = randomBytes(32);
  const preimageHash = crypto.sha256(preimage);

  const swap = {
    id: 'test-swap-id',
    preimageHash: preimageHash.toString('hex'),
  } as unknown as AnySwap;

  let etherSwapValues: EtherSwapValues;
  let etherSwapLockTransactionHash: string;
  let etherSwapLockupHash: string;

  let erc20SwapValues: ERC20SwapValues;
  let erc20SwapLockTransactionHash: string;
  let erc20SwapLockupHash: string;

  const getBySwapIdSpy = jest.spyOn(CommitmentRepository, 'getBySwapId');

  beforeAll(async () => {
    setup = await getSigner();
    const contracts = await getContracts(setup.etherBase);

    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;

    etherSwapValues = {
      preimageHash,
      timelock: 1,
      amount: BigInt(1),
      claimAddress: await setup.signer.getAddress(),
      refundAddress: await setup.etherBase.getAddress(),
    };

    const etherSwapLock = await etherSwap['lock(bytes32,address,uint256)'](
      etherSwapValues.preimageHash,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
      {
        value: etherSwapValues.amount,
      },
    );

    etherSwapLockTransactionHash = etherSwapLock.hash;

    erc20SwapValues = {
      preimageHash,
      timelock: 2,
      amount: BigInt(2),
      tokenAddress: await contracts.token.getAddress(),
      claimAddress: await setup.signer.getAddress(),
      refundAddress: await setup.etherBase.getAddress(),
    };

    await contracts.token.approve(await erc20Swap.getAddress(), MaxUint256);
    const erc20SwapLock = await erc20Swap[
      'lock(bytes32,uint256,address,address,uint256)'
    ](
      erc20SwapValues.preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );

    erc20SwapLockTransactionHash = erc20SwapLock.hash;

    await Promise.all([erc20SwapLock.wait(1), etherSwapLock.wait(1)]);

    etherSwapLockupHash = await computeLockupHash(etherSwap, {
      preimageHash: etherSwapValues.preimageHash,
      amount: etherSwapValues.amount,
      claimAddress: etherSwapValues.claimAddress,
      refundAddress: etherSwapValues.refundAddress,
      timelock: BigInt(etherSwapValues.timelock),
    });

    erc20SwapLockupHash = await computeLockupHash(erc20Swap, {
      preimageHash: erc20SwapValues.preimageHash,
      amount: erc20SwapValues.amount,
      claimAddress: erc20SwapValues.claimAddress,
      refundAddress: erc20SwapValues.refundAddress,
      timelock: BigInt(erc20SwapValues.timelock),
      tokenAddress: erc20SwapValues.tokenAddress,
    });
  });

  beforeEach(() => {
    getBySwapIdSpy.mockReset();
  });

  describe('with preimageHash identifier', () => {
    beforeEach(() => {
      getBySwapIdSpy.mockResolvedValue(null as any);
    });

    test('should query EtherSwap values from lock transaction hash', async () => {
      expect(
        await queryEtherSwapValuesFromLock(
          swap,
          setup.provider,
          etherSwap,
          etherSwapLockTransactionHash,
        ),
      ).toEqual(etherSwapValues);

      expect(CommitmentRepository.getBySwapId).toHaveBeenCalledWith(swap.id);
    });

    test('should query ERC20Swap values from lock transaction hash', async () => {
      expect(
        await queryERC20SwapValuesFromLock(
          swap,
          setup.provider,
          erc20Swap,
          erc20SwapLockTransactionHash,
        ),
      ).toEqual(erc20SwapValues);

      expect(CommitmentRepository.getBySwapId).toHaveBeenCalledWith(swap.id);
    });

    test('should throw when preimageHash does not match', async () => {
      const wrongSwap = {
        id: 'wrong-swap-id',
        preimageHash: randomBytes(32).toString('hex'),
      } as unknown as AnySwap;

      await expect(
        queryEtherSwapValuesFromLock(
          wrongSwap,
          setup.provider,
          etherSwap,
          etherSwapLockTransactionHash,
        ),
      ).rejects.toEqual(
        Errors.INVALID_LOCKUP_TRANSACTION(etherSwapLockTransactionHash),
      );
    });
  });

  describe('with lockupHash identifier', () => {
    test('should query EtherSwap values by lockupHash', async () => {
      getBySwapIdSpy.mockResolvedValue({
        lockupHash: etherSwapLockupHash,
      } as any);

      expect(
        await queryEtherSwapValuesFromLock(
          swap,
          setup.provider,
          etherSwap,
          etherSwapLockTransactionHash,
        ),
      ).toEqual(etherSwapValues);

      expect(CommitmentRepository.getBySwapId).toHaveBeenCalledWith(swap.id);
    });

    test('should query ERC20Swap values by lockupHash', async () => {
      getBySwapIdSpy.mockResolvedValue({
        lockupHash: erc20SwapLockupHash,
      } as any);

      expect(
        await queryERC20SwapValuesFromLock(
          swap,
          setup.provider,
          erc20Swap,
          erc20SwapLockTransactionHash,
        ),
      ).toEqual(erc20SwapValues);

      expect(CommitmentRepository.getBySwapId).toHaveBeenCalledWith(swap.id);
    });

    test('should throw when lockupHash does not match any lockup event', async () => {
      getBySwapIdSpy.mockResolvedValue({
        lockupHash: '0x' + '00'.repeat(32),
      } as any);

      await expect(
        queryEtherSwapValuesFromLock(
          swap,
          setup.provider,
          etherSwap,
          etherSwapLockTransactionHash,
        ),
      ).rejects.toEqual(
        Errors.INVALID_LOCKUP_TRANSACTION(etherSwapLockTransactionHash),
      );
    });
  });

  describe('computeLockupHash', () => {
    test('should compute correct hash for EtherSwap', async () => {
      const hash = await computeLockupHash(etherSwap, {
        preimageHash: etherSwapValues.preimageHash,
        amount: etherSwapValues.amount,
        claimAddress: etherSwapValues.claimAddress,
        refundAddress: etherSwapValues.refundAddress,
        timelock: BigInt(etherSwapValues.timelock),
      });

      const expectedHash = await etherSwap.hashValues(
        etherSwapValues.preimageHash,
        etherSwapValues.amount,
        etherSwapValues.claimAddress,
        etherSwapValues.refundAddress,
        etherSwapValues.timelock,
      );

      expect(hash).toEqual(expectedHash);
    });

    test('should compute correct hash for ERC20Swap', async () => {
      const hash = await computeLockupHash(erc20Swap, {
        preimageHash: erc20SwapValues.preimageHash,
        amount: erc20SwapValues.amount,
        claimAddress: erc20SwapValues.claimAddress,
        refundAddress: erc20SwapValues.refundAddress,
        timelock: BigInt(erc20SwapValues.timelock),
        tokenAddress: erc20SwapValues.tokenAddress,
      });

      const expectedHash = await erc20Swap.hashValues(
        erc20SwapValues.preimageHash,
        erc20SwapValues.amount,
        erc20SwapValues.tokenAddress!,
        erc20SwapValues.claimAddress,
        erc20SwapValues.refundAddress,
        erc20SwapValues.timelock,
      );

      expect(hash).toEqual(expectedHash);
    });

    test('should compute different hashes for different parameters', async () => {
      const hash1 = await computeLockupHash(etherSwap, {
        preimageHash: etherSwapValues.preimageHash,
        amount: etherSwapValues.amount,
        claimAddress: etherSwapValues.claimAddress,
        refundAddress: etherSwapValues.refundAddress,
        timelock: BigInt(etherSwapValues.timelock),
      });

      const hash2 = await computeLockupHash(etherSwap, {
        preimageHash: etherSwapValues.preimageHash,
        amount: etherSwapValues.amount + 1n,
        claimAddress: etherSwapValues.claimAddress,
        refundAddress: etherSwapValues.refundAddress,
        timelock: BigInt(etherSwapValues.timelock),
      });

      expect(hash1).not.toEqual(hash2);
    });
  });

  afterAll(() => {
    setup.provider.destroy();
  });
});
