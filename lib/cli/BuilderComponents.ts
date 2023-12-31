export default {
  network: {
    describe: 'network on which the should be broadcast',
    type: 'string',
  },
  privateKey: {
    describe: 'private key of the key pair',
    type: 'string',
  },
  redeemScript: {
    describe: 'redeem script of the swap',
    type: 'string',
  },
  rawTransaction: {
    describe: 'raw lockup transaction',
    type: 'string',
  },
  destinationAddress: {
    describe: 'address to which the coins should be claimed',
    type: 'string',
  },
  symbol: {
    describe: 'ticker symbol of the currency',
    type: 'string',
  },
  token: {
    describe: 'whether a token should be claimed',
    type: 'boolean',
  },
  feePerVbyte: {
    describe: 'fee per vByte',
    default: 2,
    type: 'number',
  },
  blindingKey: {
    describe: 'Liquid blinding key for the HTLC address',
    type: 'string',
  },
  queryStartHeightDelta: {
    describe: 'offset of the start height of the logs query',
    default: '1000',
    type: 'number',
    alias: 'd',
  },
  swapId: {
    describe: 'id of the Swap',
    type: 'string',
  },
  swapTree: {
    describe: 'SwapTree of the Swap',
    type: 'string',
  },
};
