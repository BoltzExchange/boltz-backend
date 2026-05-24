import type { Musig } from 'boltz-core';
import { SwapTreeSerializer } from 'boltz-core';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
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
import type { ConstructedTransaction } from '../../TxView';
import { TxView } from '../../TxView';
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

export const cooperativeSignaturesDisabledMessage =
  'cooperative signatures are disabled';

type CooperativeDetails = {
  musig: Musig.MusigWithNonce;
  sweepAddress: string;
  transaction: ConstructedTransaction;
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
    const transaction = await constructClaimTransaction(
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
    );
    const transactionHash = await hashForWitnessV1(
      chainCurrency,
      transaction,
      0,
    );
    const swapTree = isSubmarine
      ? (details as Swap).redeemScript!
      : (details as ChainSwapData).swapTree!;
    const musig = tweakMusig(
      chainCurrency.type,
      createMusig(ourKeys, getHexBuffer(details.theirPublicKey!)),
      SwapTreeSerializer.deserializeSwapTree(swapTree),
    )
      .message(transactionHash)
      .generateNonce();

    toClaim.cooperative = {
      sweepAddress: address,
      musig,
      transaction,
    };

    return {
      publicKey: ourKeys.publicKey,
      pubNonce: Buffer.from(musig.publicNonce),
      transactionHash,
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
    J extends ConstructedTransaction,
  >(
    swap: T,
    chainCurrency: Currency,
    musig: Musig.MusigWithNonce,
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

    const theirPublicKey = getHexBuffer(details.theirPublicKey!);
    const session = musig
      .aggregateNonces([[theirPublicKey, theirPubNonce]])
      .initializeSession();
    if (!session.verifyPartial(theirPublicKey, theirPartialSignature)) {
      throw Errors.INVALID_PARTIAL_SIGNATURE();
    }
    const witness = session
      .addPartial(theirPublicKey, theirPartialSignature)
      .signPartial()
      .aggregatePartials();

    if (TxView.isScure(transaction)) {
      transaction.updateInput(0, { finalScriptWitness: [witness] }, true);
    } else {
      (transaction as LiquidTransaction).ins[0].witness = [
        Buffer.from(witness),
      ];
    }

    const txId = TxView.of(transaction).id;
    this.logger.info(
      `Broadcasting cooperative ${chainCurrency.symbol} claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${txId}`,
    );
    await chainCurrency.chainClient!.sendRawTransaction(
      TxView.of(transaction).hex,
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
