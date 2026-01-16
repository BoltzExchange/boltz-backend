import { Wallet } from 'ethers';
import Logger from '../../../../lib/Logger';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';

describe('EtherWalletProvider', () => {
  test.each`
    params
    ${networks.Ethereum}
    ${networks.Rootstock}
  `('should init with params for $params.name', ({ params }) => {
    const wallet = new EtherWalletProvider(
      Logger.disabledLogger,
      Wallet.createRandom(),
      params,
    );

    expect(wallet.symbol).toEqual(params.symbol);
    expect(wallet['decimals']).toEqual(params.decimals);
  });
});
