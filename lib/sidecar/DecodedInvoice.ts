import { fromOptionalProtoInt, fromProtoInt, getHexString } from '../Utils';
import type { HopHint } from '../lightning/LightningClient';
import { InvoiceFeature } from '../lightning/LightningClient';
import type { DecodeInvoiceOrOfferResponse } from '../proto/boltzr';
import { Feature } from '../proto/boltzr';

enum InvoiceType {
  Bolt11,
  Offer,
  Bolt12Invoice,
}

class DecodedInvoice {
  private readonly decoded: DecodeInvoiceOrOfferResponse;

  constructor(public readonly rawRes: DecodeInvoiceOrOfferResponse) {
    this.decoded = rawRes;
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

    return data;
  }

  public get isExpired(): boolean {
    return this.decoded.isExpired;
  }

  public get amountMsat(): number {
    return fromProtoInt(
      this.decoded.bolt11?.msat || this.decoded.bolt12Invoice?.msat || '0',
    );
  }

  public get paymentHash(): Buffer | undefined {
    const data =
      this.decoded.bolt11?.paymentHash ||
      this.decoded.bolt12Invoice?.paymentHash;

    if (data === undefined) {
      return undefined;
    }

    return data;
  }

  public get expiryTimestamp(): number {
    if (this.decoded.bolt11) {
      return (
        fromProtoInt(this.decoded.bolt11.createdAt) +
        fromProtoInt(this.decoded.bolt11.expiry)
      );
    } else if (this.decoded.bolt12Invoice) {
      return (
        fromProtoInt(this.decoded.bolt12Invoice.createdAt) +
        fromProtoInt(this.decoded.bolt12Invoice.expiry)
      );
    }

    return 0;
  }

  public get routingHints(): HopHint[][] {
    if (this.decoded.bolt11) {
      return this.decoded.bolt11.hints.map((route) =>
        route.hops.map((hop) => ({
          feeBaseMsat: hop.baseFeeMsat,
          chanId: hop.channelId.toString(),
          cltvExpiryDelta: fromProtoInt(hop.cltvExpiryDelta),
          feeProportionalMillionths: hop.ppmFee,
          nodeId: getHexString(hop.node),
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
      return this.decoded.bolt12Invoice.paths.map((path) => ({
        nodeId: path.nodeId,
        shortChannelId: path.shortChannelId,
      }));
    }

    return [];
  }

  public get features(): Set<InvoiceFeature> {
    const features = new Set<InvoiceFeature>();

    for (const feature of this.decoded.bolt11?.features ||
      this.decoded.bolt12Invoice?.features ||
      []) {
      if (feature === Feature.BASIC_MPP) {
        features.add(InvoiceFeature.MPP);
      }
    }

    return features;
  }

  public get minFinalCltv(): number {
    return (
      fromOptionalProtoInt(this.decoded.bolt11?.minFinalCltvExpiry) ||
      this.decoded.bolt12Invoice?.paths.reduce(
        (max, current) =>
          fromProtoInt(current.cltvExpiryDelta) > max
            ? fromProtoInt(current.cltvExpiryDelta)
            : max,
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

    return data;
  }
}

export default DecodedInvoice;
export { InvoiceType };
