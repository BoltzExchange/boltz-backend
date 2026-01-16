import { etherDecimals } from '../../consts/Consts';

type NetworkDetails = {
  name: string;
  identifier: string;
  symbol: string;
  decimals: bigint;
};

const networks = {
  Ethereum: {
    name: 'Ethereum',
    identifier: 'ethereum',
    symbol: 'ETH',
    decimals: etherDecimals,
  },
  Rootstock: {
    name: 'Rootstock',
    identifier: 'rsk',
    symbol: 'RBTC',
    decimals: etherDecimals,
  },
  Arbitrum: {
    name: 'Arbitrum',
    identifier: 'arbitrum',
    symbol: 'ARB',
    decimals: etherDecimals,
  },
};

export { NetworkDetails, networks };
