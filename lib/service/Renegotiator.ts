import { parseTransaction } from '../Core';
import Logger from '../Logger';
import { isTxConfirmed } from '../Utils';
import {
  CurrencyType,
  OrderSide,
  PercentageFeeType,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import Referral from '../db/models/Referral';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ReferralRepository from '../db/repositories/ReferralRepository';
import { ChainSwapMinerFees } from '../rates/FeeProvider';
import RateProvider from '../rates/RateProvider';
import ErrorsSwap from '../swap/Errors';
import SwapNursery from '../swap/SwapNursery';
import WalletManager, { Currency } from '../wallet/WalletManager';
import EthereumErrors from '../wallet/ethereum/Errors';
import {
  formatERC20SwapValues,
  formatEtherSwapValues,
} from '../wallet/ethereum/contracts/ContractUtils';
import BalanceCheck from './BalanceCheck';
import Errors from './Errors';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';
import ChainSwapSigner from './cooperative/ChainSwapSigner';
import EipSigner from './cooperative/EipSigner';

class Renegotiator {
  private static readonly minimumLeftUntilExpiryMinutes = 60;

  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    private readonly swapNursery: SwapNursery,
    private readonly chainSwapSigner: ChainSwapSigner,
    private readonly eipSigner: EipSigner,
    private readonly rateProvider: RateProvider,
    private readonly balanceCheck: BalanceCheck,
  ) {}

  public getQuote = async (swapId: string): Promise<number> => {
    const { swap, receivingCurrency } = await this.getSwap(swapId);
    await this.validateEligibility(swap, receivingCurrency);

    return (await this.calculateNewQuote(swap)).serverLockAmount;
  };

  // Do this in the refund signature lock to avoid creating refund signatures
  // while accepting new quotes and changing the status
  public acceptQuote = (swapId: string, newQuote: number) =>
    this.chainSwapSigner.refundSignatureLock(() =>
      this.eipSigner.refundSignatureLock(async () => {
        const { swap, receivingCurrency } = await this.getSwap(swapId);
        await this.validateEligibility(swap, receivingCurrency);

        const { serverLockAmount, percentageFee } =
          await this.calculateNewQuote(swap);
        if (newQuote !== serverLockAmount) {
          throw Errors.INVALID_QUOTE();
        }

        await this.balanceCheck.checkBalance(
          swap.sendingData.symbol,
          serverLockAmount,
        );

        this.logger.info(
          `Accepted new quote for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${newQuote}`,
        );

        if (receivingCurrency.chainClient !== undefined) {
          const txInfo =
            await receivingCurrency.chainClient.getRawTransactionVerbose(
              swap.receivingData.transactionId!,
            );

          await this.swapNursery.utxoNursery.checkChainSwapTransaction(
            await ChainSwapRepository.setExpectedAmounts(
              swap,
              percentageFee,
              swap.receivingData.amount!,
              serverLockAmount,
            ),
            receivingCurrency.chainClient,
            this.walletManager.wallets.get(receivingCurrency.symbol)!,
            parseTransaction(receivingCurrency.type, txInfo.hex),
            isTxConfirmed(txInfo),
          );
        } else if (receivingCurrency.provider !== undefined) {
          const nursery = this.swapNursery.ethereumNurseries.find((nursery) =>
            nursery.ethereumManager.hasSymbol(swap.receivingData.symbol),
          );
          if (nursery === undefined) {
            throw Errors.CURRENCY_NOT_FOUND(swap.receivingData.symbol);
          }

          const receipt =
            await nursery.ethereumManager.provider.getTransactionReceipt(
              swap.receivingData.transactionId!,
            );
          if (receipt === null) {
            throw Errors.LOCKUP_NOT_REJECTED();
          }

          const isEther = receivingCurrency.type === CurrencyType.Ether;
          const contracts = await nursery.ethereumManager.contractsForAddress(
            swap.receivingData.lockupAddress,
          );
          if (contracts === undefined) {
            throw EthereumErrors.UNSUPPORTED_CONTRACT();
          }

          const topicHash = (
            isEther ? contracts.etherSwap : contracts.erc20Swap
          ).interface.getEvent('Lockup').topicHash;
          const lockupEvent = receipt.logs.find(
            (log) => log.topics.length > 0 && log.topics[0] === topicHash,
          );
          if (lockupEvent === undefined) {
            throw Errors.LOCKUP_NOT_REJECTED();
          }

          if (isEther) {
            const values = contracts.etherSwap.interface.decodeEventLog(
              'Lockup',
              lockupEvent.data,
              lockupEvent.topics,
            );

            await nursery.checkEtherSwapLockup(
              await ChainSwapRepository.setExpectedAmounts(
                swap,
                percentageFee,
                swap.receivingData.amount!,
                serverLockAmount,
              ),
              receipt,
              formatEtherSwapValues(values),
            );
          } else {
            const values = contracts.erc20Swap.interface.decodeEventLog(
              'Lockup',
              lockupEvent.data,
              lockupEvent.topics,
            );

            await nursery.checkErc20SwapLockup(
              await ChainSwapRepository.setExpectedAmounts(
                swap,
                percentageFee,
                swap.receivingData.amount!,
                serverLockAmount,
              ),
              receipt,
              formatERC20SwapValues(values),
            );
          }
        } else {
          throw Errors.CURRENCY_NOT_FOUND(swap.pair);
        }
      }),
    );

  public calculateServerLockAmount = (
    rate: number,
    userLockAmount: number,
    feePercent: number,
    baseFee: number,
  ) => {
    const serverLockAmount = userLockAmount * rate;
    const percentageFee = Math.ceil(feePercent * serverLockAmount);

    return {
      percentageFee,
      serverLockAmount: Math.floor(
        serverLockAmount - (percentageFee + baseFee),
      ),
    };
  };

  public getFees = (
    pairId: string,
    side: OrderSide,
    referral: Referral | null,
  ) => ({
    baseFee: this.rateProvider.feeProvider.getSwapBaseFees<ChainSwapMinerFees>(
      pairId,
      side,
      SwapType.Chain,
      SwapVersion.Taproot,
    ).server,
    feePercent: this.rateProvider.feeProvider.getPercentageFee(
      pairId,
      side,
      SwapType.Chain,
      PercentageFeeType.Calculation,
      referral,
    ),
  });

  private calculateNewQuote = async (swap: ChainSwapInfo) => {
    const referral =
      swap.chainSwap.referral === null || swap.chainSwap.referral === undefined
        ? null
        : await ReferralRepository.getReferralById(swap.chainSwap.referral);

    const pair = this.rateProvider.providers[SwapVersion.Taproot]
      .getChainPairs(referral)
      .get(swap.receivingData.symbol)
      ?.get(swap.sendingData.symbol);
    if (pair === undefined) {
      throw Errors.PAIR_NOT_FOUND(swap.pair);
    }

    if (swap.receivingData.amount! > pair.limits.maximal) {
      throw Errors.EXCEED_MAXIMAL_AMOUNT(
        swap.receivingData.amount!,
        pair.limits.maximal,
      );
    } else if (swap.receivingData.amount! < pair.limits.minimal) {
      throw Errors.BENEATH_MINIMAL_AMOUNT(
        swap.receivingData.amount!,
        pair.limits.minimal,
      );
    }

    const { baseFee, feePercent } = this.getFees(
      swap.pair,
      swap.orderSide,
      referral,
    );

    return this.calculateServerLockAmount(
      pair.rate,
      swap.receivingData.amount!,
      feePercent,
      baseFee,
    );
  };

  private validateEligibility = async (
    swap: ChainSwapInfo,
    receivingCurrency: Currency,
  ) => {
    if (swap.createdRefundSignature) {
      throw Errors.REFUND_SIGNED_ALREADY();
    }

    if (swap.status !== SwapUpdateEvent.TransactionLockupFailed) {
      throw Errors.LOCKUP_NOT_REJECTED();
    }

    if (
      swap.chainSwap.failureReason !==
        ErrorsSwap.INSUFFICIENT_AMOUNT(
          swap.receivingData.amount!,
          swap.receivingData.expectedAmount,
        ).message &&
      swap.chainSwap.failureReason !==
        ErrorsSwap.OVERPAID_AMOUNT(
          swap.receivingData.amount!,
          swap.receivingData.expectedAmount,
        ).message
    ) {
      throw Errors.LOCKUP_NOT_REJECTED();
    }

    const blocksLeft =
      swap.receivingData.timeoutBlockHeight -
      (await this.getBlockHeight(receivingCurrency));

    const minutesLeft = Math.floor(
      blocksLeft *
        (TimeoutDeltaProvider.blockTimes.get(receivingCurrency.symbol) || 0),
    );
    if (minutesLeft <= Renegotiator.minimumLeftUntilExpiryMinutes) {
      throw Errors.TIME_UNTIL_EXPIRY_TOO_SHORT();
    }
  };

  private getSwap = async (swapId: string) => {
    const swap = await ChainSwapRepository.getChainSwap({ id: swapId });
    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(swapId);
    }

    const receivingCurrency = this.currencies.get(swap.receivingData.symbol);
    if (receivingCurrency === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(swap.receivingData.symbol);
    }

    return { swap, receivingCurrency };
  };

  private getBlockHeight = async (currency: Currency) => {
    if (currency.chainClient !== undefined) {
      return (await currency.chainClient.getBlockchainInfo()).blocks;
    } else if (currency.provider !== undefined) {
      return await currency.provider.getBlockNumber();
    }

    throw Errors.CURRENCY_NOT_FOUND(currency.symbol);
  };
}

export default Renegotiator;
