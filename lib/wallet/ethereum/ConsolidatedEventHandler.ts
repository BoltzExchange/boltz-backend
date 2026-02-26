import AsyncLock from 'async-lock';
import { createHash } from 'crypto';
import type Logger from '../../Logger';
import { mapConcurrent, stringify } from '../../Utils';
import TypedEventEmitter from '../../consts/TypedEventEmitter';
import type { ERC20SwapValues, EtherSwapValues } from '../../consts/Types';
import type { NetworkDetails } from './EvmNetworks';
import type InjectedProvider from './InjectedProvider';
import type { Events } from './contracts/ContractEventHandler';
import type ContractEventHandler from './contracts/ContractEventHandler';

type LockupEventEntry =
  | { name: 'eth.lockup'; payload: Events['eth.lockup'] }
  | { name: 'erc20.lockup'; payload: Events['erc20.lockup'] };

type PendingEvent = {
  txHash: string;
  firstSeenTimestamp: number;
  event: LockupEventEntry;
};

const hashSwapValues = (values: EtherSwapValues | ERC20SwapValues): string => {
  const h = createHash('sha256');
  h.update(values.preimageHash);
  h.update(values.amount.toString());
  h.update(values.claimAddress);
  h.update(values.refundAddress);
  h.update(values.timelock.toString());

  if ('tokenAddress' in values) {
    h.update(values.tokenAddress);
  }

  return h.digest('hex');
};

const pendingEventKey = (pending: PendingEvent): string => {
  const values =
    pending.event.name === 'eth.lockup'
      ? pending.event.payload.etherSwapValues
      : pending.event.payload.erc20SwapValues;
  return `${pending.event.name}:${pending.txHash}:${hashSwapValues(values)}`;
};

const enum QueueAction {
  Queue = 0,
  Forward = 1,
  Drop = 2,
}

type QueueResult =
  | { action: QueueAction.Queue; pending: PendingEvent }
  | { action: QueueAction.Forward }
  | { action: QueueAction.Drop };

class ConsolidatedEventHandler extends TypedEventEmitter<Events> {
  private static readonly defaultConfirmations = 1;
  private static readonly flushLock = 'flushLock';
  private static readonly flushConcurrency = 16;
  private static readonly pendingTimeoutMs = 60 * 60 * 1_000;

  private readonly lock = new AsyncLock();
  private readonly requiredConfirmations: number;
  private readonly handlers: ContractEventHandler[] = [];

  private pendingEvents = new Map<string, PendingEvent>();
  private destroyed = false;

  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
    private readonly provider: InjectedProvider,
    requiredConfirmations: number = ConsolidatedEventHandler.defaultConfirmations,
  ) {
    super();

    this.requiredConfirmations =
      requiredConfirmations > 0
        ? Math.ceil(requiredConfirmations)
        : ConsolidatedEventHandler.defaultConfirmations;

    this.logger.info(
      `Starting ${this.networkDetails.name} consolidated event handler with ${this.requiredConfirmations} confirmations`,
    );

    void this.subscribeBlocks();
  }

  public register = (handler: ContractEventHandler) => {
    this.handlers.push(handler);

    this.registerForwarding(handler, 'eth.lockup');
    this.registerForwarding(handler, 'eth.claim');

    this.registerForwarding(handler, 'erc20.lockup');
    this.registerForwarding(handler, 'erc20.claim');
  };

  public rescan = async (startHeight: number): Promise<void> => {
    await Promise.all(
      this.handlers.map((handler) =>
        handler.rescan(
          Math.max(Math.floor(startHeight - this.requiredConfirmations - 1), 0),
        ),
      ),
    );

    await this.flushPendingEvents(await this.provider.getBlockNumber());
  };

  public checkTransaction = async (id: string): Promise<void> => {
    await Promise.all(
      this.handlers.map((handler) => handler.checkTransaction(id)),
    );

    await this.flushPendingEvents(await this.provider.getBlockNumber());
  };

  public destroy = () => {
    this.destroyed = true;
    this.pendingEvents.clear();
    this.handlers.forEach((handler) => handler.destroy());
  };

  private subscribeBlocks = async () => {
    await this.provider.onBlock(({ number }) => {
      this.flushPendingEvents(number).catch((err) => {
        this.logger.error(
          `${this.networkDetails.name} error flushing pending events: ${err}`,
        );
      });
    });
  };

  private registerForwarding = <T extends keyof Events>(
    handler: ContractEventHandler,
    eventName: T,
  ) => {
    handler.on(eventName, (payload: Events[T]) => {
      this.handleEvent(eventName, payload).catch((err) => {
        this.logger.error(
          `${this.networkDetails.name} error handling event ${eventName}: ${err}`,
        );
      });
    });
  };

  public handleEvent = async <T extends keyof Events>(
    eventName: T,
    payload: Events[T],
  ) => {
    if (this.destroyed) {
      return;
    }

    if (this.requiredConfirmations <= 1) {
      this.emit(eventName, payload);
      return;
    }

    const result = this.classifyEvent(eventName, payload);
    switch (result.action) {
      case QueueAction.Forward:
        this.emit(eventName, payload);
        return;

      case QueueAction.Drop:
        this.logger.warn(
          `${this.networkDetails.name} dropping ${eventName} event: ${stringify(payload)}`,
        );
        return;

      case QueueAction.Queue:
        await this.lock.acquire(
          ConsolidatedEventHandler.flushLock,
          async () => {
            const key = pendingEventKey(result.pending);
            if (!this.pendingEvents.has(key)) {
              this.pendingEvents.set(key, result.pending);
            }
          },
        );
        return;
    }
  };

  private classifyEvent = <T extends keyof Events>(
    eventName: T,
    payload: Events[T],
  ): QueueResult => {
    switch (eventName) {
      case 'eth.lockup':
      case 'erc20.lockup': {
        const lockupPayload = payload as
          | Events['eth.lockup']
          | Events['erc20.lockup'];

        const txHash = lockupPayload.transaction.hash;
        if (txHash === null) {
          return { action: QueueAction.Drop };
        }

        return {
          action: QueueAction.Queue,
          pending: {
            txHash,
            firstSeenTimestamp: Date.now(),
            event: { name: eventName, payload } as LockupEventEntry,
          },
        };
      }

      case 'eth.claim':
      case 'erc20.claim':
        return { action: QueueAction.Forward };
    }
  };

  private flushPendingEvents = async (latestBlockHeight: number) => {
    if (this.destroyed) {
      return;
    }

    await this.lock.acquire(ConsolidatedEventHandler.flushLock, async () => {
      if (this.destroyed) {
        return;
      }

      if (this.pendingEvents.size === 0) {
        return;
      }

      const processed = await mapConcurrent(
        Array.from(this.pendingEvents.values()),
        (queued) => this.processPendingEvent(queued, latestBlockHeight),
        ConsolidatedEventHandler.flushConcurrency,
      );
      this.pendingEvents = new Map(
        processed
          .filter((p): p is PendingEvent => p !== undefined)
          .map((p) => [pendingEventKey(p), p]),
      );
    });
  };

  private processPendingEvent = async (
    queued: PendingEvent,
    latestBlockHeight: number,
  ): Promise<PendingEvent | undefined> => {
    let blockHeight: number | undefined;

    try {
      const receipt = await this.provider.getTransactionReceipt(queued.txHash);

      if (receipt?.blockNumber !== undefined && receipt.blockNumber !== null) {
        blockHeight = receipt.blockNumber;
      }
    } catch {
      this.logger.warn(
        `${this.networkDetails.name} failed to get transaction receipt for ${queued.txHash}`,
      );
      return queued;
    }

    if (blockHeight === undefined) {
      if (
        Date.now() - queued.firstSeenTimestamp >
        ConsolidatedEventHandler.pendingTimeoutMs
      ) {
        this.logger.warn(
          `${this.networkDetails.name} dropping pending event for ${queued.txHash} after 1 hour without receipt`,
        );
        return undefined;
      }

      return queued;
    }

    const targetHeight = blockHeight + this.requiredConfirmations - 1;
    if (latestBlockHeight >= targetHeight) {
      this.emit(queued.event.name, queued.event.payload);
      return undefined;
    }

    return queued;
  };
}

export default ConsolidatedEventHandler;
