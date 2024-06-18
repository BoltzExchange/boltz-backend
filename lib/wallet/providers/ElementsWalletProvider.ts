import { parseTransaction } from '../../Core';
import Logger from '../../Logger';
import { getHexBuffer } from '../../Utils';
import ChainClient from '../../chain/ChainClient';
import { IElementsClient } from '../../chain/ElementsClient';
import { CurrencyType } from '../../consts/Enums';
import WalletProviderInterface, {
  SentTransaction,
  WalletBalance,
} from './WalletProviderInterface';

class ElementsWalletProvider implements WalletProviderInterface {
  public static readonly assetLabel = 'bitcoin';
  public static readonly feeOutputType = 'fee';

  public readonly symbol: string;

  constructor(
    public logger: Logger,
    public chainClient: IElementsClient,
  ) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Elements wallet`);
  }

  public serviceName = (): string => {
    return 'Elements';
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balances = await this.chainClient.getBalances();

    const confirmedBalance =
      balances.mine.trusted[ElementsWalletProvider.assetLabel];
    const unconfirmedBalance =
      balances.mine.untrusted_pending[ElementsWalletProvider.assetLabel];

    return {
      confirmedBalance,
      unconfirmedBalance,
    };
  };

  public getAddress = (label: string): Promise<string> =>
    this.chainClient.getNewAddress(label);

  public dumpBlindingKey = async (address: string): Promise<Buffer> => {
    return getHexBuffer(await this.chainClient.dumpBlindingKey(address));
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const transactionId = await this.chainClient.sendToAddress(
      address,
      amount,
      await this.getFeePerVbyte(satPerVbyte),
      false,
      label,
    );
    return this.handleLiquidTransaction(transactionId, address);
  };

  public sweepWallet = async (
    address: string,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const balance = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(
      address,
      balance.confirmedBalance + balance.unconfirmedBalance,
      await this.getFeePerVbyte(satPerVbyte),
      true,
      label,
    );

    return this.handleLiquidTransaction(transactionId, address);
  };

  private handleLiquidTransaction = async (
    transactionId: string,
    address: string,
  ): Promise<SentTransaction> => {
    const [addressInfo, transactionVerbose] = await Promise.all([
      this.chainClient.getAddressInfo(address),
      this.chainClient.getRawTransactionVerbose(transactionId),
    ]);

    const decodedAddress = addressInfo.unconfidential;
    return {
      transactionId,
      transaction: parseTransaction(
        CurrencyType.Liquid,
        transactionVerbose.hex,
      ),
      vout: transactionVerbose.vout.find(
        (output) =>
          output.scriptPubKey.address === decodedAddress ||
          output.scriptPubKey.addresses?.includes(decodedAddress),
      )?.n,
      fee: Math.ceil(
        transactionVerbose.vout.find(
          (output) =>
            output.scriptPubKey.type === ElementsWalletProvider.feeOutputType,
        )!.value * ChainClient.decimals,
      ),
    };
  };

  private getFeePerVbyte = async (satPerVbyte?: number) => {
    return satPerVbyte || (await this.chainClient.estimateFee());
  };
}

export default ElementsWalletProvider;
