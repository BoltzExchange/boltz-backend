import { OrderSide } from '../../../lib/consts/Enums';

export const createSwap = <T>(isSwap: boolean, isBuy: boolean, params: Record<string, unknown>): T => {
  return {
    ...params,
    fee: 1000,
    pair: 'LTC/BTC',
    minerFee: 10000,
    routingFee: isSwap ? 1 : 0,
    orderSide: isBuy ? OrderSide.BUY : OrderSide.SELL,
    createdAt: new Date('2020-11-10 21:45:57.690 +00:00')
  } as any as T;
};
