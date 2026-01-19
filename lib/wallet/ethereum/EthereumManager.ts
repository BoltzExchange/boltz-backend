import { ContractABIs } from 'boltz-core/dist/lib/ABIs';
import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { Signer } from 'ethers';
import {
  Contract,
  Wallet as EthersWallet,
  MaxUint256,
  Transaction,
  getAddress,
} from 'ethers';
import type { ArbitrumConfig, EthereumConfig } from '../../Config';
import type Logger from '../../Logger';
import { formatError, stringify } from '../../Utils';
import { CurrencyType } from '../../consts/Enums';
import ChainTipRepository from '../../db/repositories/ChainTipRepository';
import Errors from '../Errors';
import Wallet from '../Wallet';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';
import EtherWalletProvider from '../providers/EtherWalletProvider';
import ArbitrumProvider from './ArbitrumProvider';
import ConsolidatedEventHandler from './ConsolidatedEventHandler';
import EthereumTransactionTracker from './EthereumTransactionTracker';
import { type NetworkDetails, networks } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';
import SequentialSigner from './SequentialSigner';
import Contracts from './contracts/Contracts';

type Network = {
  name: string;
  chainId: bigint;
};

export type ContractAddresses = {
  EtherSwap: string;
  ERC20Swap: string;
};

class EthereumManager {
  public readonly provider: InjectedProvider;
  public readonly contractEventHandler = new ConsolidatedEventHandler();

  public signer!: Signer;
  public address!: string;
  public network!: Network;

  public readonly tokenAddresses = new Map<string, string>();

  private contracts: Contracts[] = [];

  constructor(
    private readonly logger: Logger,
    public readonly networkDetails: NetworkDetails,
    private readonly config: EthereumConfig | ArbitrumConfig,
  ) {
    if (
      config === null ||
      config === undefined ||
      config.contracts === undefined ||
      config.contracts.length === 0
    ) {
      throw Errors.MISSING_SWAP_CONTRACTS();
    }

    if (networkDetails.identifier === networks.Arbitrum.identifier) {
      this.provider = new ArbitrumProvider(
        this.logger,
        this.networkDetails,
        this.config as ArbitrumConfig,
      );
    } else {
      this.provider = new InjectedProvider(
        this.logger,
        this.networkDetails,
        this.config,
      );
    }

    if (
      this.config.networkName === undefined ||
      this.config.networkName === ''
    ) {
      this.logger.warn(
        `${this.networkDetails.name} network name not configured`,
      );
    }
  }

  public init = async (mnemonic: string): Promise<Map<string, Wallet>> => {
    await this.provider.init();
    this.logger.info(`Initialized ${this.networkDetails.name} RPC providers`);

    const network = await this.provider.getNetwork();
    this.network = {
      chainId: network.chainId,
      name: this.config.networkName || network.name,
    };

    this.signer = new SequentialSigner(
      this.networkDetails.symbol,
      EthersWallet.fromPhrase(mnemonic),
    ).connect(this.provider);
    this.address = await this.signer.getAddress();

    this.logger.verbose(
      `Using ${this.networkDetails.name} signer: ${this.address}`,
    );

    const currentBlock = await this.signer.provider!.getBlockNumber();
    const chainTip = await ChainTipRepository.findOrCreateTip(
      this.networkDetails.symbol,
      currentBlock,
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

    for (const contracts of this.config.contracts) {
      const c = new Contracts(this.logger, this.networkDetails, contracts);
      await c.init(this.provider, this.signer, this.contractEventHandler);
      this.contracts.push(c);
    }

    await transactionTracker.init();

    let lastBlockNumber = currentBlock;
    await this.provider.onBlock(async ({ number }) => {
      this.logger.silly(`Got new ${this.networkDetails.name} block: ${number}`);

      if (number - lastBlockNumber > 1) {
        this.logger.warn(
          `${this.networkDetails.name} block gap detected: ${number - lastBlockNumber}; rescanning for missed events`,
        );

        for (const c of this.contracts) {
          c.contractEventHandler
            .checkMissedEvents(this.provider)
            .catch((error) => {
              this.logger.error(
                `Error checking for missed events of ${this.networkDetails.name} contracts v${c.version}: ${formatError(error)}`,
              );
            });
        }
      }

      lastBlockNumber = number;

      await Promise.all([
        ChainTipRepository.updateTip(chainTip, number),
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

            let nonce = await this.signer.getNonce();
            for (const c of this.contracts) {
              if (
                await this.checkERC20Allowance(
                  provider,
                  await c.erc20Swap.getAddress(),
                  nonce,
                )
              ) {
                nonce += 1;
              }
            }
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
    await this.provider.destroy();
  };

  public getContractDetails = async () => {
    const bestContracts = this.highestContractsVersion();

    return {
      network: {
        chainId: Number(this.network.chainId),
        name: this.network.name,
      },
      swapContracts: {
        EtherSwap: await bestContracts.etherSwap.getAddress(),
        ERC20Swap: await bestContracts.erc20Swap.getAddress(),
      },
      supportedContracts: new Map<number, ContractAddresses>(
        await Promise.all(
          this.contracts.map(
            async (c) =>
              [
                Number(c.version),
                {
                  EtherSwap: await c.etherSwap.getAddress(),
                  ERC20Swap: await c.erc20Swap.getAddress(),
                },
              ] satisfies [number, ContractAddresses],
          ),
        ),
      ),
      tokens: this.tokenAddresses,
    };
  };

  public hasSymbol = (symbol: string): boolean =>
    this.networkDetails.symbol === symbol || this.tokenAddresses.has(symbol);

  public highestContractsVersion = (): Contracts =>
    this.contracts.reduce(
      (max, c) => (max.version > c.version ? max : c),
      this.contracts[0],
    );

  public contractsForAddress = async (address: string) => {
    for (const c of this.contracts) {
      if (
        (await c.etherSwap.getAddress()) === address ||
        (await c.erc20Swap.getAddress()) === address
      ) {
        return c;
      }
    }

    return undefined;
  };

  public getClaimedAmount = async (
    txHex: string,
  ): Promise<{ token?: string; amount: bigint } | undefined> => {
    const tx = Transaction.from(txHex);
    if (tx.to === null || tx.to === undefined) {
      return undefined;
    }

    const contracts = await this.contractsForAddress(tx.to);
    if (contracts === undefined) {
      return undefined;
    }

    const decoded = contracts.decodeClaimData(
      (await contracts.erc20Swap.getAddress()) !== tx.to,
      tx.data,
    );

    if (decoded.length === 0) {
      return undefined;
    }

    return {
      token: decoded[0]?.token,
      amount: decoded.reduce((acc, { amount }) => acc + amount, 0n),
    };
  };

  private checkERC20Allowance = async (
    erc20Wallet: ERC20WalletProvider,
    erc20SwapAddress: string,
    nonce: number,
  ) => {
    const allowance = await erc20Wallet.getAllowance(erc20SwapAddress);

    this.logger.debug(
      `Allowance of ${erc20Wallet.symbol} for ${erc20SwapAddress} is ${allowance.toString()}`,
    );

    if (allowance == 0n) {
      this.logger.verbose(`Setting allowance of ${erc20Wallet.symbol}`);

      const { transactionId } = await erc20Wallet.approve(
        erc20SwapAddress,
        MaxUint256,
        nonce,
      );

      this.logger.info(
        `Set allowance of token ${erc20Wallet.symbol} for ${erc20SwapAddress}: ${transactionId}`,
      );
      return true;
    }

    return false;
  };
}

export default EthereumManager;
