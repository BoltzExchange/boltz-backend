/**
 * A generic interface that can be used for multiple Lightning clients and implementations
 */
interface LightningClient {
  addInvoice(value: number): Promise<any>;
  payInvoice(invoice: string): Promise<any>;

  on(event: 'invoice.settled', listener: (rHash: Buffer) => void): this;
  emit(event: 'invoice.settled', rHash: Buffer): boolean;
}

export default LightningClient;
