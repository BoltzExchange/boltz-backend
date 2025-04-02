import { crypto } from 'bitcoinjs-lib';
import { ECPair } from '../ECPairHelper';
import { getHexString, getSwapMemo } from '../Utils';
import { SwapType, SwapVersion } from '../consts/Enums';
import { transactionToLndScid } from '../lightning/ChannelUtils';
import { HopHint } from '../lightning/LightningClient';
import RateProvider from '../rates/RateProvider';
import PaymentRequestUtils from '../service/PaymentRequestUtils';
import DecodedInvoice from '../sidecar/DecodedInvoice';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

type SwapHints = {
  invoiceMemo?: string;
  invoiceDescriptionHash?: Buffer;

  receivedAmount: number;
  bip21?: string;
  routingHint?: HopHint[][];
};

class ReverseRoutingHints {
  private static readonly routingHintChanId = transactionToLndScid(
    542409,
    1308,
    0,
  );

  constructor(
    private readonly walletManager: WalletManager,
    private readonly rateProvider: RateProvider,
    private readonly paymentRequestUtils: PaymentRequestUtils,
  ) {}

  public getHints = (
    sendingCurrency: Currency,
    args: {
      memo?: string;
      userAddress?: string;
      version: SwapVersion;
      onchainAmount: number;
      claimPublicKey?: Buffer;
      descriptionHash?: Buffer;
      userAddressSignature?: Buffer;
      invoice?: { decoded: DecodedInvoice };
    },
  ): SwapHints => {
    const isBolt12 = args.invoice !== undefined;

    const invoiceDescriptionHash = !isBolt12
      ? this.checkDescriptionHash(args.descriptionHash)
      : undefined;
    const invoiceMemo = !isBolt12
      ? args.memo !== undefined
        ? args.memo
        : getSwapMemo(sendingCurrency.symbol, SwapType.ReverseSubmarine)
      : args.invoice?.decoded.description;

    const receivedAmount =
      args.onchainAmount -
      this.rateProvider.feeProvider.minerFees.get(sendingCurrency.symbol)![
        args.version
      ].reverse.claim;

    if (
      args.userAddress === undefined ||
      args.userAddressSignature === undefined
    ) {
      return { invoiceMemo, receivedAmount, invoiceDescriptionHash };
    }

    try {
      this.walletManager.wallets
        .get(sendingCurrency.symbol)!
        .decodeAddress(args.userAddress);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw Errors.INVALID_ADDRESS();
    }

    const bip21 = this.paymentRequestUtils.encodeBip21(
      sendingCurrency.symbol,
      args.userAddress,
      receivedAmount,
      args.memo,
    );

    let routingHint: ReturnType<typeof this.encodeRoutingHint> = undefined;

    if (isBolt12) {
      this.verifyBolt12Invoice(
        args.invoice!.decoded,
        args.userAddress,
        args.userAddressSignature,
      );
    } else {
      routingHint = this.encodeRoutingHint(
        args.claimPublicKey,
        args.userAddress,
        args.userAddressSignature,
      );
    }

    return {
      bip21,
      routingHint,
      invoiceMemo,
      receivedAmount,
      invoiceDescriptionHash,
    };
  };

  private encodeRoutingHint = (
    claimPublicKey: Buffer | undefined,
    userAddress: string,
    userAddressSignature: Buffer,
  ): HopHint[][] | undefined => {
    if (claimPublicKey === undefined) {
      return undefined;
    }

    if (
      !this.verifyAddressSignature(
        claimPublicKey,
        userAddress,
        userAddressSignature,
      )
    ) {
      throw Errors.INVALID_ADDRESS_SIGNATURE();
    }

    return [
      [
        {
          nodeId: getHexString(claimPublicKey),
          chanId: ReverseRoutingHints.routingHintChanId,
          feeBaseMsat: 0,
          cltvExpiryDelta: 81,
          feeProportionalMillionths: 21,
        },
      ],
    ];
  };

  private verifyBolt12Invoice = (
    decoded: DecodedInvoice,
    userAddress: string,
    userAddressSignature: Buffer,
  ) => {
    if (
      !decoded.paths.some(
        (path) =>
          path.shortChannelId !== undefined &&
          path.shortChannelId.toString() ===
            ReverseRoutingHints.routingHintChanId,
      )
    ) {
      throw Errors.MAGIC_ROUTING_HINT_MISSING();
    }

    if (decoded.payee === undefined) {
      throw Errors.PAYEE_MISSING_FROM_INVOICE();
    }

    if (
      !this.verifyAddressSignature(
        decoded.payee,
        userAddress,
        userAddressSignature,
      )
    ) {
      throw Errors.INVALID_ADDRESS_SIGNATURE();
    }
  };

  private checkDescriptionHash = (
    descriptionHash?: Buffer,
  ): Buffer | undefined => {
    if (descriptionHash === undefined) {
      return undefined;
    }

    if (descriptionHash.length !== 32) {
      throw Errors.INVALID_DESCRIPTION_HASH();
    }

    return descriptionHash;
  };

  private verifyAddressSignature = (
    publicKey: Buffer,
    userAddress: string,
    userAddressSignature: Buffer,
  ) =>
    ECPair.fromPublicKey(publicKey).verifySchnorr(
      crypto.sha256(Buffer.from(userAddress, 'utf-8')),
      userAddressSignature,
    );
}

export default ReverseRoutingHints;
