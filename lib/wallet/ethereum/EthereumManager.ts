import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { constants, Contract, providers, Signer, Wallet as EthersWallet } from 'ethers';
import Errors from '../Errors';
import Wallet from '../Wallet';
import Logger from '../../Logger';
import { stringify } from '../../Utils';
import { EthereumConfig } from '../../Config';
import ContractHandler from './ContractHandler';
import ContractEventHandler from './ContractEventHandler';
import ChainTipRepository from '../../db/ChainTipRepository';
import EtherWalletProvider from '../providers/EtherWalletProvider';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';

class EthereumManager {
  public contractHandler: ContractHandler;
  public contractEventHandler: ContractEventHandler;

  private readonly signer: Signer;

  constructor(
    private logger: Logger,
    private mnemonic: string,
    private ethereumConfig: EthereumConfig,
  ) {
    if (this.ethereumConfig.etherSwapAddress === '' || this.ethereumConfig.erc20SwapAddress === '') {
      throw Errors.MISSING_SWAP_CONTRACTS();
    }

    this.logger.verbose(`Connecting to web3 provider: ${this.ethereumConfig.providerEndpoint}`);

    const provider = new providers.WebSocketProvider(this.ethereumConfig.providerEndpoint);
    this.signer = EthersWallet.fromMnemonic(this.mnemonic).connect(provider);

    this.logger.debug(`Using Ether Swap contract: ${this.ethereumConfig.etherSwapAddress}`);
    this.logger.debug(`Using ERC20 Swap contract: ${this.ethereumConfig.erc20SwapAddress}`);

    const etherSwap = new Contract(
      ethereumConfig.etherSwapAddress,
      ContractABIs.EtherSwap as any,
      this.signer,
    ) as any as EtherSwap;

    const erc20Swap = new Contract(
      ethereumConfig.erc20SwapAddress,
      ContractABIs.ERC20Swap as any,
      this.signer,
    ) as any as Erc20Swap;

    this.contractHandler = new ContractHandler(
      this.logger,
      etherSwap,
      erc20Swap,
    );

    this.contractEventHandler = new ContractEventHandler(
      this.logger,
      etherSwap,
      erc20Swap,
    );
  }

  public init = async (chainTipRepository: ChainTipRepository): Promise<Map<string, Wallet>> => {
    this.logger.verbose(`Using web3 signer ${await this.signer.getAddress()}`);

    const currentBlock = await this.signer.provider!.getBlockNumber();
    const chainTip = await chainTipRepository.findOrCreateTip('ETH', currentBlock);

    this.logger.verbose(`Ethereum chain status: ${stringify({
      chainId: await this.signer.getChainId(),
      blockNumber: currentBlock,
    })}`);

    this.signer.provider!.on('block', async (height) => {
      await chainTipRepository.updateTip(chainTip, height);
    });

    const wallets = new Map<string, Wallet>();

    for (const token of this.ethereumConfig.tokens) {
      if (token.contractAddress) {
        if (token.decimals) {
          if (!wallets.has(token.symbol)) {
            const provider = new ERC20WalletProvider(this.logger, this.signer, {
              symbol: token.symbol,
              decimals: token.decimals,
              contract: new Contract(token.contractAddress, ContractABIs.IERC20, this.signer) as Ierc20,
            });

            wallets.set(token.symbol, new Wallet(
              this.logger,
              provider,
            ));

            await this.checkERC20Allowance(provider);
          } else {
            throw Errors.INVALID_ETHEREUM_CONFIGURATION(`duplicate ${token.symbol} token config`);
          }
        } else {
          throw Errors.INVALID_ETHEREUM_CONFIGURATION(`missing decimals configuration for token: ${token.symbol}`);
        }
      } else {
        if (token.symbol === 'ETH') {
          if (!wallets.has('ETH')) {
            wallets.set('ETH', new Wallet(
              this.logger,
              new EtherWalletProvider(this.logger, this.signer),
            ));
          } else {
            throw Errors.INVALID_ETHEREUM_CONFIGURATION('duplicate Ether token config');
          }
        } else {
          throw Errors.INVALID_ETHEREUM_CONFIGURATION(`missing token contract address for: ${stringify(token)}`);
        }
      }
    }

    return wallets;
  }

  private checkERC20Allowance = async (erc20Wallet: ERC20WalletProvider) => {
    const allowance = await erc20Wallet.getAllowance(this.ethereumConfig.etherSwapAddress);

    this.logger.debug(`Allowance of ${erc20Wallet.symbol} is ${allowance.toString()}`);

    if (allowance.isZero()) {
      this.logger.verbose(`Setting allowance of ${erc20Wallet.symbol}`);

      const { transactionId } = await erc20Wallet.approve(
        this.ethereumConfig.etherSwapAddress,
        constants.MaxUint256,
      );

      this.logger.info(`Set allowance of token ${erc20Wallet.symbol}: ${transactionId}`);
    }
  }
}

export default EthereumManager;
