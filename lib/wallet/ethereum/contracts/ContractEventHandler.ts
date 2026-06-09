import type {
  ContractEventPayload,
  Provider,
  Transaction,
  TransactionResponse,
} from 'ethers';
import type Logger from '../../../Logger';
import { formatError } from '../../../Utils';
import TypedEventEmitter from '../../../consts/TypedEventEmitter';
import type { ERC20SwapValues, EtherSwapValues } from '../../../consts/Types';
import { parseBuffer } from '../EthereumUtils';
import type { NetworkDetails } from '../EvmNetworks';
import type { ERC20Swap } from '../typechain/ERC20Swap';
import type { EtherSwap } from '../typechain/EtherSwap';
import { formatERC20SwapValues, formatEtherSwapValues } from './ContractUtils';

type Events = {
  // EtherSwap contract events
  'eth.lockup': {
    source?: ContractEventSource;
    version: bigint;
    transaction: Transaction | TransactionResponse;
    etherSwapValues: EtherSwapValues;
  };
  'eth.claim': {
    source?: ContractEventSource;
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
    preimage: Buffer;
  };

  // ERC20Swap contract events
  'erc20.lockup': {
    source?: ContractEventSource;
    version: bigint;
    transaction: Transaction | TransactionResponse;
    erc20SwapValues: ERC20SwapValues;
  };
  'erc20.claim': {
    source?: ContractEventSource;
    version: bigint;
    transactionHash: string;
    preimageHash: Buffer;
    preimage: Buffer;
  };
};

type ContractEventSource = 'live' | 'manual' | 'rescan';
type ContractName = 'ERC20Swap' | 'EtherSwap';
type ContractEventName = 'Claim' | 'Lockup';

class ContractEventHandler extends TypedEventEmitter<Events> {
  private static readonly missedEventsCheckInterval = 1_000 * 60;

  private version!: bigint;

  private provider!: Provider;

  private etherSwap!: EtherSwap;
  private erc20Swap!: ERC20Swap;

  private networkDetails!: NetworkDetails;

  private rescanLastHeight = 0;
  private rescanInterval: NodeJS.Timeout | undefined;
  private missedEventsCheckPromise: Promise<void> | undefined;
  private missedEventsCheckPending = false;

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
    this.provider = provider;
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
        await this.checkMissedEvents();
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

    this.missedEventsCheckPending = false;
  };

  public rescan = async (
    startHeight: number,
    endHeight?: number,
    source: ContractEventSource = 'rescan',
  ): Promise<void> => {
    const [etherLockups, etherClaims, erc20Lockups, erc20Claims] =
      await Promise.all([
        this.etherSwap.queryFilter(
          this.etherSwap.filters.Lockup(),
          startHeight,
          endHeight,
        ),
        this.etherSwap.queryFilter(
          this.etherSwap.filters.Claim(),
          startHeight,
          endHeight,
        ),
        this.erc20Swap.queryFilter(
          this.erc20Swap.filters.Lockup(),
          startHeight,
          endHeight,
        ),
        this.erc20Swap.queryFilter(
          this.erc20Swap.filters.Claim(),
          startHeight,
          endHeight,
        ),
      ]);

    const totalEvents =
      etherLockups.length +
      etherClaims.length +
      erc20Lockups.length +
      erc20Claims.length;

    if (totalEvents > 0) {
      this.logger.debug(
        `${this.networkDetails.name} contracts v${this.version} found ${totalEvents} event(s) via ${source} from block ${startHeight} to ${endHeight ?? 'latest'}: eth.lockup=${etherLockups.length}, eth.claim=${etherClaims.length}, erc20.lockup=${erc20Lockups.length}, erc20.claim=${erc20Claims.length}`,
      );
    }

    for (const event of etherLockups) {
      this.logContractEvent(
        source,
        'EtherSwap',
        'Lockup',
        event.transactionHash,
        event.blockNumber,
        event.index,
        parseBuffer(event.topics[1]),
      );
      this.emit('eth.lockup', {
        source,
        version: this.version,
        transaction: await event.getTransaction(),
        etherSwapValues: formatEtherSwapValues(event.args!),
      });
    }

    for (const event of etherClaims) {
      const preimageHash = parseBuffer(event.topics[1]);
      this.logContractEvent(
        source,
        'EtherSwap',
        'Claim',
        event.transactionHash,
        event.blockNumber,
        event.index,
        preimageHash,
      );
      this.emit('eth.claim', {
        source,
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash,
        preimage: parseBuffer(event.args!.preimage),
      });
    }

    for (const event of erc20Lockups) {
      this.logContractEvent(
        source,
        'ERC20Swap',
        'Lockup',
        event.transactionHash,
        event.blockNumber,
        event.index,
        parseBuffer(event.topics[1]),
      );
      this.emit('erc20.lockup', {
        source,
        version: this.version,
        transaction: await event.getTransaction(),
        erc20SwapValues: formatERC20SwapValues(event.args!),
      });
    }

    for (const event of erc20Claims) {
      const preimageHash = parseBuffer(event.topics[1]);
      this.logContractEvent(
        source,
        'ERC20Swap',
        'Claim',
        event.transactionHash,
        event.blockNumber,
        event.index,
        preimageHash,
      );
      this.emit('erc20.claim', {
        source,
        version: this.version,
        transactionHash: event.transactionHash,
        preimageHash,
        preimage: parseBuffer(event.args!.preimage),
      });
    }
  };

  public checkTransaction = async (id: string): Promise<void> => {
    const tx = await this.provider.getTransaction(id);
    if (tx === null || tx.blockNumber === null) {
      throw new Error('transaction not found');
    }

    // Rescan from the block before to the one after the transaction
    // Just easier than trying to filter events from the tx itself
    await this.rescan(tx.blockNumber - 1, tx.blockNumber + 1, 'manual');
  };

  public checkMissedEvents = async () => {
    this.missedEventsCheckPending = true;

    if (this.missedEventsCheckPromise) {
      return this.missedEventsCheckPromise;
    }

    this.missedEventsCheckPromise = (async () => {
      while (this.missedEventsCheckPending) {
        this.missedEventsCheckPending = false;

        const startHeight = this.rescanLastHeight;
        const currentHeight = Math.max(
          await this.provider.getBlockNumber(),
          startHeight,
        );

        this.logger.debug(
          `Checking for missed events of ${this.networkDetails.name} contracts v${this.version} from block ${startHeight} to ${currentHeight}`,
        );

        await this.rescan(startHeight, currentHeight, 'rescan');
        this.rescanLastHeight = currentHeight;
      }
    })().finally(() => {
      this.missedEventsCheckPromise = undefined;
    });

    return this.missedEventsCheckPromise;
  };

  private logContractEvent = (
    source: ContractEventSource,
    contract: ContractName,
    eventName: ContractEventName,
    transactionHash: string,
    blockNumber: number,
    logIndex: number,
    preimageHash: Buffer,
  ) => {
    this.logger.debug(
      `${this.networkDetails.name} contracts v${this.version} ${contract} ${eventName} event via ${source}: tx=${transactionHash}, block=${blockNumber}, logIndex=${logIndex}, preimageHash=${ContractEventHandler.formatHex(preimageHash)}`,
    );
  };

  private static formatHex = (value: Buffer) => `0x${value.toString('hex')}`;

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
        this.logContractEvent(
          'live',
          'EtherSwap',
          'Lockup',
          event.log.transactionHash,
          event.log.blockNumber,
          event.log.index,
          parseBuffer(preimageHash),
        );
        this.emit('eth.lockup', {
          source: 'live',
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
        this.logContractEvent(
          'live',
          'EtherSwap',
          'Claim',
          event.log.transactionHash,
          event.log.blockNumber,
          event.log.index,
          parseBuffer(preimageHash),
        );
        this.emit('eth.claim', {
          source: 'live',
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
          preimage: parseBuffer(preimage),
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
        this.logContractEvent(
          'live',
          'ERC20Swap',
          'Lockup',
          event.log.transactionHash,
          event.log.blockNumber,
          event.log.index,
          parseBuffer(preimageHash),
        );
        this.emit('erc20.lockup', {
          source: 'live',
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
        this.logContractEvent(
          'live',
          'ERC20Swap',
          'Claim',
          event.log.transactionHash,
          event.log.blockNumber,
          event.log.index,
          parseBuffer(preimageHash),
        );
        this.emit('erc20.claim', {
          source: 'live',
          version: this.version,
          transactionHash: event.log.transactionHash,
          preimageHash: parseBuffer(preimageHash),
          preimage: parseBuffer(preimage),
        });
      },
    );
  };
}

export default ContractEventHandler;
export { type ContractEventSource, Events };
