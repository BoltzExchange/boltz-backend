import { Transaction } from 'liquidjs-lib';

export interface ZeroConfCheck {
  get name(): string;

  init(): Promise<void>;
  checkTransaction(transaction: Transaction): Promise<boolean>;
}
