import { getHexString } from '../Utils';
import type { HopHint } from '../lightning/LightningClient';
import { InvoiceFeature } from '../lightning/LightningClient';
import type { DecodeInvoiceOrOfferResponse } from '../proto/boltzr_pb';
import { Feature } from '../proto/boltzr_pb';

enum InvoiceType {
  Bolt11,
  Offer,
  Bolt12Invoice,
}

class DecodedInvoice {
  private readonly decoded: DecodeInvoiceOrOfferResponse.AsObject;

  constructor(public readonly rawRes: DecodeInvoiceOrOfferResponse) {
    this.decoded = rawRes.toObject();
  }

  public get type(): InvoiceType {
    if (this.decoded.bolt11 !== undefined) {
      return InvoiceType.Bolt11;
    } else if (this.decoded.offer !== undefined) {
      return InvoiceType.Offer;
    } else {
      return InvoiceType.Bolt12Invoice;
    }
  }

  public get typePretty(): string {
    switch (this.type) {
      case InvoiceType.Bolt11:
        return 'BOLT11';
      case InvoiceType.Offer:
        return 'BOLT12 offer';
      case InvoiceType.Bolt12Invoice:
        return 'BOLT12';
    }
  }

  public get payee(): Buffer | undefined {
    const data =
      this.decoded.bolt11?.payeePubkey ||
      this.decoded.bolt12Invoice?.signingPubkey ||
      this.decoded.offer?.signingPubkey;

    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }

  public get isExpired(): boolean {
    return this.decoded.isExpired;
  }

  public get amountMsat(): number {
    return this.decoded.bolt11?.msat || this.decoded.bolt12Invoice?.msat || 0;
  }

  public get paymentHash(): Buffer | undefined {
    const data =
      this.decoded.bolt11?.paymentHash ||
      this.decoded.bolt12Invoice?.paymentHash;

    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }

  public get expiryTimestamp(): number {
    if (this.decoded.bolt11) {
      return this.decoded.bolt11.createdAt + this.decoded.bolt11.expiry;
    } else if (this.decoded.bolt12Invoice) {
      return (
        this.decoded.bolt12Invoice.createdAt + this.decoded.bolt12Invoice.expiry
      );
    }

    return 0;
  }

  public get routingHints(): HopHint[][] {
    if (this.decoded.bolt11) {
      return this.decoded.bolt11.hintsList.map((route) =>
        route.hopsList.map((hop) => ({
          feeBaseMsat: hop.baseFeeMsat,
          chanId: hop.channelId.toString(),
          cltvExpiryDelta: hop.cltvExpiryDelta,
          feeProportionalMillionths: hop.ppmFee,
          nodeId: getHexString(Buffer.from(hop.node as string, 'base64')),
        })),
      );
    }

    return [];
  }

  public get paths(): {
    nodeId: Buffer | undefined;
    shortChannelId: string | undefined;
  }[] {
    if (this.decoded.bolt12Invoice) {
      return this.decoded.bolt12Invoice.pathsList.map((path) => ({
        nodeId:
          path.nodeId !== undefined
            ? Buffer.from(path.nodeId as string, 'base64')
            : undefined,
        shortChannelId:
          path.shortChannelId !== '' ? path.shortChannelId : undefined,
      }));
    }

    return [];
  }

  public get features(): Set<InvoiceFeature> {
    return new Set(
      (
        this.decoded.bolt11?.featuresList ||
        this.decoded.bolt12Invoice?.featuresList ||
        []
      ).map((feature) => {
        switch (feature) {
          case Feature.BASIC_MPP:
            return InvoiceFeature.MPP;
        }
      }),
    );
  }

  public get minFinalCltv(): number {
    return (
      this.decoded.bolt11?.minFinalCltvExpiry ||
      this.decoded.bolt12Invoice?.pathsList.reduce(
        (max, current) =>
          current.cltvExpiryDelta > max ? current.cltvExpiryDelta : max,
        0,
      ) ||
      0
    );
  }

  public get description(): string | undefined {
    return (
      this.decoded.bolt11?.memo ||
      this.decoded.offer?.description ||
      this.decoded.bolt12Invoice?.description
    );
  }

  public get descriptionHash() {
    const data = this.decoded.bolt11?.descriptionHash;
    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }
}

export default DecodedInvoice;
export { InvoiceType };
