import { Transaction } from 'liquidjs-lib';
import BaseClient from '../BaseClient';
import { LiquidChainConfig } from '../Config';
import Logger from '../Logger';
import { allSettledFirst } from '../PromiseUtils';
import { formatError } from '../Utils';
import { CurrencyType } from '../consts/Enums';
import { MempoolAcceptResult, UnspentUtxo } from '../consts/Types';
import { AddressType, ChainClientEvents } from './ChainClient';
import ElementsClient, {
  IElementsClient,
  LiquidAddressType,
} from './ElementsClient';
import TestMempoolAccept from './elements/TestMempoolAccept';
import { ZeroConfCheck } from './elements/ZeroConfCheck';
import ZeroConfTool from './elements/ZeroConfTool';

class ElementsWrapper
  extends BaseClient<ChainClientEvents<Transaction>>
  implements IElementsClient
{
  public readonly currencyType = CurrencyType.Liquid;
  public readonly zeroConfCheck: ZeroConfCheck;

  private readonly clients: ElementsClient[] = [];

  constructor(logger: Logger, config: LiquidChainConfig) {
    super(logger, ElementsClient.symbol);

    this.clients.push(new ElementsClient(this.logger, config, false));

    if (config.lowball !== undefined) {
      this.logger.info(`Using lowball for ${this.clients[0].serviceName()}`);
      this.clients.push(new ElementsClient(this.logger, config.lowball, true));
    }

    if (
      config.zeroConfTool !== undefined &&
      config.zeroConfTool.endpoint !== undefined
    ) {
      this.zeroConfCheck = new ZeroConfTool(this.logger, config.zeroConfTool);
    } else {
      this.zeroConfCheck = new TestMempoolAccept(
        this.logger,
        this.publicClient(),
        config.zeroConfWaitTime,
      );
    }

    this.logger.info(`Using 0-conf check: ${this.zeroConfCheck.name}`);
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

    this.publicClient().on(
      'transaction',
      async ({ transaction, confirmed }) => {
        if (hasLowball && !confirmed) {
          return;
        }

        if (confirmed) {
          this.emit('transaction', { transaction, confirmed });
          return;
        }

        try {
          if (await this.zeroConfCheck.checkTransaction(transaction)) {
            this.emit('transaction', { transaction, confirmed });
          }
        } catch (e) {
          this.logger.error(
            `${this.symbol} 0-conf transaction check failed: ${formatError(e)}`,
          );
        }
      },
    );

    this.lowballClient()?.on(
      'transaction',
      async ({ transaction, confirmed }) => {
        if (confirmed) {
          return;
        }

        try {
          if (await this.zeroConfCheck.checkTransaction(transaction)) {
            this.emit('transaction', { transaction, confirmed });
          }
        } catch (e) {
          this.logger.error(
            `${this.symbol} 0-conf transaction check failed: ${formatError(e)}`,
          );
        }
      },
    );
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

  public sendRawTransaction = (
    transactionHex: string,
    isSwapRelated: boolean = true,
  ) => {
    if (isSwapRelated) {
      return allSettledFirst(
        this.clients.map((c) => c.sendRawTransaction(transactionHex)),
      );
    }

    return this.publicClient().sendRawTransaction(transactionHex);
  };

  public sendRawTransactionAll = async (transactionHex: string) => {
    return (
      await Promise.all(
        this.clients.map((c) => c.sendRawTransaction(transactionHex)),
      )
    )[0];
  };

  public getRawTransaction = (transactionId: string) =>
    allSettledFirst(
      this.clients.map((c) => c.getRawTransaction(transactionId)),
    );

  public getRawTransactionVerbose = (transactionId: string) =>
    allSettledFirst(
      this.clients.map((c) => c.getRawTransactionVerbose(transactionId)),
    );

  public testMempoolAccept = (
    transactionsHex: string[],
  ): Promise<MempoolAcceptResult[]> =>
    allSettledFirst(
      this.clients.map((c) => c.testMempoolAccept(transactionsHex)),
    );

  public estimateFee = () => this.walletClient().estimateFee();

  public listUnspent = (
    minimalConfirmations?: number,
  ): Promise<UnspentUtxo[]> =>
    this.walletClient().listUnspent(minimalConfirmations);

  public getAddressInfo = (address: string) =>
    this.walletClient().getAddressInfo(address);

  public getBalances = () => this.walletClient().getBalances();

  public getNewAddress = (
    label: string,
    type?: AddressType | LiquidAddressType,
  ) => this.walletClient().getNewAddress(label, type);

  public dumpBlindingKey = (address: string) =>
    this.walletClient().dumpBlindingKey(address);

  public sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    subtractFeeFromAmount: boolean | undefined,
    label: string,
  ) =>
    this.walletClient().sendToAddress(
      address,
      amount,
      satPerVbyte,
      subtractFeeFromAmount,
      label,
    );

  private walletClient = () => this.lowballClient() || this.publicClient();

  private publicClient = () => this.clients.find((c) => !c.isLowball)!;

  // TODO: detect when lowball falls out of sync
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
