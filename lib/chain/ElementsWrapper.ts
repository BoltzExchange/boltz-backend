import { Transaction } from 'liquidjs-lib';
import BaseClient from '../BaseClient';
import { LiquidChainConfig } from '../Config';
import Logger from '../Logger';
import { allSettledFirst } from '../PromiseUtils';
import { CurrencyType } from '../consts/Enums';
import { UnspentUtxo } from '../consts/Types';
import { AddressType, ChainClientEvents } from './ChainClient';
import ElementsClient, {
  IElementsClient,
  LiquidAddressType,
} from './ElementsClient';

class ElementsWrapper
  extends BaseClient<ChainClientEvents<Transaction>>
  implements IElementsClient
{
  public readonly currencyType = CurrencyType.Liquid;

  private readonly clients: ElementsClient[] = [];

  constructor(logger: Logger, config: LiquidChainConfig) {
    super(logger, ElementsClient.symbol);

    this.clients.push(new ElementsClient(this.logger, config, false));

    if (config.lowball !== undefined) {
      this.logger.info(`Using lowball for ${this.clients[0].serviceName()}`);
      this.clients.push(new ElementsClient(this.logger, config.lowball, true));
    }
  }

  public serviceName = () => 'ElementsWrapper';

  public connect = async () => {
    await Promise.all(this.clients.map((c) => c.connect()));

    this.publicClient().on('status.changed', this.setClientStatus);

    this.publicClient().on('block', (blockHeight) =>
      this.emit('block', blockHeight),
    );

    // If we have a lowball client, bubble up only confirmed transactions
    // of the public client
    const hasLowball = this.lowballClient() !== undefined;

    this.publicClient().on('transaction', ({ transaction, confirmed }) => {
      if (hasLowball && !confirmed) {
        return;
      }

      this.emit('transaction', { transaction, confirmed });
    });

    this.lowballClient()?.on('transaction', ({ transaction, confirmed }) => {
      if (confirmed) {
        return;
      }

      this.emit('transaction', { transaction, confirmed });
    });
  };

  public disconnect = () => this.clients.forEach((c) => c.disconnect());

  public rescanChain = (startHeight: number) =>
    // Only rescan with the public client to avoid duplicate events
    this.publicClient().rescanChain(startHeight);

  public addInputFilter = (inputHash: Buffer) =>
    this.clients.forEach((c) => c.addInputFilter(inputHash));

  public addOutputFilter = (outputScript: Buffer) =>
    this.clients.forEach((c) => c.addOutputFilter(outputScript));

  public removeOutputFilter = (outputScript: Buffer) =>
    this.clients.forEach((c) => c.removeOutputFilter(outputScript));

  public removeInputFilter = (inputHash: Buffer) =>
    this.clients.forEach((c) => c.removeInputFilter(inputHash));

  public getBlockchainInfo = () =>
    this.annotateLowballInfo((c) => c.getBlockchainInfo());

  public getNetworkInfo = () =>
    this.annotateLowballInfo((c) => c.getNetworkInfo());

  public sendRawTransaction = (transactionHex: string) =>
    this.publicClient().sendRawTransaction(transactionHex);

  public getRawTransaction = (transactionId: string) =>
    allSettledFirst(
      this.clients.map((c) => c.getRawTransaction(transactionId)),
    );

  public getRawTransactionVerbose = (transactionId: string) =>
    allSettledFirst(
      this.clients.map((c) => c.getRawTransactionVerbose(transactionId)),
    );

  public estimateFee = () => this.publicClient().estimateFee();

  public listUnspent = (
    minimalConfirmations?: number,
  ): Promise<UnspentUtxo[]> =>
    this.walletClient().listUnspent(minimalConfirmations);

  public getAddressInfo = (address: string) =>
    this.walletClient().getAddressInfo(address);

  public getBalances = () => this.walletClient().getBalances();

  public getNewAddress = (type?: AddressType | LiquidAddressType) =>
    this.walletClient().getNewAddress(type);

  public dumpBlindingKey = (address: string) =>
    this.walletClient().dumpBlindingKey(address);

  public sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte?: number,
    subtractFeeFromAmount?: boolean,
  ) =>
    this.walletClient().sendToAddress(
      address,
      amount,
      satPerVbyte,
      subtractFeeFromAmount,
    );

  private walletClient = () => this.publicClient();

  private publicClient = () => this.clients.find((c) => !c.isLowball)!;

  private lowballClient = () => this.clients.find((c) => c.isLowball);

  private annotateLowballInfo = async <T>(
    fn: (c: ElementsClient) => Promise<T>,
  ): Promise<T & { lowball?: T }> => {
    const infos: [boolean, T][] = await Promise.all(
      this.clients.map(async (c) => [c.isLowball, await fn(c)]),
    );

    return {
      ...infos.find(([isLowball]) => !isLowball)![1],
      lowball: infos.find(([isLowball]) => isLowball)?.[1],
    };
  };
}

export default ElementsWrapper;
