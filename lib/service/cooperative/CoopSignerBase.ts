import type { Transaction } from 'bitcoinjs-lib';
import type { Musig } from 'boltz-core';
import { SwapTreeSerializer } from 'boltz-core';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib/src/transaction';
import type { ClaimDetails, LiquidClaimDetails } from '../../Core';
import {
  calculateTransactionFee,
  constructClaimDetails,
  constructClaimTransaction,
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
import type Logger from '../../Logger';
import { getHexBuffer } from '../../Utils';
import type { IChainClient } from '../../chain/ChainClient';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import TypedEventEmitter from '../../consts/TypedEventEmitter';
import type { AnySwap } from '../../consts/Types';
import type ChainSwapData from '../../db/models/ChainSwapData';
import type Swap from '../../db/models/Swap';
import type { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import TransactionLabelRepository from '../../db/repositories/TransactionLabelRepository';
import type SwapOutputType from '../../swap/SwapOutputType';
import type Wallet from '../../wallet/Wallet';
import type { Currency } from '../../wallet/WalletManager';
import type WalletManager from '../../wallet/WalletManager';
import Errors from '../Errors';

type CooperativeDetails = {
  musig: Musig;
  sweepAddress: string;
  transaction: Transaction | LiquidTransaction;
};

type SwapToClaim<T> = {
  swap: T;
  cooperative?: CooperativeDetails;
};

type CooperativeClientDetails = {
  pubNonce: Buffer;
  publicKey: Buffer;
  transactionHash: Buffer;
};

abstract class CoopSignerBase<
  K extends Record<string | symbol, any>,
> extends TypedEventEmitter<K> {
  protected constructor(
    protected readonly logger: Logger,
    protected readonly walletManager: WalletManager,
    private readonly swapOutputType: SwapOutputType,
  ) {
    super();
  }

  protected createCoopDetails = async <T extends Swap | ChainSwapInfo>(
    chainCurrency: Currency,
    toClaim: SwapToClaim<T>,
  ): Promise<CooperativeClientDetails> => {
    const wallet = this.walletManager.wallets.get(chainCurrency.symbol)!;
    const address =
      toClaim.cooperative?.sweepAddress ||
      (await wallet.getAddress(
        TransactionLabelRepository.claimCooperativeLabel(toClaim.swap),
      ));

    const isSubmarine = toClaim.swap.type === SwapType.Submarine;

    const details = isSubmarine
      ? (toClaim.swap as Swap)
      : (toClaim.swap as ChainSwapInfo).receivingData;

    const ourKeys = wallet.getKeysByIndex(details.keyIndex!);
    toClaim.cooperative = {
      sweepAddress: address,
      musig: createMusig(ourKeys, getHexBuffer(details.theirPublicKey!)),
      transaction: constructClaimTransaction(
        wallet,
        [
          await this.constructClaimDetails(
            chainCurrency.chainClient!,
            wallet,
            toClaim.swap,
          ),
        ] as ClaimDetails[] | LiquidClaimDetails[],
        address,
        await chainCurrency.chainClient!.estimateFee(),
      ),
    };

    return {
      publicKey: ourKeys.publicKey,
      pubNonce: Buffer.from(toClaim.cooperative.musig.getPublicNonce()),
      transactionHash: await hashForWitnessV1(
        chainCurrency,
        toClaim.cooperative.transaction,
        0,
      ),
    };
  };

  /**
   * Cooperative when the preimage is undefined
   */
  protected constructClaimDetails = async <T extends AnySwap>(
    chainClient: IChainClient,
    wallet: Wallet,
    toClaim: T,
    preimage?: Buffer,
  ): Promise<ClaimDetails | LiquidClaimDetails> => {
    const details =
      toClaim.type === SwapType.Submarine
        ? (toClaim as Swap)
        : (toClaim as ChainSwapInfo).receivingData;

    const tx = parseTransaction(
      wallet.type,
      await chainClient.getRawTransaction(details.lockupTransactionId!),
    );

    return constructClaimDetails(
      this.swapOutputType,
      wallet,
      details,
      tx,
      preimage,
    );
  };

  protected broadcastCooperativeTransaction = async <
    T extends Swap | ChainSwapInfo,
    J extends Transaction | LiquidTransaction,
  >(
    swap: T,
    chainCurrency: Currency,
    musig: Musig,
    transaction: J,
    theirPubNonce: Buffer,
    theirPartialSignature: Buffer,
  ): Promise<{
    fee: number;
    transaction: J;
  }> => {
    const isSubmarine = swap.type === SwapType.Submarine;
    const details = isSubmarine
      ? (swap as Swap)
      : (swap as ChainSwapInfo).receivingData;

    const swapTree = isSubmarine
      ? (details as Swap).redeemScript!
      : (details as ChainSwapData).swapTree!;
    tweakMusig(
      chainCurrency.type,
      musig,
      SwapTreeSerializer.deserializeSwapTree(swapTree),
    );

    const theirPublicKey = getHexBuffer(details.theirPublicKey!);
    musig.aggregateNonces([[theirPublicKey, theirPubNonce]]);
    musig.initializeSession(
      await hashForWitnessV1(chainCurrency, transaction, 0),
    );
    if (!musig.verifyPartial(theirPublicKey, theirPartialSignature)) {
      throw Errors.INVALID_PARTIAL_SIGNATURE();
    }

    musig.addPartial(theirPublicKey, theirPartialSignature);
    musig.signPartial();

    transaction.ins[0].witness = [musig.aggregatePartials()];

    this.logger.info(
      `Broadcasting cooperative ${chainCurrency.symbol} claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${transaction.getId()}`,
    );
    await chainCurrency.chainClient!.sendRawTransaction(
      transaction.toHex(),
      true,
    );

    return {
      transaction,
      fee: await calculateTransactionFee(
        chainCurrency.chainClient!,
        transaction,
      ),
    };
  };
}

export default CoopSignerBase;
export { SwapToClaim, CooperativeDetails, CooperativeClientDetails };
