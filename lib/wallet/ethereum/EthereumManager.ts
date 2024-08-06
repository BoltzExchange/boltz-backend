import { ContractABIs } from 'boltz-core';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import {
  Contract,
  Wallet as EthersWallet,
  MaxUint256,
  Signer,
  getAddress,
} from 'ethers';
import { EthereumConfig, RskConfig } from '../../Config';
import Logger from '../../Logger';
import { stringify } from '../../Utils';
import { CurrencyType } from '../../consts/Enums';
import ChainTipRepository from '../../db/repositories/ChainTipRepository';
import Errors from '../Errors';
import Wallet from '../Wallet';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';
import EtherWalletProvider from '../providers/EtherWalletProvider';
import ContractEventHandler from './ContractEventHandler';
import ContractHandler from './ContractHandler';
import EthereumTransactionTracker from './EthereumTransactionTracker';
import { Ethereum, NetworkDetails, Rsk } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';

type Network = {
  name: string;
  chainId: bigint;
};

class EthereumManager {
  private static supportedContractVersions = {
    EtherSwap: 3,
    ERC20Swap: 3,
  };

  public readonly provider: InjectedProvider;

  public readonly contractHandler: ContractHandler;
  public readonly contractEventHandler: ContractEventHandler;

  public etherSwap: EtherSwap;
  public erc20Swap: ERC20Swap;

  public signer!: Signer;
  public address!: string;
  public network!: Network;
  public readonly networkDetails: NetworkDetails;

  public readonly tokenAddresses = new Map<string, string>();

  constructor(
    private readonly logger: Logger,
    isRsk: boolean,
    private readonly config: RskConfig | EthereumConfig,
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
    this.provider = new InjectedProvider(
      this.logger,
      this.networkDetails,
      this.config,
    );

    if (
      this.config.networkName === undefined ||
      this.config.networkName === ''
    ) {
      this.logger.warn(
        `${this.networkDetails.name} network name not configured`,
      );
    }

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

    this.contractHandler = new ContractHandler(this.networkDetails);
    this.contractEventHandler = new ContractEventHandler(this.logger);
  }

  public init = async (mnemonic: string): Promise<Map<string, Wallet>> => {
    await this.provider.init();
    this.logger.info(`Initialized ${this.networkDetails.name} RPC providers`);

    const network = await this.provider.getNetwork();
    this.network = {
      chainId: network.chainId,
      name: this.config.networkName || network.name,
    };

    this.signer = EthersWallet.fromPhrase(mnemonic).connect(this.provider);
    this.address = await this.signer.getAddress();

    this.etherSwap = this.etherSwap.connect(this.signer) as EtherSwap;
    this.erc20Swap = this.erc20Swap.connect(this.signer) as ERC20Swap;

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

    const currentBlock = await this.signer.provider!.getBlockNumber();
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
      this.signer,
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
            const provider = new ERC20WalletProvider(this.logger, this.signer, {
              symbol: token.symbol,
              decimals: token.decimals,
              address: checksumAddress,
              contract: new Contract(
                token.contractAddress,
                ContractABIs.ERC20,
                this.signer,
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
                  this.signer,
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

  public getContractDetails = async () => {
    return {
      network: {
        chainId: Number(this.network.chainId),
        name: this.network.name,
      },
      tokens: this.tokenAddresses,
      swapContracts: new Map<string, string>([
        ['EtherSwap', await this.etherSwap.getAddress()],
        ['ERC20Swap', await this.erc20Swap.getAddress()],
      ]),
    };
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
