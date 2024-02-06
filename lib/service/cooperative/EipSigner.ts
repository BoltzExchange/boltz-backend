import Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { etherDecimals } from '../../consts/Consts';
import Swap from '../../db/models/Swap';
import SwapRepository from '../../db/repositories/SwapRepository';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import EthereumManager from '../../wallet/ethereum/EthereumManager';
import ERC20WalletProvider from '../../wallet/providers/ERC20WalletProvider';
import Errors from '../Errors';
import MusigSigner from './MusigSigner';

class EipSigner {
  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
  ) {}

  public signSwapRefund = async (swapId: string) => {
    const swap = await SwapRepository.getSwap({ id: swapId });
    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(swapId);
    }

    const { base, quote } = splitPairId(swap.pair);

    if (
      !(await MusigSigner.isEligibleForRefund(
        swap,
        this.currencies.get(
          getLightningCurrency(base, quote, swap.orderSide, false),
        )!,
      ))
    ) {
      this.logger.verbose(
        `Not creating EIP-712 signature for refund of Swap ${swap.id}: it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    this.logger.debug(
      `Creating EIP-712 signature for refund of Swap ${swap.id}`,
    );

    const chainSymbol = getChainCurrency(base, quote, swap.orderSide, false);
    const manager = this.walletManager.ethereumManagers.find((man) =>
      man.hasSymbol(chainSymbol),
    );

    if (manager === undefined) {
      throw 'no signer for currency';
    }

    const { domain, types, value } = await this.getSigningData(
      manager,
      chainSymbol,
      swap,
    );
    return manager.signer.signTypedData(domain, types, value);
  };

  private getSigningData = async (
    manager: EthereumManager,
    chainSymbol: string,
    swap: Swap,
  ) => {
    const isEtherSwap = manager.networkDetails.symbol === chainSymbol;
    const contract = isEtherSwap ? manager.etherSwap : manager.erc20Swap;

    const value: Record<string, any> = {
      claimAddress: manager.address,
      timeout: swap.timeoutBlockHeight,
      preimageHash: getHexBuffer(swap.preimageHash),
      amount: isEtherSwap
        ? BigInt(swap.onchainAmount!) * etherDecimals
        : (
            this.walletManager.wallets.get(chainSymbol)!
              .walletProvider as ERC20WalletProvider
          ).formatTokenAmount(swap.onchainAmount!),
    };

    if (!isEtherSwap) {
      value.tokenAddress = manager.tokenAddresses.get(chainSymbol);
    }

    return {
      value,
      domain: {
        name: isEtherSwap ? 'EtherSwap' : 'ERC20Swap',
        version: (await contract.version()).toString(),
        chainId: manager.network.chainId,
        verifyingContract: await contract.getAddress(),
      },
      types: {
        Refund: isEtherSwap
          ? [
              {
                type: 'bytes32',
                name: 'preimageHash',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
              {
                type: 'address',
                name: 'claimAddress',
              },
              {
                type: 'uint256',
                name: 'timeout',
              },
            ]
          : [
              {
                type: 'bytes32',
                name: 'preimageHash',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
              {
                type: 'address',
                name: 'tokenAddress',
              },
              {
                type: 'address',
                name: 'claimAddress',
              },
              {
                type: 'uint256',
                name: 'timeout',
              },
            ],
      },
    };
  };
}

export default EipSigner;
