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
  payjoinTxId?: string;
};

type PayjoinReceiverSessionEventRow = {
  eventData: string;
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

    if (session.payjoinTxId !== txId) {
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
        'SELECT id, "payjoinTxId" FROM "payjoinReceiverSessions" WHERE "swapId" = $1 LIMIT 1',
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
