import { address, networks, payments } from 'liquidjs-lib';
import { Payment } from 'liquidjs-lib/src/payments';
import { Slip77Interface } from 'slip77';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import Wallet from './Wallet';
import WalletProviderInterface from './providers/WalletProviderInterface';

class WalletLiquid extends Wallet {
  constructor(
    logger: Logger,
    walletProvider: WalletProviderInterface,
    private readonly slip77: Slip77Interface,
  ) {
    super(logger, CurrencyType.Liquid, walletProvider);
  }

  public deriveBlindingKeyFromScript = (outputScript: Buffer) => {
    return this.slip77.derive(outputScript);
  };

  public override encodeAddress = (
    outputScript: Buffer,
    shouldBlind = true,
  ): string => {
    try {
      // Fee output of Liquid
      if (outputScript.length == 0) {
        return '';
      }

      const res = this.getPaymentFunc(outputScript)({
        output: outputScript,
        network: this.network as networks.Network,
        blindkey: shouldBlind
          ? this.deriveBlindingKeyFromScript(outputScript).publicKey!
          : undefined,
      });

      return shouldBlind ? res.confidentialAddress! : res.address!;
    } catch (error) {
      // Ignore invalid addresses
      return '';
    }
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
      default:
        return WalletLiquid.blindP2tr;
    }
  };

  private static blindP2tr = (
    payment: Payment,
  ): {
    address: string;
    confidentialAddress: string | undefined;
  } => {
    const addr = address.fromOutputScript(payment.output!, payment.network);
    const dec = address.fromBech32(addr);

    let confidentialAddress: string | undefined;

    if (payment.blindkey) {
      confidentialAddress = address.toBlech32(
        Buffer.concat([Buffer.from([dec.version, dec.data.length]), dec.data]),
        payment.blindkey,
        payment.network!.blech32,
        dec.version,
      );
    }

    return {
      confidentialAddress,
      address: addr,
    };
  };
}

export default WalletLiquid;
