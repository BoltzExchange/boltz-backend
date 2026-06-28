import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import type {
  Provider,
  Signer,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
} from 'ethers';
import { AbstractSigner, Transaction, getBigInt } from 'ethers';
import InstrumentedLock from '../../InstrumentedLock';
import Tracing from '../../Tracing';
import { formatError } from '../../Utils';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';
import { bumpGasLimit } from './EthereumUtils';

class SequentialSigner extends AbstractSigner {
  private static readonly txLock = 'txLock';

  // One lock per symbol, shared across connect() clones so they serialize
  // together and never register duplicate InstrumentedLock instances
  private static readonly locks = new Map<string, InstrumentedLock>();

  // Per-symbol high-water nonce advanced under the lock so concurrent bursts get
  // distinct nonces (see signTransactionInternal)
  private static readonly reservedNonces = new Map<string, number>();

  private readonly lock: InstrumentedLock;

  constructor(
    private readonly symbol: string,
    private signer: AbstractSigner,
  ) {
    super(signer.provider);

    const lockName = `sequentialSigner-${symbol}`;
    let lock = SequentialSigner.locks.get(lockName);
    if (lock === undefined) {
      lock = new InstrumentedLock(lockName);
      SequentialSigner.locks.set(lockName, lock);
    }
    this.lock = lock;
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
    return await this.lock.acquire(
      SequentialSigner.txLock,
      'signTransaction',
      async () => {
        let reservedNonce: number | undefined;
        const previousReservedNonce = SequentialSigner.reservedNonces.get(
          this.symbol,
        );

        try {
          // Allocate the nonce under the lock. ethers resolves tx.nonce during
          // populateTransaction (outside the lock), so concurrent sends arrive
          // with the same stale value; re-resolving isn't enough on a fast chain,
          // where a just-mined tx's pending row is reaped before the RPC nonce
          // advances. Bridge that window with an in-memory high-water mark, max'd
          // with the resolved nonce so it re-syncs when the chain moves ahead
          if (this.provider !== null && this.provider !== undefined) {
            const resolved = await this.getNonce('pending');
            reservedNonce =
              previousReservedNonce === undefined
                ? resolved
                : Math.max(resolved, previousReservedNonce + 1);
            tx.nonce = reservedNonce;
            SequentialSigner.reservedNonces.set(this.symbol, reservedNonce);
          }

          if (tx.value !== undefined && tx.value !== null) {
            const [ourBalance, pendingTxsValue] = await Promise.all([
              this.signer.provider!.getBalance(await this.getAddress()),
              PendingEthereumTransactionRepository.getTotalSent(this.symbol),
            ]);

            if (ourBalance - pendingTxsValue < BigInt(tx.value)) {
              throw new Error('insufficient balance');
            }
          }

          const signed = await this.signer.signTransaction(
            await this.addGasLimitBuffer(tx),
          );

          // Persist before releasing the lock so the next caller's nonce
          // resolution sees it; idempotent with broadcastTransaction's write.
          const parsed = Transaction.from(signed);
          await PendingEthereumTransactionRepository.addTransaction(
            parsed.hash!,
            this.symbol,
            parsed.nonce,
            parsed.value,
            parsed.serialized,
          );

          return signed;
        } catch (error) {
          if (
            reservedNonce !== undefined &&
            SequentialSigner.reservedNonces.get(this.symbol) === reservedNonce
          ) {
            if (previousReservedNonce === undefined) {
              SequentialSigner.reservedNonces.delete(this.symbol);
            } else {
              SequentialSigner.reservedNonces.set(
                this.symbol,
                previousReservedNonce,
              );
            }
          }

          throw error;
        }
      },
    );
  };

  private addGasLimitBuffer = async (
    tx: TransactionRequest,
  ): Promise<TransactionRequest> => {
    const provider = this.signer.provider;
    if (provider === null || provider === undefined) {
      throw new Error('missing provider');
    }

    const estimatedGasLimit =
      tx.gasLimit ??
      (await provider.estimateGas({
        ...tx,
        from: tx.from ?? (await this.getAddress()),
      }));

    tx.gasLimit = bumpGasLimit(getBigInt(estimatedGasLimit));
    return tx;
  };
}

export default SequentialSigner;
