import { OrderSide } from '../../../lib/consts/Enums';

export const createSwap = <T>(isSwap: boolean, isBuy: boolean, params: any): T => {
  return {
    ...params,
    fee: 1000,
    pair: 'LTC/BTC',
    minerFee: 10000,
    routingFee: isSwap ? 1 : 0,
    orderSide: isBuy ? OrderSide.BUY : OrderSide.SELL,
  } as any as T;
};
