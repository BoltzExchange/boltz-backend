import AsyncLock from 'async-lock';
import { SwapTreeSerializer } from 'boltz-core';
import { Op } from 'sequelize';
import Logger from '../../Logger';
import { formatError, getHexBuffer } from '../../Utils';
import {
  FailedSwapUpdateEvents,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../../consts/Enums';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../db/repositories/ChainSwapRepository';
import SwapOutputType from '../../swap/SwapOutputType';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import CoopSignerBase, {
  CooperativeDetails,
  SwapToClaim,
} from './CoopSignerBase';
import { PartialSignature } from './MusigSigner';
import { createPartialSignature, isPreimageValid } from './Utils';

type TheirSigningData = {
  pubNonce: Buffer;
  transaction: Buffer;
  index: number;
};

class ChainSwapSigner extends CoopSignerBase<
  ChainSwapInfo,
  { claim: ChainSwapInfo }
> {
  private static readonly swapsToClaimLock = 'swapsToClaim';

  private readonly lock = new AsyncLock();

  private readonly swapsToClaim = new Map<string, SwapToClaim<ChainSwapInfo>>();

  constructor(
    logger: Logger,
    private readonly currencies: Map<string, Currency>,
    walletManager: WalletManager,
    swapOutputType: SwapOutputType,
  ) {
    super(logger, walletManager, swapOutputType);
  }

  public init = async () => {
    const claimableChainSwaps = await ChainSwapRepository.getChainSwaps({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionServerMempool,
          SwapUpdateEvent.TransactionServerConfirmed,
        ],
      },
    });

    for (const swap of claimableChainSwaps) {
      await this.registerForClaim(swap);
    }
  };

  public signRefund = (
    swap: ChainSwapInfo,
    theirNonce: Buffer,
    transaction: Buffer,
    index: number,
  ): Promise<PartialSignature> => {
    const currency = this.currencies.get(swap.receivingData.symbol)!;
    if (currency.chainClient === undefined) {
      throw Errors.CURRENCY_NOT_UTXO_BASED();
    }

    if (!FailedSwapUpdateEvents.includes(swap.status)) {
      this.logger.verbose(
        `Not creating partial signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    this.logger.debug(
      `Creating partial signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
    );

    return createPartialSignature(
      currency,
      this.walletManager.wallets.get(swap.receivingData.symbol)!,
      SwapTreeSerializer.deserializeSwapTree(swap.receivingData.swapTree!),
      swap.receivingData.keyIndex!,
      getHexBuffer(swap.receivingData.theirPublicKey!),
      theirNonce,
      transaction,
      index,
    );
  };

  public registerForClaim = async (swap: ChainSwapInfo) => {
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      if (this.swapsToClaim.has(swap.id)) {
        return;
      }

      this.swapsToClaim.set(swap.id, {
        swap,
      });
    });
  };

  // TODO: remove after refund
  public removeFromClaimable = async (id: string) => {
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      this.swapsToClaim.delete(id);
    });
  };

  // TODO: coop claims when one side is EVM

  public getCooperativeDetails = async (
    swap: ChainSwapInfo,
  ): Promise<{
    pubNonce: Buffer;
    publicKey: Buffer;
    transactionHash: Buffer;
  }> => {
    const claimDetails = await this.getToClaimDetails(swap.id);
    if (claimDetails === undefined) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
    }

    return this.createCoopDetails(
      this.currencies.get(swap.receivingData.symbol)!,
      claimDetails,
    );
  };

  public signClaim = async (
    swap: ChainSwapInfo,
    toSign: TheirSigningData,
    preimage?: Buffer,
    theirSignature?: PartialSignature,
  ): Promise<PartialSignature> => {
    // If the swap is settled already, we still allow the partial signing of claims
    if (!swap.isSettled) {
      const claimDetails = await this.getToClaimDetails(swap.id);
      if (
        claimDetails === undefined ||
        claimDetails.cooperative === undefined
      ) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST();
      }

      if (preimage === undefined || !isPreimageValid(swap, preimage)) {
        this.logNotCooperativelyClaiming(swap, 'preimage is incorrect');
        throw Errors.INCORRECT_PREIMAGE();
      }

      // TODO: broadcast the claim eventually when the preimage is correct but the signature is not?
      swap = await ChainSwapRepository.setPreimage(swap, preimage);

      if (theirSignature === undefined) {
        this.logNotCooperativelyClaiming(swap, 'signature missing');
        throw Errors.INVALID_PARTIAL_SIGNATURE();
      }

      this.logger.verbose(`Cooperatively claiming Chain Swap ${swap.id}`);

      try {
        swap = await this.broadcastReceivingClaimTransaction(
          swap,
          preimage,
          claimDetails.cooperative,
          theirSignature,
        );
      } catch (e) {
        // TODO: reset the claim details for new attempt?
        this.logger.warn(
          `Our cooperative claim for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} failed: ${formatError(e)}`,
        );
        throw e;
      }
    }

    this.emit('claim', swap);
    return this.createSendingPartialSignature(swap, toSign);
  };

  private broadcastReceivingClaimTransaction = async (
    swap: ChainSwapInfo,
    preimage: Buffer,
    claimDetails: CooperativeDetails,
    theirSignature: PartialSignature,
  ) => {
    const { fee } = await this.broadcastCooperativeTransaction(
      swap,
      this.currencies.get(swap.receivingData.symbol)!,
      claimDetails.musig,
      claimDetails.transaction,
      theirSignature.pubNonce,
      theirSignature.signature,
    );

    await this.removeFromClaimable(swap.id);
    return ChainSwapRepository.setClaimMinerFee(swap, preimage, fee);
  };

  private createSendingPartialSignature = async (
    swap: ChainSwapInfo,
    toSign: TheirSigningData,
  ) => {
    this.logger.debug(
      `Creating partial signature for user claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
    );

    const data = swap.sendingData;
    return createPartialSignature(
      this.currencies.get(data.symbol)!,
      this.walletManager.wallets.get(data.symbol)!,
      SwapTreeSerializer.deserializeSwapTree(data.swapTree!),
      data.keyIndex!,
      getHexBuffer(data.theirPublicKey!),
      toSign.pubNonce,
      toSign.transaction,
      toSign.index,
    );
  };

  private getToClaimDetails = async (id: string) => {
    let details: SwapToClaim<ChainSwapInfo> | undefined;
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      details = this.swapsToClaim.get(id);
    });

    return details;
  };

  private logNotCooperativelyClaiming = (
    swap: ChainSwapInfo,
    reason: string,
  ) => {
    this.logger.warn(
      `Not cooperatively claiming ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${reason}`,
    );
  };
}

export default ChainSwapSigner;
export { TheirSigningData };
