import { Transaction } from 'liquidjs-lib';

export interface ZeroConfCheck {
  get name(): string;

  checkTransaction(transaction: Transaction): Promise<boolean>;
}
