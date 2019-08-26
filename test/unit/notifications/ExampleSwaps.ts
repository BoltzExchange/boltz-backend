import { SwapUpdateEvent, OrderSide } from '../../../lib/consts/Enums';

export const swapExample = {
  id: '123456',

  fee: 100,
  orderSide: OrderSide.BUY,
  keyIndex: 321,
  minerFee: 306,
  routingFee: 1,
  pair: 'LTC/BTC',
  acceptZeroConf: true,
  onchainAmount: 1000000,
  timeoutBlockHeight: 123,
  status: SwapUpdateEvent.TransactionClaimed,
  lockupAddress: 'bcrt1q4fgsuxk4q0uhmqm4hlhwz2kv4k374f5ta2dqn2',
  lockupTransactionId: '6071400d052ffd911f47537aba80500d52f67077a8522ec6915c128228f71a69',
  // tslint:disable-next-line: max-line-length
  invoice: 'lnbcrt10u1pwd0ll7pp5ulhj6g7cxhsnv7daksah2tcegr7crqrkym5lxl96kxn450wj9p5sdqqcqzpghwrktsemktcs8u367pls8t5htnhvh8l5x00zpu2sjq0lmag5zzw58mf3hfw02zj3ucuw7n52t2cajk7d88wzfh9ydwgtl9yz7gu00fqqzku5uy',
  // tslint:disable-next-line: max-line-length
  redeemScript: 'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
};

export const reverseSwapExample = {
  id: '654321',

  fee: 200,
  orderSide: OrderSide.SELL,
  keyIndex: 321,
  minerFee: 306,
  pair: 'LTC/BTC',
  onchainAmount: 1000000,
  timeoutBlockHeight: 123,
  status: SwapUpdateEvent.InvoiceSettled,
  preimage: '19633406642926291B51625F7E5F61126A',
  transactionId: '6071400d052ffd911f47537aba80500d52f67077a8522ec6915c128228f71a69',
  // tslint:disable-next-line: max-line-length
  invoice: 'lnbcrt20u1pwdsqqppp5dhevzcnd2xrdwuyzv2s342mcwzuukjqlrkwyvyyda66hukkhrhwsdqqcqzpg9y9m249r5m6djquw5jd8klfsehgfpsn3f88hzktcmv6k6p65h2hra9hqj5xrhh27dxktr0wtmn7f8wk4zg2gprnl5zgsas45v7jq5hcqdr8n5a',
  // tslint:disable-next-line: max-line-length
  redeemScript: 'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
};
