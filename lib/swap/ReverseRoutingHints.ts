import { crypto } from 'bitcoinjs-lib';
import { ECPair } from '../ECPairHelper';
import { getHexString, getSwapMemo } from '../Utils';
import { SwapType, SwapVersion } from '../consts/Enums';
import { transactionToLndScid } from '../lightning/ChannelUtils';
import { HopHint } from '../lightning/LightningClient';
import RateProvider from '../rates/RateProvider';
import PaymentRequestUtils from '../service/PaymentRequestUtils';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';

type SwapHints = {
  invoiceMemo: string;
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
      userAddressSignature?: Buffer;
    },
  ): SwapHints => {
    const invoiceMemo =
      args.memo ||
      getSwapMemo(sendingCurrency.symbol, SwapType.ReverseSubmarine);
    const receivedAmount =
      args.onchainAmount -
      this.rateProvider.feeProvider.minerFees.get(sendingCurrency.symbol)![
        args.version
      ].reverse.claim;

    if (
      args.userAddress === undefined ||
      args.userAddressSignature === undefined
    ) {
      return { invoiceMemo, receivedAmount };
    }

    try {
      this.walletManager.wallets
        .get(sendingCurrency.symbol)!
        .decodeAddress(args.userAddress);
    } catch (e) {
      throw Errors.INVALID_ADDRESS();
    }

    const bip21 = this.paymentRequestUtils.encodeBip21(
      sendingCurrency.symbol,
      args.userAddress,
      receivedAmount,
      args.memo,
    );

    const routingHint = this.encodeRoutingHint(
      args.claimPublicKey,
      args.userAddress,
      args.userAddressSignature,
    );

    return {
      bip21,
      routingHint,
      invoiceMemo,
      receivedAmount,
    };
  };

  private encodeRoutingHint = (
    claimPublicKey: Buffer | undefined,
    userAddress: string,
    userAddressSignature: Buffer | undefined,
  ): HopHint[][] | undefined => {
    if (claimPublicKey === undefined || userAddressSignature === undefined) {
      return undefined;
    }

    const sigValid = ECPair.fromPublicKey(claimPublicKey).verifySchnorr(
      crypto.sha256(Buffer.from(userAddress, 'utf-8')),
      userAddressSignature,
    );
    if (!sigValid) {
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
}

export default ReverseRoutingHints;
