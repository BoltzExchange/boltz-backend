import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { constants, Contract, providers, Wallet as EthersWallet } from 'ethers';
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
  public provider: providers.Provider;

  public contractHandler: ContractHandler;
  public contractEventHandler: ContractEventHandler;

  public etherSwap: EtherSwap;
  public erc20Swap: Erc20Swap;

  public address?: string;

  private static supportedContractVersions = {
    'EtherSwap': 1,
    'ERC20Swap': 1,
  };

  constructor(
    private logger: Logger,
    private ethereumConfig: EthereumConfig,
  ) {
    if (this.ethereumConfig.etherSwapAddress === '' || this.ethereumConfig.erc20SwapAddress === '') {
      throw Errors.MISSING_SWAP_CONTRACTS();
    }

    this.logger.verbose(`Connecting to web3 provider: ${this.ethereumConfig.providerEndpoint}`);

    this.provider = new providers.WebSocketProvider(this.ethereumConfig.providerEndpoint);

    this.logger.debug(`Using Ether Swap contract: ${this.ethereumConfig.etherSwapAddress}`);
    this.logger.debug(`Using ERC20 Swap contract: ${this.ethereumConfig.erc20SwapAddress}`);

    this.etherSwap = new Contract(
      ethereumConfig.etherSwapAddress,
      ContractABIs.EtherSwap as any,
    ) as any as EtherSwap;

    this.erc20Swap = new Contract(
      ethereumConfig.erc20SwapAddress,
      ContractABIs.ERC20Swap as any,
    ) as any as Erc20Swap;

    this.contractHandler = new ContractHandler(this.logger);
    this.contractEventHandler = new ContractEventHandler(this.logger);
  }

  public init = async (mnemonic: string, chainTipRepository: ChainTipRepository): Promise<Map<string, Wallet>> => {
    const signer = EthersWallet.fromMnemonic(mnemonic).connect(this.provider);
    this.address = await signer.getAddress();

    this.etherSwap = this.etherSwap.connect(signer);
    this.erc20Swap = this.erc20Swap.connect(signer);

    await Promise.all([
      this.checkContractVersion('EtherSwap', this.etherSwap, EthereumManager.supportedContractVersions.EtherSwap),
      this.checkContractVersion('ERC20Swap', this.erc20Swap, EthereumManager.supportedContractVersions.ERC20Swap),
    ]);

    this.logger.verbose(`Using web3 signer ${this.address}`);

    const currentBlock = await signer.provider!.getBlockNumber();
    const chainTip = await chainTipRepository.findOrCreateTip('ETH', currentBlock);

    this.contractHandler.init(this.etherSwap, this.erc20Swap);
    this.contractEventHandler.init(this.etherSwap, this.erc20Swap);

    // No need to rescan in case the current block was scanned already
    if (chainTip.height !== currentBlock) {
      // TODO: do this later; after SwapNursery was initialized
      await this.contractEventHandler.rescan(chainTip.height);
    }

    this.logger.verbose(`Ethereum chain status: ${stringify({
      chainId: await signer.getChainId(),
      blockNumber: currentBlock,
    })}`);

    this.provider.on('block', async (height) => {
      await chainTipRepository.updateTip(chainTip, height);
    });

    const wallets = new Map<string, Wallet>();

    for (const token of this.ethereumConfig.tokens) {
      if (token.contractAddress) {
        if (token.decimals) {
          if (!wallets.has(token.symbol)) {
            const provider = new ERC20WalletProvider(this.logger, signer, {
              symbol: token.symbol,
              decimals: token.decimals,
              contract: new Contract(token.contractAddress, ContractABIs.IERC20, signer) as Ierc20,
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
              new EtherWalletProvider(this.logger, signer),
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
    const allowance = await erc20Wallet.getAllowance(this.ethereumConfig.erc20SwapAddress);

    this.logger.debug(`Allowance of ${erc20Wallet.symbol} is ${allowance.toString()}`);

    if (allowance.isZero()) {
      this.logger.verbose(`Setting allowance of ${erc20Wallet.symbol}`);

      const { transactionId } = await erc20Wallet.approve(
        this.ethereumConfig.erc20SwapAddress,
        constants.MaxUint256,
      );

      this.logger.info(`Set allowance of token ${erc20Wallet.symbol }: ${transactionId}`);
    }
  }

  private checkContractVersion = async (name: string, contract: EtherSwap | Erc20Swap, supportedVersion: number) => {
    const contractVersion = await contract.version();

    if (contractVersion !== supportedVersion) {
      throw Errors.UNSUPPORTED_CONTRACT_VERSION(name, contract.address, contractVersion, supportedVersion);
    }
  }
}

export default EthereumManager;
