import type { Network } from 'liquidjs-lib/src/networks';
import { addressFromOutputScript } from '../AddressUtils';
import type Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import type Sidecar from '../sidecar/Sidecar';
import Errors from './Errors';
import type { Slip77Node } from './Slip77';
import Wallet from './Wallet';
import type WalletProviderInterface from './providers/WalletProviderInterface';

class WalletLiquid extends Wallet {
  constructor(
    logger: Logger,
    walletProvider: WalletProviderInterface,
    private readonly slip77: Slip77Node,
    network: Network,
    sidecar: Sidecar,
  ) {
    super(logger, CurrencyType.Liquid, walletProvider, network, sidecar);
  }

  public deriveBlindingKeyFromScript = (outputScript: Buffer) => {
    return this.slip77.derive(outputScript);
  };

  public override encodeAddress = async (
    outputScript: Buffer,
    shouldBlind = true,
  ): Promise<string> => {
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'encodeAddress');
    }
    // Fee output of Liquid
    if (outputScript.length === 0) {
      return '';
    }
    try {
      const blindingKey = shouldBlind
        ? this.deriveBlindingKeyFromScript(outputScript).publicKey
        : undefined;

      return await addressFromOutputScript(
        CurrencyType.Liquid,
        outputScript,
        this.network,
        blindingKey,
        this.sidecar,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore invalid addresses
      return '';
    }
  };
}

export default WalletLiquid;
