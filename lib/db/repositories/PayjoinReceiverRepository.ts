import { Transaction } from 'bitcoinjs-lib';
import { QueryTypes } from 'sequelize';
import Database from '../Database';

export enum PayjoinLockupMatch {
  NoSession = 'noSession',
  Pending = 'pending',
  Success = 'success',
  TxMismatch = 'txMismatch',
  Failed = 'failed',
}

type PayjoinReceiverSessionRow = {
  id: number;
};

type PayjoinReceiverSessionEventRow = {
  eventData: string;
};

type SerializedTransaction = {
  version: number;
  lock_time: number;
  input: {
    previous_output: string;
    script_sig: string;
    sequence: number;
  }[];
  output: {
    value: number;
    script_pubkey: string;
  }[];
};

type SerializedPsbt = {
  unsigned_tx: SerializedTransaction;
};

class PayjoinReceiverRepository {
  public static isPayjoinConsolidationLockup = async (
    swapId: string,
    txId: string,
    actualAmount: number,
    expectedAmount: number,
  ): Promise<PayjoinLockupMatch> => {
    const session = await this.getBySwapId(swapId);
    if (session === undefined) {
      return PayjoinLockupMatch.NoSession;
    }

    const events = await this.getEvents(session.id);
    const closedOutcome = this.getClosedOutcome(events);
    if (closedOutcome === undefined) {
      return PayjoinLockupMatch.Pending;
    }

    if (closedOutcome !== 'Success') {
      return PayjoinLockupMatch.Failed;
    }

    const expectedTransactionId =
      this.getFinalizedProposalTransactionId(events);
    if (expectedTransactionId !== txId) {
      return PayjoinLockupMatch.TxMismatch;
    }

    return actualAmount > expectedAmount
      ? PayjoinLockupMatch.Success
      : PayjoinLockupMatch.TxMismatch;
  };

  private static getBySwapId = async (
    swapId: string,
  ): Promise<PayjoinReceiverSessionRow | undefined> => {
    try {
      const rows = await Database.sequelize.query<PayjoinReceiverSessionRow>(
        'SELECT id FROM "payjoinReceiverSessions" WHERE "swapId" = $1 LIMIT 1',
        {
          bind: [swapId],
          type: QueryTypes.SELECT,
        },
      );

      return rows[0];
    } catch {
      return undefined;
    }
  };

  private static getEvents = async (
    sessionId: number,
  ): Promise<PayjoinReceiverSessionEventRow[]> => {
    return Database.sequelize.query<PayjoinReceiverSessionEventRow>(
      'SELECT "eventData" FROM "payjoinReceiverSessionEvents" WHERE "sessionId" = $1 ORDER BY id ASC',
      {
        bind: [sessionId],
        type: QueryTypes.SELECT,
      },
    );
  };

  private static getClosedOutcome = (
    events: PayjoinReceiverSessionEventRow[],
  ): string | undefined => {
    const closed = this.findLastEvent(events, 'Closed')?.Closed;

    if (closed === undefined) {
      return undefined;
    }

    if (typeof closed === 'string') {
      return closed;
    }

    if (closed.Success !== undefined) {
      return 'Success';
    }

    return Object.keys(closed)[0];
  };

  private static getFinalizedProposalTransactionId = (
    events: PayjoinReceiverSessionEventRow[],
  ): string | undefined => {
    const finalizedProposal = this.findLastEvent(
      events,
      'FinalizedProposal',
    )?.FinalizedProposal;

    if (!this.isSerializedPsbt(finalizedProposal)) {
      return undefined;
    }

    try {
      return this.getSerializedTransactionId(finalizedProposal.unsigned_tx);
    } catch {
      return undefined;
    }
  };

  private static getSerializedTransactionId = (
    unsignedTx: SerializedTransaction,
  ): string => {
    const tx = new Transaction();
    tx.version = unsignedTx.version;
    tx.locktime = unsignedTx.lock_time;

    for (const input of unsignedTx.input) {
      const [txId, vout] = input.previous_output.split(':');
      tx.addInput(
        Buffer.from(txId, 'hex').reverse(),
        Number(vout),
        input.sequence,
        Buffer.from(input.script_sig, 'hex'),
      );
    }

    for (const output of unsignedTx.output) {
      tx.addOutput(Buffer.from(output.script_pubkey, 'hex'), output.value);
    }

    return tx.getId();
  };

  private static isSerializedPsbt = (psbt: unknown): psbt is SerializedPsbt => {
    return (
      typeof psbt === 'object' &&
      psbt !== null &&
      'unsigned_tx' in psbt &&
      this.isSerializedTransaction(psbt.unsigned_tx)
    );
  };

  private static isSerializedTransaction = (
    tx: unknown,
  ): tx is SerializedTransaction => {
    if (typeof tx !== 'object' || tx === null) {
      return false;
    }

    const candidate = tx as SerializedTransaction;
    return (
      typeof candidate.version === 'number' &&
      typeof candidate.lock_time === 'number' &&
      Array.isArray(candidate.input) &&
      Array.isArray(candidate.output)
    );
  };

  private static parseEvent = (eventData: string): any | undefined => {
    try {
      return JSON.parse(eventData);
    } catch {
      return undefined;
    }
  };

  private static findLastEvent = (
    events: PayjoinReceiverSessionEventRow[],
    eventName: string,
  ): any | undefined => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = this.parseEvent(events[i].eventData);
      if (event?.[eventName] !== undefined) {
        return event;
      }
    }

    return undefined;
  };
}

export default PayjoinReceiverRepository;
