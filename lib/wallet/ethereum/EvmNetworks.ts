import { etherDecimals } from '../../consts/Consts';

type NetworkDetails = {
  name: string;
  symbol: string;
  decimals: bigint;
};

const networks = {
  Ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: etherDecimals,
  },
  Rootstock: {
    name: 'Rootstock',
    symbol: 'RBTC',
    decimals: etherDecimals,
  },
  Arbitrum: {
    name: 'Arbitrum',
    symbol: 'ARB',
    decimals: etherDecimals,
  },
};

export { NetworkDetails, networks };
