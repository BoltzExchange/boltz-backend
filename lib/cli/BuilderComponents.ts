export type BuilderTypes<T extends Record<string, { type: string }>> = {
  [K in keyof T]: any;
};

export type RpcType = {
  rpc: {
    host: string;
    port: number;
    certificates: string;
    'disable-ssl': boolean;
  };
};

export type ApiType = RpcType & {
  api: {
    endpoint: string;
  };
};

export default {
  symbol: {
    describe: 'ticker symbol of the currency',
    type: 'string',
  },
  token: {
    describe: 'whether a token should be claimed',
    type: 'boolean',
  },
  queryStartHeightDelta: {
    describe: 'offset of the start height of the logs query',
    default: '1000',
    type: 'number',
    alias: 'd',
  },
};
