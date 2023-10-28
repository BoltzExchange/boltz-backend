import { Wallet } from 'ethers';
import Logger from '../../../../lib/Logger';
import { Ethereum, Rsk } from '../../../../lib/wallet/ethereum/EvmNetworks';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';

describe('EtherWalletProvider', () => {
  test.each`
    params
    ${Ethereum}
    ${Rsk}
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
