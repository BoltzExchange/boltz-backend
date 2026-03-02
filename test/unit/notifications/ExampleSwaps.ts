import {
  OrderSide,
  SwapType as SwapTypeEnum,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import type { ReverseSwapType } from '../../../lib/db/models/ReverseSwap';
import type { SwapType } from '../../../lib/db/models/Swap';

export const swapExample = {
  id: '123456',
  version: SwapVersion.Legacy,
  type: SwapTypeEnum.Submarine,

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
  lockupTransactionId:
    '6071400d052ffd911f47537aba80500d52f67077a8522ec6915c128228f71a69',
  preimageHash:
    'e7ef2d23d835e13679bdb43b752f1940fd81807626e9f37cbab1a75a3dd22869',
  invoice:
    'lnbcrt10u1pwd0ll7pp5ulhj6g7cxhsnv7daksah2tcegr7crqrkym5lxl96kxn450wj9p5sdqqcqzpghwrktsemktcs8u367pls8t5htnhvh8l5x00zpu2sjq0lmag5zzw58mf3hfw02zj3ucuw7n52t2cajk7d88wzfh9ydwgtl9yz7gu00fqqzku5uy',
  redeemScript:
    'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
  createdRefundSignature: false,
} as SwapType;

export const pendingSwapExample: SwapType = {
  ...swapExample,

  id: '654321',
  status: SwapUpdateEvent.SwapCreated,
  preimageHash:
    'c77376aa6798bf9dea9d8b2f1a08151469d3823faca22d32ac6cf00a24261870',
  invoice:
    'lnbcrt1pwhzymjpp5caehd2n8nzlem65a3vh35zq4z35a8q3l4j3z6v4vdncq5fpxrpcqdqqcqzpgq0tmq4yztsu25983latgnlqw5e2r20ysc98k8gljukp5tcy0k85rdgg820udupmdsnkyxxua5ptl3yaets9h5xaxn7futp4m6g90l9gqkr06ct',
};

export const reverseSwapExample = {
  id: 'r123456',
  version: SwapVersion.Legacy,
  type: SwapTypeEnum.ReverseSubmarine,

  fee: 200,
  nodeId: 'lnd-1',
  orderSide: OrderSide.SELL,
  keyIndex: 321,
  minerFee: 306,
  pair: 'LTC/BTC',
  onchainAmount: 1000000,
  timeoutBlockHeight: 123,
  status: SwapUpdateEvent.InvoiceSettled,
  preimage: 'c236e38c7bf8eb92fac587c0d4f08b3e787f04f501d68e32e5f510027badbfd4',
  preimageHash:
    'efbe6a29b1db7dc2f3d86c35b52a639994f1543e0833b45553493868f77c715f',
  lockupAddress: '2Mv9up2W4ADfj4Dm9EtfCCPSwgfwTp8Sy99',
  transactionId:
    '6071400d052ffd911f47537aba80500d52f67077a8522ec6915c128228f71a69',
  invoice:
    'lnbcrt20u1pwdsqqppp5dhevzcnd2xrdwuyzv2s342mcwzuukjqlrkwyvyyda66hukkhrhwsdqqcqzpg9y9m249r5m6djquw5jd8klfsehgfpsn3f88hzktcmv6k6p65h2hra9hqj5xrhh27dxktr0wtmn7f8wk4zg2gprnl5zgsas45v7jq5hcqdr8n5a',
  invoiceAmount: 2,
  redeemScript:
    'a9140e8ff7435f5e0c9b7b82c5a8b8c0e225f55f956187632103e1afb0000fc8acf1af59792f35d45f74a9b20784321bdfdc6daa54e72784ae046702a300b1752103533d4307acfa023c7870c1f3c981e3973a18d43458857f201288c19967e9763568ac',
} as ReverseSwapType;

export const pendingReverseSwapExample = {
  ...reverseSwapExample,

  id: 'r654321',
  status: SwapUpdateEvent.TransactionMempool,

  preimage: 'f4f7f03f72f1c3885bb869363054ce2c88d270bf9bf6e2c4cb6a87a1928ff394',
  preimageHash:
    '5b2dc635c50a25de79b86be956db2fbc6a17e36d2562f1185aca3522a5a9edf6',
  invoice:
    'lnbcrt1p0xqpt2pp5l34c2393chx7eut4hvlt6h0333nfa562quksdqnx8ymd437dw5msdqqcqzpgsp5f88p6pf23hrn5l7j5sp0q26vtdzzfr838njchzc3lfp6xq2nnj0q9qy9qsq33agd2syjgxjkf6mshm5x482hsu99k2ukrv27wvgtatyzw0lgs83pc0yd3fmwgcn5kcav47h4483qqz9yh4w0vegzlq3cv7zcxssm2sp7l2rck',
};
