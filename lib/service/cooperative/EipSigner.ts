import Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { etherDecimals } from '../../consts/Consts';
import { SwapType } from '../../consts/Enums';
import Swap from '../../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../db/repositories/ChainSwapRepository';
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
    const { swap, chainSymbol, lightningCurrency } = await this.getSwap(swapId);
    const manager = this.walletManager.ethereumManagers.find((man) =>
      man.hasSymbol(chainSymbol),
    );

    if (manager === undefined) {
      throw 'chain currency is not EVM based';
    }

    if (!(await MusigSigner.isEligibleForRefund(swap, lightningCurrency))) {
      this.logger.verbose(
        `Not creating EIP-712 signature for refund of Swap ${swap.id}: it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    this.logger.debug(
      `Creating EIP-712 signature for refund of Swap ${swap.id}`,
    );

    const { domain, types, value } = await this.getSigningData(
      manager,
      swap,
      chainSymbol,
    );
    return manager.signer.signTypedData(domain, types, value);
  };

  private getSwap = async (
    id: string,
  ): Promise<{
    swap: Swap | ChainSwapInfo;
    chainSymbol: string;
    lightningCurrency?: Currency;
  }> => {
    const [swap, chainSwap] = await Promise.all([
      SwapRepository.getSwap({ id }),
      ChainSwapRepository.getChainSwap({ id }),
    ]);

    if (swap !== null) {
      const { base, quote } = splitPairId(swap.pair);

      return {
        swap,
        chainSymbol: getChainCurrency(base, quote, swap.orderSide, false),
        lightningCurrency: this.currencies.get(
          getLightningCurrency(base, quote, swap.orderSide, false),
        ),
      };
    } else if (chainSwap !== null) {
      return {
        swap: chainSwap,
        chainSymbol: chainSwap.receivingData.symbol,
      };
    }

    throw Errors.SWAP_NOT_FOUND(id);
  };

  private getSigningData = async (
    manager: EthereumManager,
    swap: Swap | ChainSwapInfo,
    chainSymbol: string,
  ) => {
    const isEtherSwap = manager.networkDetails.symbol === chainSymbol;
    const contract = isEtherSwap ? manager.etherSwap : manager.erc20Swap;
    const onchainAmount =
      swap.type === SwapType.Submarine
        ? (swap as Swap).onchainAmount
        : (swap as ChainSwapInfo).receivingData.amount;

    const value: Record<string, any> = {
      claimAddress: manager.address,
      timeout: swap.timeoutBlockHeight,
      preimageHash: getHexBuffer(swap.preimageHash),
      amount: isEtherSwap
        ? BigInt(onchainAmount!) * etherDecimals
        : (
            this.walletManager.wallets.get(chainSymbol)!
              .walletProvider as ERC20WalletProvider
          ).formatTokenAmount(onchainAmount!),
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
