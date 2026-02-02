import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import { Signature } from 'ethers';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import { etherDecimals } from '../../../../lib/consts/Consts';
import {
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import ChainSwapRepository from '../../../../lib/db/repositories/ChainSwapRepository';
import CommitmentRepository from '../../../../lib/db/repositories/CommitmentRepository';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import Errors from '../../../../lib/service/Errors';
import EipSigner from '../../../../lib/service/cooperative/EipSigner';
import { RefundRejectionReason } from '../../../../lib/service/cooperative/MusigSigner';
import Sidecar from '../../../../lib/sidecar/Sidecar';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import { computeLockupHash } from '../../../../lib/wallet/ethereum/contracts/ContractUtils';
import { sidecar, startSidecar } from '../../sidecar/Utils';
import type { EthereumSetup } from '../../wallet/EthereumTools';
import { getContracts, getSigner } from '../../wallet/EthereumTools';

jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockResolvedValue(null),
  setRefundSignatureCreated: jest.fn(),
}));

jest.mock('../../../../lib/db/repositories/ChainSwapRepository', () => ({
  getChainSwap: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../lib/db/repositories/CommitmentRepository', () => ({
  getBySwapId: jest.fn().mockResolvedValue(null),
}));

describe('EipSigner', () => {
  let setup: EthereumSetup;

  let token: ERC20;
  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;

  let eipSigner: EipSigner;

  beforeAll(async () => {
    await startSidecar();

    setup = await getSigner();
    const contracts = await getContracts(setup.etherBase);

    token = contracts.token;
    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;

    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );

    eipSigner = new EipSigner(
      Logger.disabledLogger,
      new Map<string, any>([['BTC', {}]]),
      {
        wallets: new Map<string, any>([
          [
            'TOKEN',
            {
              walletProvider: {
                formatTokenAmount: jest
                  .fn()
                  .mockImplementation((amount) => BigInt(amount)),
              },
            },
          ],
        ]),
        ethereumManagers: [
          {
            etherSwap,
            erc20Swap,
            provider: setup.provider,
            signer: setup.etherBase,
            address: await setup.etherBase.getAddress(),
            network: {
              chainId: (await setup.provider.getNetwork()).chainId,
            },
            networkDetails: {
              symbol: 'RBTC',
            },
            hasSymbol: jest
              .fn()
              .mockImplementation((symbol) =>
                ['RBTC', 'TOKEN'].includes(symbol),
              ),
            tokenAddresses: new Map<string, string>([
              ['TOKEN', await token.getAddress()],
            ]),
            contractsForAddress: jest.fn().mockImplementation(async () => ({
              etherSwap,
              erc20Swap,
            })),
          },
        ],
      } as unknown as WalletManager,
      sidecar,
    );
  });

  afterAll(async () => {
    await Sidecar.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    SwapRepository.getSwap = jest.fn().mockResolvedValue(null);
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);
  });

  test('should throw when no swap can be found', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue(null);
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

    const id = 'notFound';
    await expect(eipSigner.signSwapRefund(id)).rejects.toEqual(
      Errors.SWAP_NOT_FOUND(id),
    );
  });

  test('should throw when swap is not eligible for refund', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'TOKEN/BTC',
      version: SwapVersion.Taproot,
      status: SwapUpdateEvent.SwapCreated,
    });
    await expect(eipSigner.signSwapRefund('not eligible')).rejects.toEqual(
      Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
        RefundRejectionReason.StatusNotEligible,
      ),
    );
  });

  test('should throw when no coins were locked up', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'RBTC/BTC',
      type: SwapType.Submarine,
      version: SwapVersion.Taproot,
      preimageHash: getHexString(randomBytes(32)),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      lockupAddress: '0xfbd623a70f5D6d50d2935071b5c4cd0E5a9772Ad',
      timeoutBlockHeight: 123,
      onchainAmount: null,
    });
    await expect(eipSigner.signSwapRefund('no coins locked')).rejects.toEqual(
      Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND('no coins were locked up'),
    );
  });

  test('should throw when no signer is available', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'BTC/BTC',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
    await expect(eipSigner.signSwapRefund('no signer')).rejects.toEqual(
      'chain currency is not EVM based',
    );
  });

  test('should refund submarine EtherSwap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10) ** BigInt(17);
    const timelock = (await setup.provider.getBlockNumber()) + 21;
    const claimAddress = await setup.etherBase.getAddress();

    const lockupTx = await etherSwap['lock(bytes32,address,uint256)'](
      preimageHash,
      claimAddress,
      timelock,
      { value: amount },
    );
    await lockupTx.wait(1);

    const lockupAddress = await etherSwap.getAddress();
    const id = 'submarine-ether-swap-id';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      id,
      lockupAddress,
      orderSide: 1,
      pair: 'RBTC/BTC',
      type: SwapType.Submarine,
      version: SwapVersion.Taproot,
      timeoutBlockHeight: timelock,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      onchainAmount: Number(amount / etherDecimals),
      lockupTransactionId: lockupTx.hash,
    });

    const balanceBefore = await setup.provider.getBalance(claimAddress);

    const signature = await eipSigner.signSwapRefund('submarine-ether-swap-id');
    const { v, r, s } = Signature.from(signature);

    const refundTx = await etherSwap[
      'refundCooperative(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)'
    ](preimageHash, amount, claimAddress, timelock, v, r, s);
    await refundTx.wait(1);

    const balanceAfter = await setup.provider.getBalance(claimAddress);
    expect(balanceAfter).toBeGreaterThan(balanceBefore);

    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(1);
    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(id);
  });

  test('should refund chain EtherSwap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10) ** BigInt(17);
    const timelock = (await setup.provider.getBlockNumber()) + 21;
    const claimAddress = await setup.etherBase.getAddress();

    const lockupTx = await etherSwap['lock(bytes32,address,uint256)'](
      preimageHash,
      claimAddress,
      timelock,
      { value: amount },
    );
    await lockupTx.wait(1);

    const lockupAddress = await etherSwap.getAddress();
    const id = 'asdf';
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
      id,
      type: SwapType.Chain,
      version: SwapVersion.Taproot,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      sendingData: {
        transactionId: null,
      },
      receivingData: {
        lockupAddress,
        symbol: 'RBTC',
        timeoutBlockHeight: timelock,
        amount: Number(amount / etherDecimals),
        lockupTransactionId: lockupTx.hash,
      },
    });
    ChainSwapRepository.setRefundSignatureCreated = jest.fn();

    const balanceBefore = await setup.provider.getBalance(claimAddress);

    const signature = await eipSigner.signSwapRefund('rswap');
    const { v, r, s } = Signature.from(signature);

    const refundTx = await etherSwap[
      'refundCooperative(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)'
    ](preimageHash, amount, claimAddress, timelock, v, r, s);
    await refundTx.wait(1);

    const balanceAfter = await setup.provider.getBalance(claimAddress);
    expect(balanceAfter).toBeGreaterThan(balanceBefore);

    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(
      1,
    );
    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(
      id,
    );
  });

  test('should refund submarine ERC20Swap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10);
    const timelock = (await setup.provider.getBlockNumber()) + 21;
    const claimAddress = await setup.etherBase.getAddress();
    const tokenAddress = await token.getAddress();

    await (await token.approve(await erc20Swap.getAddress(), amount)).wait(1);
    const lockupTx = await erc20Swap[
      'lock(bytes32,uint256,address,address,uint256)'
    ](preimageHash, amount, tokenAddress, claimAddress, timelock);
    await lockupTx.wait(1);

    const lockupAddress = await erc20Swap.getAddress();
    const id = 'submarine-erc20-swap-id';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      id,
      lockupAddress,
      orderSide: 1,
      pair: 'TOKEN/BTC',
      type: SwapType.Submarine,
      version: SwapVersion.Taproot,
      timeoutBlockHeight: timelock,
      onchainAmount: Number(amount),
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      lockupTransactionId: lockupTx.hash,
    });

    const balanceBefore = await token.balanceOf(claimAddress);

    const signature = await eipSigner.signSwapRefund('submarine-erc20-swap-id');
    const { v, r, s } = Signature.from(signature);

    const refundTx = await erc20Swap[
      'refundCooperative(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)'
    ](preimageHash, amount, tokenAddress, claimAddress, timelock, v, r, s);
    await refundTx.wait(1);

    const balanceAfter = await token.balanceOf(claimAddress);
    expect(balanceAfter).toBeGreaterThan(balanceBefore);

    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(1);
    expect(SwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(id);
  });

  test('should refund chain ERC20Swap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10);
    const timelock = (await setup.provider.getBlockNumber()) + 21;
    const claimAddress = await setup.etherBase.getAddress();
    const tokenAddress = await token.getAddress();

    await (await token.approve(await erc20Swap.getAddress(), amount)).wait(1);
    const lockupTx = await erc20Swap[
      'lock(bytes32,uint256,address,address,uint256)'
    ](preimageHash, amount, tokenAddress, claimAddress, timelock);
    await lockupTx.wait(1);

    const lockupAddress = await erc20Swap.getAddress();
    const id = 'erc20';
    ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
      id,
      type: SwapType.Chain,
      version: SwapVersion.Taproot,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      sendingData: {
        transactionId: null,
      },
      receivingData: {
        lockupAddress,
        symbol: 'TOKEN',
        amount: Number(amount),
        timeoutBlockHeight: timelock,
        lockupTransactionId: lockupTx.hash,
      },
    });
    ChainSwapRepository.setRefundSignatureCreated = jest.fn();

    const balanceBefore = await token.balanceOf(claimAddress);

    const signature = await eipSigner.signSwapRefund('tswap');
    const { v, r, s } = Signature.from(signature);

    const refundTx = await erc20Swap[
      'refundCooperative(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)'
    ](preimageHash, amount, tokenAddress, claimAddress, timelock, v, r, s);
    await refundTx.wait(1);

    const balanceAfter = await token.balanceOf(claimAddress);
    expect(balanceAfter).toBeGreaterThan(balanceBefore);

    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(
      1,
    );
    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(
      id,
    );
  });

  describe('Commitment Swaps', () => {
    const zerosPreimageHash = Buffer.alloc(32, 0);

    beforeEach(() => {
      CommitmentRepository.getBySwapId = jest.fn().mockResolvedValue(null);
    });

    test('should refund submarine EtherSwap with commitment cooperatively', async () => {
      const swapPreimageHash = randomBytes(32);
      const amount = BigInt(10) ** BigInt(17);
      const timelock = (await setup.provider.getBlockNumber()) + 21;
      const claimAddress = await setup.etherBase.getAddress();

      const lockupTx = await etherSwap['lock(bytes32,address,uint256)'](
        zerosPreimageHash,
        claimAddress,
        timelock,
        { value: amount },
      );
      await lockupTx.wait(1);

      const refundAddress = await setup.etherBase.getAddress();
      const lockupHash = await computeLockupHash(etherSwap, {
        preimageHash: zerosPreimageHash,
        amount,
        claimAddress,
        refundAddress,
        timelock: BigInt(timelock),
      });

      CommitmentRepository.getBySwapId = jest.fn().mockResolvedValue({
        swapId: 'commitment-sub-ether',
        transactionHash: lockupTx.hash,
        lockupHash,
        signature: Buffer.alloc(65, 0),
      });

      const lockupAddress = await etherSwap.getAddress();
      const id = 'commitment-sub-ether';
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        id,
        lockupAddress,
        orderSide: 1,
        pair: 'RBTC/BTC',
        type: SwapType.Submarine,
        version: SwapVersion.Taproot,
        timeoutBlockHeight: timelock,
        preimageHash: getHexString(swapPreimageHash),
        status: SwapUpdateEvent.InvoiceFailedToPay,
        onchainAmount: Number(amount / etherDecimals),
        lockupTransactionId: lockupTx.hash,
      });

      const balanceBefore = await setup.provider.getBalance(claimAddress);

      const signature = await eipSigner.signSwapRefund(id);
      const { v, r, s } = Signature.from(signature);

      // Note: commitment swaps use zerosPreimageHash for the lockup
      const refundTx = await etherSwap[
        'refundCooperative(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)'
      ](zerosPreimageHash, amount, claimAddress, timelock, v, r, s);
      await refundTx.wait(1);

      const balanceAfter = await setup.provider.getBalance(claimAddress);
      expect(balanceAfter).toBeGreaterThan(balanceBefore);
    });

    test('should refund submarine ERC20Swap with commitment cooperatively', async () => {
      const swapPreimageHash = randomBytes(32);
      const amount = BigInt(10);
      const timelock = (await setup.provider.getBlockNumber()) + 21;
      const claimAddress = await setup.etherBase.getAddress();
      const tokenAddress = await token.getAddress();
      const erc20SwapAddress = await erc20Swap.getAddress();

      await (await token.approve(erc20SwapAddress, amount)).wait(1);
      const lockupTx = await erc20Swap[
        'lock(bytes32,uint256,address,address,uint256)'
      ](zerosPreimageHash, amount, tokenAddress, claimAddress, timelock);
      await lockupTx.wait(1);

      const refundAddress = await setup.etherBase.getAddress();
      const lockupHash = await computeLockupHash(erc20Swap, {
        preimageHash: zerosPreimageHash,
        amount,
        claimAddress,
        refundAddress,
        timelock: BigInt(timelock),
        tokenAddress,
      });

      CommitmentRepository.getBySwapId = jest.fn().mockResolvedValue({
        swapId: 'commitment-sub-erc20',
        transactionHash: lockupTx.hash,
        lockupHash,
        signature: Buffer.alloc(65, 0),
      });

      const lockupAddress = await erc20Swap.getAddress();
      const id = 'commitment-sub-erc20';
      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        id,
        lockupAddress,
        orderSide: 1,
        pair: 'TOKEN/BTC',
        type: SwapType.Submarine,
        version: SwapVersion.Taproot,
        timeoutBlockHeight: timelock,
        onchainAmount: Number(amount),
        preimageHash: getHexString(swapPreimageHash),
        status: SwapUpdateEvent.InvoiceFailedToPay,
        lockupTransactionId: lockupTx.hash,
      });

      const balanceBefore = await token.balanceOf(claimAddress);

      const signature = await eipSigner.signSwapRefund(id);
      const { v, r, s } = Signature.from(signature);

      const refundTx = await erc20Swap[
        'refundCooperative(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)'
      ](
        zerosPreimageHash,
        amount,
        tokenAddress,
        claimAddress,
        timelock,
        v,
        r,
        s,
      );
      await refundTx.wait(1);

      const balanceAfter = await token.balanceOf(claimAddress);
      expect(balanceAfter).toBeGreaterThan(balanceBefore);
    });

    test('should refund chain EtherSwap with commitment cooperatively', async () => {
      const swapPreimageHash = randomBytes(32);
      const amount = BigInt(10) ** BigInt(17);
      const timelock = (await setup.provider.getBlockNumber()) + 21;
      const claimAddress = await setup.etherBase.getAddress();

      const lockupTx = await etherSwap['lock(bytes32,address,uint256)'](
        zerosPreimageHash,
        claimAddress,
        timelock,
        { value: amount },
      );
      await lockupTx.wait(1);

      const refundAddress = await setup.etherBase.getAddress();
      const lockupHash = await computeLockupHash(etherSwap, {
        preimageHash: zerosPreimageHash,
        amount,
        claimAddress,
        refundAddress,
        timelock: BigInt(timelock),
      });

      CommitmentRepository.getBySwapId = jest.fn().mockResolvedValue({
        swapId: 'commitment-chain-ether',
        transactionHash: lockupTx.hash,
        lockupHash,
        signature: Buffer.alloc(65, 0),
      });

      const lockupAddress = await etherSwap.getAddress();
      const id = 'commitment-chain-ether';
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id,
        type: SwapType.Chain,
        version: SwapVersion.Taproot,
        preimageHash: getHexString(swapPreimageHash),
        status: SwapUpdateEvent.InvoiceFailedToPay,
        sendingData: {
          transactionId: null,
        },
        receivingData: {
          lockupAddress,
          symbol: 'RBTC',
          timeoutBlockHeight: timelock,
          amount: Number(amount / etherDecimals),
          lockupTransactionId: lockupTx.hash,
        },
      });
      ChainSwapRepository.setRefundSignatureCreated = jest.fn();

      const balanceBefore = await setup.provider.getBalance(claimAddress);

      const signature = await eipSigner.signSwapRefund(id);
      const { v, r, s } = Signature.from(signature);

      const refundTx = await etherSwap[
        'refundCooperative(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)'
      ](zerosPreimageHash, amount, claimAddress, timelock, v, r, s);
      await refundTx.wait(1);

      const balanceAfter = await setup.provider.getBalance(claimAddress);
      expect(balanceAfter).toBeGreaterThan(balanceBefore);
    });

    test('should refund chain ERC20Swap with commitment cooperatively', async () => {
      const swapPreimageHash = randomBytes(32);
      const amount = BigInt(10);
      const timelock = (await setup.provider.getBlockNumber()) + 21;
      const claimAddress = await setup.etherBase.getAddress();
      const tokenAddress = await token.getAddress();
      const erc20SwapAddress = await erc20Swap.getAddress();

      await (await token.approve(erc20SwapAddress, amount)).wait(1);
      const lockupTx = await erc20Swap[
        'lock(bytes32,uint256,address,address,uint256)'
      ](zerosPreimageHash, amount, tokenAddress, claimAddress, timelock);
      await lockupTx.wait(1);

      const refundAddress = await setup.etherBase.getAddress();
      const lockupHash = await computeLockupHash(erc20Swap, {
        preimageHash: zerosPreimageHash,
        amount,
        claimAddress,
        refundAddress,
        timelock: BigInt(timelock),
        tokenAddress,
      });

      CommitmentRepository.getBySwapId = jest.fn().mockResolvedValue({
        swapId: 'commitment-chain-erc20',
        transactionHash: lockupTx.hash,
        lockupHash,
        signature: Buffer.alloc(65, 0),
      });

      const lockupAddress = erc20SwapAddress;
      const id = 'commitment-chain-erc20';
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue({
        id,
        type: SwapType.Chain,
        version: SwapVersion.Taproot,
        preimageHash: getHexString(swapPreimageHash),
        status: SwapUpdateEvent.InvoiceFailedToPay,
        sendingData: {
          transactionId: null,
        },
        receivingData: {
          lockupAddress,
          symbol: 'TOKEN',
          amount: Number(amount),
          timeoutBlockHeight: timelock,
          lockupTransactionId: lockupTx.hash,
        },
      });
      ChainSwapRepository.setRefundSignatureCreated = jest.fn();

      const balanceBefore = await token.balanceOf(claimAddress);

      const signature = await eipSigner.signSwapRefund(id);
      const { v, r, s } = Signature.from(signature);

      const refundTx = await erc20Swap[
        'refundCooperative(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)'
      ](
        zerosPreimageHash,
        amount,
        tokenAddress,
        claimAddress,
        timelock,
        v,
        r,
        s,
      );
      await refundTx.wait(1);

      const balanceAfter = await token.balanceOf(claimAddress);
      expect(balanceAfter).toBeGreaterThan(balanceBefore);
    });
  });
});
