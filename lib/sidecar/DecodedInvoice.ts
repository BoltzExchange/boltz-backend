import { getHexString } from '../Utils';
import type { HopHint } from '../lightning/LightningClient';
import { InvoiceFeature } from '../lightning/LightningClient';
import type { DecodeInvoiceOrOfferResponse } from '../proto/sidecar/boltzr_pb';
import { Feature } from '../proto/sidecar/boltzr_pb';

enum InvoiceType {
  Bolt11,
  Offer,
  Bolt12Invoice,
}

class DecodedInvoice {
  constructor(private readonly res: DecodeInvoiceOrOfferResponse.AsObject) {}

  public get type(): InvoiceType {
    if (this.res.bolt11 !== undefined) {
      return InvoiceType.Bolt11;
    } else if (this.res.offer !== undefined) {
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
      this.res.bolt11?.payeePubkey ||
      this.res.bolt12Invoice?.signingPubkey ||
      this.res.offer?.signingPubkey;

    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }

  public get isExpired(): boolean {
    return this.res.isExpired;
  }

  public get amountMsat(): number {
    return this.res.bolt11?.msat || this.res.bolt12Invoice?.msat || 0;
  }

  public get paymentHash(): Buffer | undefined {
    const data =
      this.res.bolt11?.paymentHash || this.res.bolt12Invoice?.paymentHash;

    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }

  public get expiryTimestamp(): number {
    if (this.res.bolt11) {
      return this.res.bolt11.createdAt + this.res.bolt11.expiry;
    } else if (this.res.bolt12Invoice) {
      return this.res.bolt12Invoice.createdAt + this.res.bolt12Invoice.expiry;
    }

    return 0;
  }

  public get routingHints(): HopHint[][] {
    if (this.res.bolt11) {
      return this.res.bolt11.hintsList.map((route) =>
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
    if (this.res.bolt12Invoice) {
      return this.res.bolt12Invoice.pathsList.map((path) => ({
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
        this.res.bolt11?.featuresList ||
        this.res.bolt12Invoice?.featuresList ||
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
      this.res.bolt11?.minFinalCltvExpiry ||
      this.res.bolt12Invoice?.pathsList.reduce(
        (max, current) =>
          current.cltvExpiryDelta > max ? current.cltvExpiryDelta : max,
        0,
      ) ||
      0
    );
  }

  public get description(): string | undefined {
    return (
      this.res.bolt11?.memo ||
      this.res.offer?.description ||
      this.res.bolt12Invoice?.description
    );
  }

  public get descriptionHash() {
    const data = this.res.bolt11?.descriptionHash;
    if (data === undefined) {
      return undefined;
    }

    return Buffer.from(data as string, 'base64');
  }
}

export default DecodedInvoice;
export { InvoiceType };
