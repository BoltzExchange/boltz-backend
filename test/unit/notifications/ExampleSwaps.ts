/* tslint:disable:max-line-length */

import { SwapType } from '../../../lib/db/models/Swap';
import { ReverseSwapType } from '../../../lib/db/models/ReverseSwap';
import { SwapUpdateEvent, OrderSide } from '../../../lib/consts/Enums';
import { ChainToChainSwapType } from '../../../lib/db/models/ChainToChainSwap';

export const swapExample: SwapType = {
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
  invoice: 'lnbcrt10u1pwd0ll7pp5ulhj6g7cxhsnv7daksah2tcegr7crqrkym5lxl96kxn450wj9p5sdqqcqzpghwrktsemktcs8u367pls8t5htnhvh8l5x00zpu2sjq0lmag5zzw58mf3hfw02zj3ucuw7n52t2cajk7d88wzfh9ydwgtl9yz7gu00fqqzku5uy',
  redeemScript: 'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
};

export const pendingSwapExample = {
  ...swapExample,

  id : '654321',
  status: undefined,
  invoice: 'lnbcrt1pwhzymjpp5caehd2n8nzlem65a3vh35zq4z35a8q3l4j3z6v4vdncq5fpxrpcqdqqcqzpgq0tmq4yztsu25983latgnlqw5e2r20ysc98k8gljukp5tcy0k85rdgg820udupmdsnkyxxua5ptl3yaets9h5xaxn7futp4m6g90l9gqkr06ct',
};

export const reverseSwapExample: ReverseSwapType = {
  id: 'r123456',

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
  invoice: 'lnbcrt20u1pwdsqqppp5dhevzcnd2xrdwuyzv2s342mcwzuukjqlrkwyvyyda66hukkhrhwsdqqcqzpg9y9m249r5m6djquw5jd8klfsehgfpsn3f88hzktcmv6k6p65h2hra9hqj5xrhh27dxktr0wtmn7f8wk4zg2gprnl5zgsas45v7jq5hcqdr8n5a',
  redeemScript: 'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
};

export const pendingReverseSwapExample = {
  ...reverseSwapExample,

  id: 'r654321',
  status: SwapUpdateEvent.TransactionMempool,
};

export const chainToChainSwapExample: ChainToChainSwapType = {
  id: 'c123456',

  fee: 157406,
  pair: 'LTC/BTC',
  acceptZeroConf: true,
  orderSide: OrderSide.SELL,
  status: SwapUpdateEvent.TransactionClaimed,
  preimage: '32419b92dd1968a7bbab7169ac3ff77eaa410547576c46a79e5f064cecaad364',
  preimageHash: '53e791302582a6de647ec2202cd90e214a8fd11ffee9500923740e5bff4876c7',

  sendingKeyIndex: 5,
  sendingMinerFee: 123,
  sendingAmount: 100000,
  sendingTimeoutBlockHeight: 380,
  sendingLockupAddress: 'bcrt1q9a8hyrnu4cxh996tlfqz4hc9q3pcn0ypls6swuc7gvz7a5zp0chqpeqzaw',
  sendingTransactionId: '86b4d85e171c31daab6cabb72fed2c33d47dbb2ec4266d4e874b55e2ea6d7758',
  sendingRedeemScript: 'a914e4aad091665e7aea7df77c8ba493bb2fac1baf1787632102ec1bbd8d6980ea3186cf0b43d641a527a41e450ae73d5528dbe49035cc8fd9ca67027c01b1752103297c64dab072b0673ed4ef4ae03d8945c5e10b37f2847360507c066bd9bc869168ac',

  receivingKeyIndex: 420,
  receivingAmount: 16380003,
  receivingMinerFee: 123132,
  receivingTimeoutBlockHeight: 118,
  receivingLockupAddress: 'QgqZzFNN9grsDSJUGswae88DXwUCrn75CW',
  receivingTransactionId: 'e204e75cd7a2dd777fa9a67d611685c900825dd212c442f9c6db0262fb84274c',
  receivingRedeemScript: 'a914e4aad091665e7aea7df77c8ba493bb2fac1baf1787632102f1280120e207f5cd9906766876b1b0fc1b4d1acdfd78f6268c02dee52e1b8e8a670176b1752102ec1bbd8d6980ea3186cf0b43d641a527a41e450ae73d5528dbe49035cc8fd9ca68ac',
};
