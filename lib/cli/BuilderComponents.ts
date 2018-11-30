export default {
  currency: {
    describe: 'ticker symbol of the currency',
    type: 'string',
  },
  pairId: {
    describe: 'traiding pair id of the order',
    type: 'string',
  },
  orderSide: {
    describe: 'whether the order is a buy or sell one',
    type: 'string',
    choices: ['buy', 'sell'],
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
    detauls: '1',
  },
};
