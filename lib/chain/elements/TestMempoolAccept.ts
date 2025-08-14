import type { Transaction } from 'liquidjs-lib';
import type Logger from '../../Logger';
import { sleep } from '../../PromiseUtils';
import { liquidSymbol } from '../../consts/LiquidTypes';
import type ElementsClient from '../ElementsClient';
import type { ZeroConfCheck } from './ZeroConfCheck';

class TestMempoolAccept implements ZeroConfCheck {
  private static readonly zeroConfCheckTimeDefault = 1_000;
  private static readonly zeroConfCheckAllowedErrors = [
    'min relay fee not met',
    'txn-already-in-mempool',
  ];

  private readonly zeroConfCheckTime: number;

  constructor(
    private readonly logger: Logger,
    private readonly isRegtest: boolean,
    private readonly publicClient: ElementsClient,
    zeroConfWaitTime?: number,
  ) {
    this.zeroConfCheckTime =
      zeroConfWaitTime || TestMempoolAccept.zeroConfCheckTimeDefault;
    this.logger.info(
      `Waiting ${this.zeroConfCheckTime}ms before accepting ${liquidSymbol} transactions`,
    );
  }

  public get name(): string {
    return 'Test mempool acceptance';
  }

  public init = async (): Promise<void> => {
    if (this.isRegtest) {
      this.logger.warn(
        'Elements chain is regtest; skipping 0-conf mempool acceptance check',
      );
    }
  };

  public checkTransaction = async (
    transaction: Transaction,
  ): Promise<boolean> => {
    if (this.isRegtest) {
      return true;
    }

    this.logger.debug(
      `Waiting before accepting 0-conf transaction of ${liquidSymbol}: ${transaction.getId()}`,
    );
    await sleep(this.zeroConfCheckTime);

    const testResult = (
      await this.publicClient.testMempoolAccept([transaction.toHex()])
    )[0];

    if (
      testResult['reject-reason'] !== undefined &&
      !TestMempoolAccept.zeroConfCheckAllowedErrors.includes(
        testResult['reject-reason'],
      )
    ) {
      this.logger.warn(
        `Rejected ${liquidSymbol} 0-conf transaction (${transaction.getId()}): ${testResult['reject-reason']}`,
      );
      return false;
    }

    return true;
  };
}

export default TestMempoolAccept;
