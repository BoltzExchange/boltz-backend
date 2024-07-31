import Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { etherDecimals } from '../../consts/Consts';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import Swap from '../../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../db/repositories/ChainSwapRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import Sidecar from '../../sidecar/Sidecar';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import ERC20WalletProvider from '../../wallet/providers/ERC20WalletProvider';
import Errors from '../Errors';
import MusigSigner from './MusigSigner';

class EipSigner {
  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    private readonly sidecar: Sidecar,
  ) {}

  public signSwapRefund = async (swapId: string) => {
    const { swap, chainSymbol, lightningCurrency } = await this.getSwap(swapId);
    const manager = this.walletManager.ethereumManagers.find((man) =>
      man.hasSymbol(chainSymbol),
    );

    if (manager === undefined) {
      throw 'chain currency is not EVM based';
    }

    {
      const rejectionReason = await MusigSigner.refundNonEligibilityReason(
        swap,
        lightningCurrency,
      );
      if (rejectionReason !== undefined) {
        this.logger.verbose(
          `Not creating EIP-712 signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${rejectionReason}`,
        );
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(rejectionReason);
      }
    }

    this.logger.debug(
      `Creating EIP-712 signature for refund of Swap ${swap.id}`,
    );

    const isEtherSwap = manager.networkDetails.symbol === chainSymbol;

    const onchainAmount =
      swap.type === SwapType.Submarine
        ? (swap as Swap).onchainAmount
        : (swap as ChainSwapInfo).receivingData.amount;

    const sidecarRes = await this.sidecar.signEvmRefund(
      getHexBuffer(swap.preimageHash),
      isEtherSwap
        ? BigInt(onchainAmount!) * etherDecimals
        : (
            this.walletManager.wallets.get(chainSymbol)!
              .walletProvider as ERC20WalletProvider
          ).formatTokenAmount(onchainAmount!),
      isEtherSwap ? undefined : manager.tokenAddresses.get(chainSymbol),
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight,
    );

    return `0x${getHexString(sidecarRes)}`;
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
}

export default EipSigner;
