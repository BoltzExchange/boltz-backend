export default {
  currency: {
    describe: 'ticker symbol of the currency',
    type: 'string',
  },
  base_currency: {
    describe: 'base currency of the order',
    type: 'string',
  },
  quote_currency: {
    describe: 'quote currency of the order',
    type: 'string',
  },
  orderSide: {
    describe: 'whether the order is a buy or sell one',
    type: 'string',
    choices: ['buy', 'sell'],
  },
  rate: {
    describe: 'conversion rate of base and quote currency',
    type: 'number',
  },
  outputType: {
    describe: 'type of the output',
    type: 'string',
    choices: ['bech32', 'compatibility', 'legacy'],
    default: 'compatibility',
  },
  network: {
    describe: 'network on which the transaction will be used',
    type: 'string',
  },
  lockupTransaction: {
    describe: 'hex encoded lockup transaction',
    type: 'string',
  },
  redeemScript: {
    describe: 'hex encoded redeem script of the swap output',
    type: 'string',
  },
  destinationAddress: {
    describe: 'address to which the claimed funds should be sent',
    type: 'string',
  },
  feePerByte: {
    describe: 'amount of satoshis per vbyte that should be paid as fee',
    type: 'number',
    default: 2,
  },
  timeoutBlockNumber: {
    describe: 'after how my blocks the onchain script of the swap should time out',
    type: 'number',
    default: '10',
  },
};
