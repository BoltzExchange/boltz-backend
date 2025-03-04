import { address, networks, payments } from 'liquidjs-lib';
import type { Network } from 'liquidjs-lib/src/networks';
import { Payment } from 'liquidjs-lib/src/payments';
import { Slip77Interface } from 'slip77';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import Wallet from './Wallet';
import WalletProviderInterface from './providers/WalletProviderInterface';

export type Slip77s = {
  new: Slip77Interface;
  legacy: Slip77Interface;
};

class WalletLiquid extends Wallet {
  constructor(
    logger: Logger,
    walletProvider: WalletProviderInterface,
    private readonly slip77s: Slip77s,
    network: Network,
  ) {
    super(logger, CurrencyType.Liquid, walletProvider, network);
  }

  public deriveBlindingKeyFromScript = (
    outputScript: Buffer,
  ): Record<keyof Slip77s, Slip77Interface> => {
    return {
      new: this.slip77s.new.derive(outputScript),
      legacy: this.slip77s.legacy.derive(outputScript),
    };
  };

  public override encodeAddress = (
    outputScript: Buffer,
    shouldBlind = true,
  ): Record<keyof Slip77s, string> => {
    try {
      // Fee output of Liquid
      if (outputScript.length == 0) {
        return {
          new: '',
          legacy: '',
        };
      }

      if (!shouldBlind) {
        const res = this.getPaymentFunc(outputScript)({
          output: outputScript,
          network: this.network as networks.Network,
        });
        return {
          new: res.address!,
          legacy: res.address!,
        };
      }

      const walletKeys = this.deriveBlindingKeyFromScript(outputScript);

      const resNew = this.getPaymentFunc(outputScript)({
        output: outputScript,
        network: this.network as networks.Network,
        blindkey: walletKeys.new.publicKey,
      });
      const resLegacy = this.getPaymentFunc(outputScript)({
        output: outputScript,
        network: this.network as networks.Network,
        blindkey: walletKeys.legacy.publicKey,
      });

      return {
        new: resNew.confidentialAddress!,
        legacy: resLegacy.confidentialAddress!,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore invalid addresses
      return {
        new: '',
        legacy: '',
      };
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
