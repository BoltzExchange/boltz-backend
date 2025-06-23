import { crypto } from 'bitcoinjs-lib';
import { ECPair } from '../ECPairHelper';
import { getHexString, getSwapMemo } from '../Utils';
import type { SwapVersion } from '../consts/Enums';
import { SwapType } from '../consts/Enums';
import { transactionToLndScid } from '../lightning/ChannelUtils';
import type { HopHint } from '../lightning/LightningClient';
import type RateProvider from '../rates/RateProvider';
import type PaymentRequestUtils from '../service/PaymentRequestUtils';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import Errors from './Errors';

type SwapHints = {
  invoiceMemo?: string;
  invoiceDescriptionHash?: Buffer;

  receivedAmount: number;
  bip21Params?: string;
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

    const bip21Params = this.paymentRequestUtils.encodeParams(
      sendingCurrency.symbol,
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
      bip21Params,
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
      // Useless hint to trick LND into thinking the MRH is not an LSP
      [
        {
          nodeId:
            '02e6109db08c459453bac736158f3962a28f05df0c4b8660479679c1f48c1ed8d8',
          chanId: transactionToLndScid(902436, 21, 0),
          feeBaseMsat: 1,
          cltvExpiryDelta: 82,
          feeProportionalMillionths: 22,
        },
      ],
    ];
  };

  private verifyBolt12Invoice = (
    decoded: DecodedInvoice,
    userAddress: string,
    userAddressSignature: Buffer,
  ) => {
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
