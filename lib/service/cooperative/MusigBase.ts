import { Types } from 'boltz-core';
import { EventEmitter } from 'events';
import {
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import { PartialSignature } from './MusigSigner';

abstract class MusigBase extends EventEmitter {
  protected constructor(protected readonly walletManager: WalletManager) {
    super();
  }

  protected createPartialSignature = async (
    currency: Currency,
    swapTree: Types.SwapTree,
    keyIndex: number,
    theirPublicKey: Buffer,
    theirNonce: Buffer,
    rawTransaction: Buffer | string,
    vin: number,
  ): Promise<PartialSignature> => {
    const tx = parseTransaction(currency.type, rawTransaction);
    if (vin < 0 || tx.ins.length <= vin) {
      throw Errors.INVALID_VIN();
    }

    const wallet = this.walletManager.wallets.get(currency.symbol)!;

    const ourKeys = wallet.getKeysByIndex(keyIndex);

    const musig = createMusig(ourKeys, theirPublicKey);
    tweakMusig(currency.type, musig, swapTree);

    musig.aggregateNonces([[theirPublicKey, theirNonce]]);

    const hash = await hashForWitnessV1(currency, tx, vin);
    musig.initializeSession(hash);

    return {
      signature: Buffer.from(musig.signPartial()),
      pubNonce: Buffer.from(musig.getPublicNonce()),
    };
  };
}

export default MusigBase;
