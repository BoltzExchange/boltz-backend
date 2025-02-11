import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import {
  ContractEventPayload,
  Provider,
  Transaction,
  TransactionResponse,
} from 'ethers';
import Logger from '../../../Logger';
import { formatError } from '../../../Utils';
import TypedEventEmitter from '../../../consts/TypedEventEmitter';
import { ERC20SwapValues, EtherSwapValues } from '../../../consts/Types';
import { parseBuffer } from '../EthereumUtils';
import { NetworkDetails } from '../EvmNetworks';
import { formatERC20SwapValues, formatEtherSwapValues } from './ContractUtils';

type Events = {
  // EtherSwap contract events
  'eth.lockup': {
    version: bigint;
    transaction: Transaction | TransactionResponse;
    etherSwapValues: EtherSwapValues;
  };
  'eth.claim': {
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
    preimage: Buffer;
  };
  'eth.refund': {
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
  };

  // ERC20Swap contract events
  'erc20.lockup': {
    version: bigint;
    transaction: Transaction | TransactionResponse;
    erc20SwapValues: ERC20SwapValues;
  };
  'erc20.claim': {
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
    preimage: Buffer;
  };
  'erc20.refund': {
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
  };
};

class ContractEventHandler extends TypedEventEmitter<Events> {
  // Check for missed events every 5 minutes
  private static readonly missedEventsCheckInterval = 1_000 * 60 * 5;

  private version!: bigint;

  private etherSwap!: EtherSwap;
  private erc20Swap!: ERC20Swap;

  private networkDetails!: NetworkDetails;

  private rescanLastHeight = 0;
  private rescanInterval: NodeJS.Timeout | undefined;

  constructor(private readonly logger: Logger) {
    super();
  }

  public init = async (
    version: bigint,
    networkDetails: NetworkDetails,
    provider: Provider,
    etherSwap: EtherSwap,
    erc20Swap: ERC20Swap,
  ): Promise<void> => {
    this.version = version;
    this.etherSwap = etherSwap;
    this.erc20Swap = erc20Swap;
    this.networkDetails = networkDetails;

    this.logger.verbose(
      `Starting ${this.networkDetails.name} contracts v${version} event subscriptions`,
    );

    await this.subscribeContractEvents();

    this.rescanLastHeight = await provider.getBlockNumber();
    this.rescanInterval = setInterval(async () => {
      try {
        await this.checkMissedEvents(provider);
      } catch (error) {
        this.logger.error(
          `Error checking for missed events of ${this.networkDetails.name} contracts v${version}: ${formatError(error)}`,
        );
      }
    }, ContractEventHandler.missedEventsCheckInterval);
  };

  public destroy = () => {
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
      this.rescanInterval = undefined;
    }
  };

  public rescan = async (startHeight: number): Promise<void> => {
    const [etherLockups, etherClaims, etherRefunds] = await Promise.all([
      this.etherSwap.queryFilter(this.etherSwap.filters.Lockup(), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Claim(), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Refund(), startHeight),
    ]);

    for (const event of etherLockups) {
      this.emit('eth.lockup', {
        version: this.version,
        transaction: await event.getTransaction(),
        etherSwapValues: formatEtherSwapValues(event.args!),
      });
    }

    for (const event of etherClaims) {
      this.emit('eth.claim', {
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash: parseBuffer(event.topics[1]),
        preimage: parseBuffer(event.args!.preimage),
      });
    }

    for (const event of etherRefunds) {
      this.emit('eth.refund', {
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash: parseBuffer(event.topics[1]),
      });
    }

    const [erc20Lockups, erc20Claims, erc20Refunds] = await Promise.all([
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Lockup(), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Claim(), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Refund(), startHeight),
    ]);

    for (const event of erc20Lockups) {
      this.emit('erc20.lockup', {
        version: this.version,
        transaction: await event.getTransaction(),
        erc20SwapValues: formatERC20SwapValues(event.args!),
      });
    }

    for (const event of erc20Claims) {
      this.emit('erc20.claim', {
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash: parseBuffer(event.topics[1]),
        preimage: parseBuffer(event.args!.preimage),
      });
    }

    for (const event of erc20Refunds) {
      this.emit('erc20.refund', {
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash: parseBuffer(event.topics[1]),
      });
    }
  };

  private subscribeContractEvents = async () => {
    await this.etherSwap.on(
      'Lockup' as any,
      async (
        preimageHash: string,
        amount: bigint,
        claimAddress: string,
        refundAddress: string,
        timelock: bigint,
        event: ContractEventPayload,
      ) => {
        this.emit('eth.lockup', {
          version: this.version,
          transaction: await event.log.getTransaction(),
          etherSwapValues: {
            amount,
            claimAddress,
            refundAddress,
            timelock: Number(timelock),
            preimageHash: parseBuffer(preimageHash),
          },
        });
      },
    );

    await this.etherSwap.on(
      'Claim' as any,
      (preimageHash: string, preimage: string, event: ContractEventPayload) => {
        this.emit('eth.claim', {
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
          preimage: parseBuffer(preimage),
        });
      },
    );

    await this.etherSwap.on(
      'Refund' as any,
      (preimageHash: string, event: ContractEventPayload) => {
        this.emit('eth.refund', {
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
        });
      },
    );

    await this.erc20Swap.on(
      'Lockup' as any,
      async (
        preimageHash: string,
        amount: bigint,
        tokenAddress: string,
        claimAddress: string,
        refundAddress: string,
        timelock: bigint,
        event: ContractEventPayload,
      ) => {
        this.emit('erc20.lockup', {
          version: this.version,
          transaction: await event.log.getTransaction(),
          erc20SwapValues: {
            amount,
            tokenAddress,
            claimAddress,
            refundAddress,
            timelock: Number(timelock),
            preimageHash: parseBuffer(preimageHash),
          },
        });
      },
    );

    await this.erc20Swap.on(
      'Claim' as any,
      (preimageHash: string, preimage: string, event: ContractEventPayload) => {
        this.emit('erc20.claim', {
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
          preimage: parseBuffer(preimage),
        });
      },
    );

    await this.erc20Swap.on(
      'Refund' as any,
      (preimageHash: string, event: ContractEventPayload) => {
        this.emit('erc20.refund', {
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
        });
      },
    );
  };

  private checkMissedEvents = async (provider: Provider) => {
    this.logger.debug(
      `Checking for missed events of ${this.networkDetails.name} contracts v${this.version} from block ${this.rescanLastHeight}`,
    );
    const currentHeight = await provider.getBlockNumber();
    await this.rescan(this.rescanLastHeight);
    this.rescanLastHeight = currentHeight;
  };
}

export default ContractEventHandler;
export { Events };
