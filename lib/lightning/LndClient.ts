import { EventEmitter } from 'events';
import Logger from '../Logger';
import RouterClient from './RouterClient';
import InvoiceClient from './InvoiceClient';
import PaymentClient from './PaymentClient';
import * as lndrpc from '../proto/lnd/rpc_pb';
import LndBaseClient, { LndBaseConfig } from './LndBaseClient';

type LndConfig = LndBaseConfig & {
  payment?: LndBaseConfig;
  invoice?: LndBaseConfig;
}

interface ILndClient {
  on(event: 'htlc.accepted', listener: (invoice: string) => void): this;
  emit(event: 'htlc.accepted', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string) => void): this;
  emit(event: 'invoice.settled', string: string): boolean;

  on(event: 'peer.online', listener: (publicKey: string) => void): this;
  emit(event: 'peer.online', publicKey: string): boolean;

  on(even: 'channel.active', listener: (channel: lndrpc.ChannelPoint.AsObject) => void): this;
  emit(even: 'channel.active', channel: lndrpc.ChannelPoint.AsObject): boolean;

  on(event: 'channel.backup', listener: (channelBackup: string) => void): this;
  emit(event: 'channel.backup', channelBackup: string): boolean;

  on(event: 'subscription.error', listener: (subscription?: string) => void): this;
  emit(event: 'subscription.error', subscription?: string): boolean;

  on(event: 'subscription.reconnected', listener: () => void): this;
  emit(event: 'subscription.reconnected'): boolean;
}

/**
 * A class representing a client to interact with LND
 */
class LndClient extends EventEmitter implements ILndClient {
  public static readonly serviceName = 'LND';

  public readonly routerClient: RouterClient;
  public readonly invoiceClient: InvoiceClient;
  public readonly paymentClient: PaymentClient;

  public readonly clients: LndBaseClient[];

  /**
   * Create an LND client
   */
  constructor(
    logger: Logger,
    public readonly symbol: string,
    config: LndConfig,
  ) {
    super();

    this.routerClient = new RouterClient(logger, symbol, config);
    this.invoiceClient = new InvoiceClient(logger, symbol, config.invoice !== undefined, config.invoice || config);
    this.paymentClient = new PaymentClient(logger, symbol, config.payment || config);

    this.clients = [this.routerClient, this.invoiceClient, this.paymentClient];
    this.forwardEvents();
  }

  public connect = async (startSubscriptions = true) => {
    for (const client of this.clients) {
      await client.connect(startSubscriptions);
    }
  };

  public isConnected = (): boolean => {
    return this.clients.every((client) => {
      return client.isConnected();
    });
  };

  private forwardEvents = () => {
    const events: { client: EventEmitter, name: string }[] = [
      {
        client: this.invoiceClient,
        name: 'htlc.accepted',
      },
      {
        client: this.invoiceClient,
        name: 'invoice.settled',
      },
      {
        client: this.routerClient,
        name: 'peer.online',
      },
      {
        client: this.routerClient,
        name: 'channel.active',
      },
      {
        client: this.routerClient,
        name: 'channel.backup',
      },
    ];

    for (const client of this.clients) {
      events.push({
        client,
        name: 'subscription.error'
      });
      events.push({
        client,
        name: 'subscription.reconnected'
      });
    }

    for (const event of events) {
      event.client.on(event.name, (...args: any[]) => {
        this.emit(event.name, ...args);
      });
    }
  };
}

export default LndClient;
export { LndConfig };
