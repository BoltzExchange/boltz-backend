import Logger from '../../Logger';
import { getHexBuffer } from '../../Utils';
import { parseTransaction } from '../../Core';
import { CurrencyType } from '../../consts/Enums';
import ChainClient from '../../chain/ChainClient';
import ElementsClient from '../../chain/ElementsClient';
import WalletProviderInterface, {
  SentTransaction,
  WalletBalance,
} from './WalletProviderInterface';

class ElementsWalletProvider implements WalletProviderInterface {
  public static readonly assetLabel = 'bitcoin';
  public static readonly feeOutputType = 'fee';

  public readonly symbol: string;

  constructor(public logger: Logger, public chainClient: ElementsClient) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Elements wallet`);
  }

  public getBalance = async (): Promise<WalletBalance> => {
    const balances = await this.chainClient.getBalances();

    const confirmedBalance =
      balances.mine.trusted[ElementsWalletProvider.assetLabel];
    const unconfirmedBalance =
      balances.mine.untrusted_pending[ElementsWalletProvider.assetLabel];

    return {
      confirmedBalance,
      unconfirmedBalance,
      totalBalance: confirmedBalance + unconfirmedBalance,
    };
  };

  public getAddress = (): Promise<string> => {
    return this.chainClient.getNewAddress();
  };

  public dumpBlindingKey = async (address: string): Promise<Buffer> => {
    return getHexBuffer(await this.chainClient.dumpBlindingKey(address));
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    satPerVbyte?: number,
  ): Promise<SentTransaction> => {
    const transactionId = await this.chainClient.sendToAddress(
      address,
      amount,
      await this.getFeePerVbyte(satPerVbyte),
    );
    return this.handleLiquidTransaction(transactionId, address);
  };

  public sweepWallet = async (
    address: string,
    satPerVbyte?: number | undefined,
  ): Promise<SentTransaction> => {
    const balance = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(
      address,
      balance.totalBalance,
      await this.getFeePerVbyte(satPerVbyte),
      true,
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
