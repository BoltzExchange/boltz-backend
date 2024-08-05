import { Transaction } from 'liquidjs-lib';
import { UnblindedOutput, unblindOutput } from '../Core';
import { getHexBuffer } from '../Utils';
import ElementsClient, { IElementsClient } from '../chain/ElementsClient';
import WalletLiquid from '../wallet/WalletLiquid';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

class ElementsService {
  constructor(
    private currencies: Map<string, Currency>,
    private walletManager: WalletManager,
  ) {}

  public unblindOutputsFromId = async (txId: string) => {
    const { chainClient } = this.getElementsClients();
    return this.unblindOutputs(
      Transaction.fromHex(await chainClient.getRawTransaction(txId)),
    );
  };

  public unblindOutputs = async (
    tx: Transaction,
  ): Promise<UnblindedOutput[]> => {
    const { chainClient, wallet } = this.getElementsClients();

    return await Promise.all(
      tx.outs.map(async (out) => {
        if (out.rangeProof !== undefined && out.rangeProof.length > 0) {
          const keys = [
            wallet.deriveBlindingKeyFromScript(out.script).privateKey!,
            getHexBuffer(
              await chainClient.dumpBlindingKey(
                wallet.encodeAddress(out.script, false),
              ),
            ),
          ];

          for (const blindingKey of keys) {
            try {
              return unblindOutput(wallet, out, blindingKey);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              /* empty */
            }
          }
        }

        return unblindOutput(wallet, out);
      }),
    );
  };

  public deriveBlindingKeys = (address: string) => {
    const { wallet } = this.getElementsClients();

    const { publicKey, privateKey } = wallet.deriveBlindingKeyFromScript(
      wallet.decodeAddress(address),
    );
    return {
      publicKey: publicKey!,
      privateKey: privateKey!,
    };
  };

  private getElementsClients = () => {
    const currency = this.currencies.get(ElementsClient.symbol);
    const wallet = this.walletManager.wallets.get(ElementsClient.symbol) as
      | WalletLiquid
      | undefined;

    if (currency === undefined || wallet === undefined) {
      throw Errors.CURRENCY_NOT_FOUND(ElementsClient.symbol);
    }

    return {
      wallet,
      chainClient: currency.chainClient! as IElementsClient,
    };
  };
}

export default ElementsService;
