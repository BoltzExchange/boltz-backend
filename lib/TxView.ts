import { Transaction as ScureTransaction } from '@scure/btc-signer';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';

const rbfFlag = 0xffffffff - 1;

export type ConstructedTransaction = ScureTransaction | LiquidTransaction;

export type TxInputView = {
  txid: string;
  index: number;
  sequence?: number;
  witness?: Uint8Array[];
};

export type TxOutputView = {
  script: Buffer;
  amount?: bigint;
};

const reverseBuffer = (buf: Uint8Array): Uint8Array => {
  const out = new Uint8Array(buf.length);
  for (let i = 0, j = buf.length - 1; i <= j; i++, j--) {
    out[i] = buf[j];
    out[j] = buf[i];
  }
  return out;
};

/**
 * Uniform view over scure Bitcoin and liquidjs Liquid transactions. Hides the
 * library split behind a single accessor surface so call sites stop branching
 * on `instanceof`.
 */
export class TxView {
  private inputsMemo?: TxInputView[];
  private outputsMemo?: TxOutputView[];

  private constructor(public readonly raw: ConstructedTransaction) {}

  public static of = (tx: ConstructedTransaction): TxView => {
    return new TxView(tx);
  };

  public static isScure = (
    tx: ConstructedTransaction,
  ): tx is ScureTransaction => {
    return tx instanceof ScureTransaction;
  };

  public get id(): string {
    return this.raw instanceof ScureTransaction
      ? this.raw.id
      : this.raw.getId();
  }

  public get hex(): string {
    return this.raw instanceof ScureTransaction
      ? this.raw.hex
      : this.raw.toHex();
  }

  public get bytes(): Buffer {
    return this.raw instanceof ScureTransaction
      ? Buffer.from(this.raw.toBytes(true, true))
      : this.raw.toBuffer();
  }

  public vsize(discountCT = true): number {
    return this.raw instanceof ScureTransaction
      ? this.raw.vsize
      : this.raw.virtualSize(discountCT);
  }

  public get inputs(): TxInputView[] {
    return (this.inputsMemo ??= this.computeInputs());
  }

  public get outputs(): TxOutputView[] {
    return (this.outputsMemo ??= this.computeOutputs());
  }

  public signalsRbfExplicitly = (): boolean => {
    return this.inputs.some((i) => (i.sequence ?? 0xffffffff) < rbfFlag);
  };

  private computeInputs = (): TxInputView[] => {
    if (this.raw instanceof ScureTransaction) {
      const out: TxInputView[] = [];
      for (let i = 0; i < this.raw.inputsLength; i++) {
        const input = this.raw.getInput(i);
        out.push({
          txid: Buffer.from(input.txid!).toString('hex'),
          index: input.index!,
          sequence: input.sequence ?? undefined,
          witness: input.finalScriptWitness,
        });
      }
      return out;
    }

    return this.raw.ins.map((input) => ({
      txid: Buffer.from(reverseBuffer(input.hash)).toString('hex'),
      index: input.index,
      sequence: input.sequence,
      witness: input.witness,
    }));
  };

  private computeOutputs(): TxOutputView[] {
    if (this.raw instanceof ScureTransaction) {
      const out: TxOutputView[] = [];
      for (let i = 0; i < this.raw.outputsLength; i++) {
        const o = this.raw.getOutput(i);
        out.push({
          script: Buffer.from(o.script ?? new Uint8Array()),
          amount: o.amount,
        });
      }
      return out;
    }

    return this.raw.outs.map((o) => ({
      script: o.script,
      amount: typeof o.value === 'bigint' ? o.value : undefined,
    }));
  }
}
