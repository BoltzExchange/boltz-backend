import { Slip77Interface } from 'slip77';
import { address, networks, payments } from 'liquidjs-lib';
import Errors from './Errors';
import Wallet from './Wallet';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import WalletProviderInterface from './providers/WalletProviderInterface';

class WalletLiquid extends Wallet {
  constructor(
    logger: Logger,
    public walletProvider: WalletProviderInterface,
    public slip77: Slip77Interface,
  ) {
    super(logger, CurrencyType.Liquid, walletProvider);
  }

  public override encodeAddress = (outputScript: Buffer): string => {
    try {
      // Fee output of Liquid
      if (outputScript.length == 0) {
        return '';
      }

      return this.getPaymentFunc(outputScript)({
        output: outputScript,
        network: this.network as networks.Network,
        blindkey: this.deriveBlindingKeyFromScript(outputScript).publicKey!,
      }).confidentialAddress!;
    } catch (error) {
      // Ignore invalid addresses
      return '';
    }
  };

  public deriveBlindingKeyFromScript = (outputScript: Buffer) => {
    return this.slip77.derive(outputScript);
  };

  private getPaymentFunc = (outputScript: Buffer) => {
    switch (address.getScriptType(outputScript)) {
      case address.ScriptType.P2Pkh:
        return payments.p2pkh;
      case address.ScriptType.P2Sh:
        return payments.p2sh;
      case address.ScriptType.P2Wpkh:
        return payments.p2wpkh;
      case address.ScriptType.P2Wsh:
        return payments.p2wsh;
      case address.ScriptType.P2Tr:
        throw Errors.TAPROOT_BLINDING_NOT_SUPPORTED();
    }
  };
}

export default WalletLiquid;
