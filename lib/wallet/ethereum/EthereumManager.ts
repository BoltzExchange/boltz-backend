import { ContractABIs } from 'boltz-core';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import {
  Contract,
  getAddress,
  MaxUint256,
  Wallet as EthersWallet,
} from 'ethers';
import Errors from '../Errors';
import Wallet from '../Wallet';
import Logger from '../../Logger';
import { stringify } from '../../Utils';
import ContractHandler from './ContractHandler';
import InjectedProvider from './InjectedProvider';
import { CurrencyType } from '../../consts/Enums';
import { EthereumConfig, RskConfig } from '../../Config';
import ContractEventHandler from './ContractEventHandler';
import { Ethereum, NetworkDetails, Rsk } from './EvmNetworks';
import EtherWalletProvider from '../providers/EtherWalletProvider';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';
import EthereumTransactionTracker from './EthereumTransactionTracker';
import ChainTipRepository from '../../db/repositories/ChainTipRepository';

type Network = {
  chainId: bigint;

  // Undefined for networks that are not recognised by Ethers
  name?: string;
};

class EthereumManager {
  private static supportedContractVersions = {
    EtherSwap: 2,
    ERC20Swap: 2,
  };

  public readonly provider: InjectedProvider;

  public readonly contractHandler: ContractHandler;
  public readonly contractEventHandler: ContractEventHandler;

  public etherSwap: EtherSwap;
  public erc20Swap: ERC20Swap;

  public address!: string;
  public network!: Network;
  public readonly networkDetails: NetworkDetails;

  public readonly tokenAddresses = new Map<string, string>();

  private readonly config: RskConfig | EthereumConfig;

  constructor(
    private readonly logger: Logger,
    isRsk: boolean,
    config?: RskConfig | EthereumConfig,
  ) {
    if (
      config === null ||
      config === undefined ||
      [config.etherSwapAddress, config.erc20SwapAddress].some(
        (value) => value === undefined || value === '',
      )
    ) {
      throw Errors.MISSING_SWAP_CONTRACTS();
    }

    this.networkDetails = isRsk ? Rsk : Ethereum;

    this.config = config;
    this.provider = new InjectedProvider(
      this.logger,
      this.networkDetails,
      this.config,
    );

    this.logger.debug(
      `Using ${this.networkDetails.name} EtherSwap contract: ${this.config.etherSwapAddress}`,
    );
    this.logger.debug(
      `Using ${this.networkDetails.name} ERC20Swap contract: ${this.config.erc20SwapAddress}`,
    );

    this.etherSwap = new Contract(
      config.etherSwapAddress,
      ContractABIs.EtherSwap as any,
    ) as any as EtherSwap;

    this.erc20Swap = new Contract(
      config.erc20SwapAddress,
      ContractABIs.ERC20Swap as any,
    ) as any as ERC20Swap;

    this.contractHandler = new ContractHandler(
      this.logger,
      this.networkDetails,
    );
    this.contractEventHandler = new ContractEventHandler(this.logger);
  }

  public init = async (mnemonic: string): Promise<Map<string, Wallet>> => {
    await this.provider.init();
    this.logger.info(`Initialized ${this.networkDetails.name} RPC providers`);

    const network = await this.provider.getNetwork();
    this.network = {
      chainId: network.chainId,
      name: network.name !== 'unknown' ? network.name : undefined,
    };

    const signer = EthersWallet.fromPhrase(mnemonic).connect(this.provider);
    this.address = await signer.getAddress();

    this.etherSwap = this.etherSwap.connect(signer) as EtherSwap;
    this.erc20Swap = this.erc20Swap.connect(signer) as ERC20Swap;

    await Promise.all([
      this.checkContractVersion(
        `${this.networkDetails.name} EtherSwap`,
        this.etherSwap,
        BigInt(EthereumManager.supportedContractVersions.EtherSwap),
      ),
      this.checkContractVersion(
        `${this.networkDetails.name} ERC20Swap`,
        this.erc20Swap,
        BigInt(EthereumManager.supportedContractVersions.ERC20Swap),
      ),
    ]);

    this.logger.verbose(
      `Using ${this.networkDetails.name} signer: ${this.address}`,
    );

    const currentBlock = await signer.provider!.getBlockNumber();
    const chainTip = await ChainTipRepository.findOrCreateTip(
      this.networkDetails.symbol,
      currentBlock,
    );

    this.contractHandler.init(this.provider, this.etherSwap, this.erc20Swap);
    await this.contractEventHandler.init(
      this.networkDetails,
      this.etherSwap,
      this.erc20Swap,
    );

    this.logger.verbose(
      `${this.networkDetails.name} chain status: ${stringify({
        blockNumber: currentBlock,
        chainId: Number(this.network.chainId),
      })}`,
    );

    const transactionTracker = new EthereumTransactionTracker(
      this.logger,
      this.networkDetails,
      this.provider,
      signer,
    );

    await transactionTracker.init();

    await this.provider.on('block', async (blockNumber: number) => {
      this.logger.silly(
        `Got new ${this.networkDetails.name} block: ${blockNumber}`,
      );

      await Promise.all([
        ChainTipRepository.updateTip(chainTip, blockNumber),
        transactionTracker.scanPendingTransactions(),
      ]);
    });

    const wallets = new Map<string, Wallet>();

    for (const token of this.config.tokens) {
      if (token.contractAddress) {
        if (token.decimals) {
          if (!wallets.has(token.symbol)) {
            // Wrap the address in "getAddress" to make sure it is a checksum one
            const checksumAddress = getAddress(token.contractAddress);
            this.tokenAddresses.set(token.symbol, checksumAddress);
            const provider = new ERC20WalletProvider(this.logger, signer, {
              symbol: token.symbol,
              decimals: token.decimals,
              address: checksumAddress,
              contract: new Contract(
                token.contractAddress,
                ContractABIs.ERC20,
                signer,
              ) as any as ERC20,
            });

            wallets.set(
              token.symbol,
              new Wallet(this.logger, CurrencyType.ERC20, provider),
            );

            await this.checkERC20Allowance(provider);
          } else {
            throw Errors.INVALID_ETHEREUM_CONFIGURATION(
              `duplicate ${token.symbol} token config`,
            );
          }
        } else {
          throw Errors.INVALID_ETHEREUM_CONFIGURATION(
            `missing decimals configuration for token: ${token.symbol}`,
          );
        }
      } else {
        if (token.symbol === this.networkDetails.symbol) {
          if (!wallets.has(this.networkDetails.symbol)) {
            wallets.set(
              this.networkDetails.symbol,
              new Wallet(
                this.logger,
                CurrencyType.Ether,
                new EtherWalletProvider(
                  this.logger,
                  signer,
                  this.networkDetails,
                ),
              ),
            );
          } else {
            throw Errors.INVALID_ETHEREUM_CONFIGURATION(
              'duplicate Ether token config',
            );
          }
        } else {
          throw Errors.INVALID_ETHEREUM_CONFIGURATION(
            `missing token contract address for: ${stringify(token)}`,
          );
        }
      }
    }

    return wallets;
  };

  public destroy = async () => {
    await this.provider.removeAllListeners();
  };

  public hasSymbol = (symbol: string): boolean =>
    this.networkDetails.symbol === symbol || this.tokenAddresses.has(symbol);

  private checkERC20Allowance = async (erc20Wallet: ERC20WalletProvider) => {
    const allowance = await erc20Wallet.getAllowance(
      this.config.erc20SwapAddress,
    );

    this.logger.debug(
      `Allowance of ${erc20Wallet.symbol} is ${allowance.toString()}`,
    );

    if (allowance == BigInt(0)) {
      this.logger.verbose(`Setting allowance of ${erc20Wallet.symbol}`);

      const { transactionId } = await erc20Wallet.approve(
        this.config.erc20SwapAddress,
        MaxUint256,
      );

      this.logger.info(
        `Set allowance of token ${erc20Wallet.symbol}: ${transactionId}`,
      );
    }
  };

  private checkContractVersion = async (
    name: string,
    contract: EtherSwap | ERC20Swap,
    supportedVersion: bigint,
  ) => {
    const contractVersion = await contract.version();

    if (contractVersion !== supportedVersion) {
      throw Errors.UNSUPPORTED_CONTRACT_VERSION(
        name,
        await contract.getAddress(),
        contractVersion,
        supportedVersion,
      );
    }
  };
}

export default EthereumManager;
