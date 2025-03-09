import { address, networks, payments } from 'liquidjs-lib';
import type { Network } from 'liquidjs-lib/src/networks';
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
    network: Network,
  ) {
    super(logger, CurrencyType.Liquid, walletProvider, network);
  }

  public deriveBlindingKeyFromScript = (
    outputScript: Buffer,
  ): Slip77Interface => {
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

      if (!shouldBlind) {
        const res = this.getPaymentFunc(outputScript)({
          output: outputScript,
          network: this.network as networks.Network,
        });
        return res.address!;
      }

      const walletKeys = this.deriveBlindingKeyFromScript(outputScript);

      const res = this.getPaymentFunc(outputScript)({
        output: outputScript,
        blindkey: walletKeys.publicKey,
        network: this.network as networks.Network,
      });

      return res.confidentialAddress!;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
