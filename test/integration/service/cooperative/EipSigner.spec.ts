import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { randomBytes } from 'crypto';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import { etherDecimals } from '../../../../lib/consts/Consts';
import {
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../../lib/consts/Enums';
import ChainSwapRepository from '../../../../lib/db/repositories/ChainSwapRepository';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import Errors from '../../../../lib/service/Errors';
import EipSigner from '../../../../lib/service/cooperative/EipSigner';
import { RefundRejectionReason } from '../../../../lib/service/cooperative/MusigSigner';
import type Sidecar from '../../../../lib/sidecar/Sidecar';
import type WalletManager from '../../../../lib/wallet/WalletManager';
import type { EthereumSetup } from '../../wallet/EthereumTools';
import { getContracts, getSigner } from '../../wallet/EthereumTools';

jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../lib/db/repositories/ChainSwapRepository', () => ({
  getChainSwap: jest.fn().mockResolvedValue(null),
}));

describe('EipSigner', () => {
  const sidecar = {
    signEvmRefund: jest.fn().mockResolvedValue('0011'),
  } as unknown as Sidecar;

  let setup: EthereumSetup;

  let token: ERC20;
  let etherSwap: EtherSwap;
  let erc20Swap: ERC20Swap;

  let signer: EipSigner;

  beforeAll(async () => {
    setup = await getSigner();
    const contracts = await getContracts(setup.signer);

    token = contracts.token;
    etherSwap = contracts.etherSwap;
    erc20Swap = contracts.erc20Swap;

    signer = new EipSigner(
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
          },
        ],
      } as unknown as WalletManager,
      sidecar,
    );
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
    await expect(signer.signSwapRefund(id)).rejects.toEqual(
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
    await expect(signer.signSwapRefund('not eligible')).rejects.toEqual(
      Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
        RefundRejectionReason.StatusNotEligible,
      ),
    );
  });

  test('should throw when no signer is available', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'BTC/BTC',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
    await expect(signer.signSwapRefund('no signer')).rejects.toEqual(
      'chain currency is not EVM based',
    );
  });

  test('should refund submarine EtherSwap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10) ** BigInt(17);
    const timelock = (await setup.provider.getBlockNumber()) + 21;
    const lockupAddress = '0xfbd623a70f5D6d50d2935071b5c4cd0E5a9772Ad';

    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      lockupAddress,
      orderSide: 1,
      pair: 'RBTC/BTC',
      type: SwapType.Submarine,
      version: SwapVersion.Taproot,
      timeoutBlockHeight: timelock,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      onchainAmount: Number(amount / etherDecimals),
    });

    await signer.signSwapRefund('rswap');

    expect(sidecar.signEvmRefund).toHaveBeenCalledTimes(1);
    expect(sidecar.signEvmRefund).toHaveBeenCalledWith(
      lockupAddress,
      preimageHash,
      amount,
      undefined,
      timelock,
    );
  });

  test('should refund chain EtherSwap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10) ** BigInt(17);
    const lockupAddress = '0xfbd623a70f5D6d50d2935071b5c4cd0E5a9772Ad';
    const timelock = (await setup.provider.getBlockNumber()) + 21;

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
      },
    });
    ChainSwapRepository.setRefundSignatureCreated = jest.fn();

    await signer.signSwapRefund('rswap');

    expect(sidecar.signEvmRefund).toHaveBeenCalledTimes(1);
    expect(sidecar.signEvmRefund).toHaveBeenCalledWith(
      lockupAddress,
      preimageHash,
      amount,
      undefined,
      timelock,
    );

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
    const lockupAddress = '0xfbd623a70f5D6d50d2935071b5c4cd0E5a9772Ad';
    const timelock = (await setup.provider.getBlockNumber()) + 21;

    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      lockupAddress,
      orderSide: 1,
      pair: 'TOKEN/BTC',
      type: SwapType.Submarine,
      version: SwapVersion.Taproot,
      timeoutBlockHeight: timelock,
      onchainAmount: Number(amount),
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });

    await signer.signSwapRefund('tswap');

    expect(sidecar.signEvmRefund).toHaveBeenCalledTimes(1);
    expect(sidecar.signEvmRefund).toHaveBeenCalledWith(
      lockupAddress,
      preimageHash,
      amount,
      await token.getAddress(),
      timelock,
    );
  });

  test('should refund chain ERC20Swap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10);
    const lockupAddress = '0xfbd623a70f5D6d50d2935071b5c4cd0E5a9772Ad';
    const timelock = (await setup.provider.getBlockNumber()) + 21;

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
      },
    });
    ChainSwapRepository.setRefundSignatureCreated = jest.fn();

    await signer.signSwapRefund('tswap');

    expect(sidecar.signEvmRefund).toHaveBeenCalledTimes(1);
    expect(sidecar.signEvmRefund).toHaveBeenCalledWith(
      lockupAddress,
      preimageHash,
      amount,
      await token.getAddress(),
      timelock,
    );

    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledTimes(
      1,
    );
    expect(ChainSwapRepository.setRefundSignatureCreated).toHaveBeenCalledWith(
      id,
    );
  });
});
