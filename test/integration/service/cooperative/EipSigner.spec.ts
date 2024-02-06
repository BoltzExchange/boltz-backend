import { randomBytes } from 'crypto';
import { Signature } from 'ethers';
import { ERC20 } from '../../../../../boltz-core/typechain/ERC20';
import { ERC20Swap } from '../../../../../boltz-core/typechain/ERC20Swap';
import { EtherSwap } from '../../../../../boltz-core/typechain/EtherSwap';
import Logger from '../../../../lib/Logger';
import { getHexString } from '../../../../lib/Utils';
import { etherDecimals } from '../../../../lib/consts/Consts';
import { SwapUpdateEvent } from '../../../../lib/consts/Enums';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import Errors from '../../../../lib/service/Errors';
import EipSigner from '../../../../lib/service/cooperative/EipSigner';
import WalletManager from '../../../../lib/wallet/WalletManager';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
} from '../../wallet/EthereumTools';

jest.mock('../../../../lib/db/repositories/SwapRepository', () => ({
  getSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('EipSigner', () => {
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

    await fundSignerWallet(setup.signer, setup.etherBase, contracts.token);

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
                  .mockImplementation((amount) => amount),
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
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw when no swap can be found', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue(undefined);

    const id = 'notFound';
    await expect(signer.signSwapRefund(id)).rejects.toEqual(
      Errors.SWAP_NOT_FOUND(id),
    );
  });

  test('should throw when swap is not eligible for refund', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'TOKEN/BTC',
      status: SwapUpdateEvent.SwapCreated,
    });
    await expect(signer.signSwapRefund('not eligible')).rejects.toEqual(
      Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(),
    );
  });

  test('should throw when no signer is available', async () => {
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'BTC/BTC',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
    await expect(signer.signSwapRefund('no signer')).rejects.toEqual(
      'no signer for currency',
    );
  });

  test('should refund EtherSwap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10) ** BigInt(17);
    const timelock = (await setup.provider.getBlockNumber()) + 21;

    await (
      await etherSwap.lock(
        preimageHash,
        await setup.etherBase.getAddress(),
        timelock,
        {
          value: amount,
        },
      )
    ).wait(1);

    const id = 'rswap';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'RBTC/BTC',
      timeoutBlockHeight: timelock,
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
      onchainAmount: Number(amount / etherDecimals),
    });

    const rawSig = await signer.signSwapRefund(id);

    const sig = Signature.from(rawSig);
    const refundTx = await etherSwap.refundCooperative(
      preimageHash,
      amount,
      await setup.etherBase.getAddress(),
      timelock,
      sig.v,
      sig.r,
      sig.s,
    );
    // Transaction doesn't fail -> refund worked
    await refundTx.wait(1);
  });

  test('should refund ERC20Swap cooperatively', async () => {
    const preimageHash = randomBytes(32);
    const amount = BigInt(10);
    const timelock = (await setup.provider.getBlockNumber()) + 21;

    await (await token.approve(await erc20Swap.getAddress(), amount)).wait(1);
    await (
      await erc20Swap.lock(
        preimageHash,
        amount,
        await token.getAddress(),
        await setup.etherBase.getAddress(),
        timelock,
      )
    ).wait(1);

    const id = 'tswap';
    SwapRepository.getSwap = jest.fn().mockResolvedValue({
      orderSide: 1,
      pair: 'TOKEN/BTC',
      timeoutBlockHeight: timelock,
      onchainAmount: Number(amount),
      preimageHash: getHexString(preimageHash),
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });

    const rawSig = await signer.signSwapRefund(id);

    const sig = Signature.from(rawSig);
    const refundTx = await erc20Swap.refundCooperative(
      preimageHash,
      amount,
      await token.getAddress(),
      await setup.etherBase.getAddress(),
      timelock,
      sig.v,
      sig.r,
      sig.s,
    );
    // Transaction doesn't fail -> refund worked
    await refundTx.wait(1);
  });
});
