import type { Provider, TransactionReceipt } from 'ethers';
import { shutdownSignal } from '../ExitHandler';
import type Logger from '../Logger';
import { formatError } from '../Utils';
import { SwapType, SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import type { NetworkDetails } from '../wallet/ethereum/EvmNetworks';

type Events = {
  confirmed: {
    swap: ReverseSwap | ChainSwapInfo;
    transactionHash: string;
  };
  failedToSend: {
    swap: ReverseSwap | ChainSwapInfo;
    reason: string;
  };
};

class EthereumTransactionConfirmationTracker extends TypedEventEmitter<Events> {
  private pendingTransactions = new Map<string, ReverseSwap | ChainSwapInfo>();
  private scanning = false;

  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
    private readonly provider: Provider,
  ) {
    super();
  }

  public trackTransaction = (
    swap: ReverseSwap | ChainSwapInfo,
    transactionHash: string,
  ) => {
    this.pendingTransactions.set(transactionHash, swap);

    this.scanPendingTransactions().catch((error) => {
      this.logger.warn(
        `Could not scan pending ${this.networkDetails.name} transactions: ${formatError(error)}`,
      );
    });
  };

  public scanPendingTransactions = async () => {
    if (
      shutdownSignal.aborted ||
      this.scanning ||
      this.pendingTransactions.size === 0
    ) {
      return;
    }

    this.scanning = true;

    try {
      for (const [transactionHash, swap] of this.pendingTransactions) {
        const receipt = await this.getReceipt(transactionHash);
        if (receipt === null) {
          continue;
        }

        this.pendingTransactions.delete(transactionHash);

        if (receipt.status !== 1) {
          const reason = `${this.networkDetails.name} transaction ${transactionHash} failed: ${receipt.status}`;
          this.emit('failedToSend', {
            reason,
            swap: await WrappedSwapRepository.setStatus(
              swap,
              SwapUpdateEvent.TransactionFailed,
            ),
          });
          continue;
        }

        this.emit('confirmed', {
          transactionHash,
          swap: await WrappedSwapRepository.setStatus(
            swap,
            swap.type === SwapType.ReverseSubmarine
              ? SwapUpdateEvent.TransactionConfirmed
              : SwapUpdateEvent.TransactionServerConfirmed,
          ),
        });
      }
    } finally {
      this.scanning = false;
    }
  };

  private getReceipt = async (
    transactionHash: string,
  ): Promise<TransactionReceipt | null> => {
    try {
      return await this.provider.getTransactionReceipt(transactionHash);
    } catch (error) {
      this.logger.warn(
        `Could not fetch ${this.networkDetails.name} transaction receipt ${transactionHash}: ${formatError(error)}`,
      );
      return null;
    }
  };
}

export default EthereumTransactionConfirmationTracker;
