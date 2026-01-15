import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import AsyncLock from 'async-lock';
import type {
  Provider,
  Signer,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
} from 'ethers';
import { AbstractSigner } from 'ethers';
import Tracing from '../../Tracing';
import { formatError } from '../../Utils';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';

class SequentialSigner extends AbstractSigner {
  private static readonly txLock = 'txLock';

  private readonly lock = new AsyncLock();

  constructor(
    private readonly symbol: string,
    private signer: AbstractSigner,
  ) {
    super(signer.provider);
  }

  public getAddress = (): Promise<string> => this.signer.getAddress();

  public connect = (provider: null | Provider): Signer => {
    return new SequentialSigner(this.symbol, this.signer.connect(provider));
  };

  public signTransaction = async (tx: TransactionRequest): Promise<string> => {
    const span = Tracing.tracer.startSpan(
      `Signing ${this.symbol} transaction`,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          nonce: tx.nonce?.toString(),
          value: tx.value?.toString(),
        },
      },
    );
    const ctx = trace.setSpan(context.active(), span);

    try {
      return await context.with(ctx, this.signTransactionInternal, this, tx);
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: formatError(error),
      });
      throw error;
    } finally {
      span.end();
    }
  };

  public signMessage = (message: string | Uint8Array): Promise<string> =>
    this.signer.signMessage(message);

  public signTypedData = (
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
  ): Promise<string> => this.signer.signTypedData(domain, types, value);

  private signTransactionInternal = async (tx: TransactionRequest) => {
    return await this.lock.acquire(SequentialSigner.txLock, async () => {
      if (tx.value !== undefined && tx.value !== null) {
        const [ourBalance, pendingTxsValue] = await Promise.all([
          this.signer.provider!.getBalance(await this.getAddress()),
          PendingEthereumTransactionRepository.getTotalSent(this.symbol),
        ]);

        if (ourBalance - pendingTxsValue < BigInt(tx.value)) {
          throw new Error('insufficient balance');
        }
      }

      return await this.signer.signTransaction(tx);
    });
  };
}

export default SequentialSigner;
