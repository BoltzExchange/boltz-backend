import { ContractABIs } from 'boltz-core';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import {
  Contract,
  Wallet as EthersWallet,
  MaxUint256,
  Signer,
  Transaction,
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
import ConsolidatedEventHandler from './ConsolidatedEventHandler';
import EthereumTransactionTracker from './EthereumTransactionTracker';
import { Ethereum, NetworkDetails, Rsk } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';
import SequentialSigner from './SequentialSigner';
import Contracts from './contracts/Contracts';

type Network = {
  name: string;
  chainId: bigint;
};

class EthereumManager {
  public readonly provider: InjectedProvider;
  public readonly contractEventHandler = new ConsolidatedEventHandler();

  public signer!: Signer;
  public address!: string;
  public network!: Network;
  public readonly networkDetails: NetworkDetails;

  public readonly tokenAddresses = new Map<string, string>();

  private contracts: Contracts[] = [];

  constructor(
    private readonly logger: Logger,
    isRsk: boolean,
    private readonly config: RskConfig | EthereumConfig,
  ) {
    if (
      config === null ||
      config === undefined ||
      config.contracts === undefined ||
      config.contracts.length === 0
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
  };

  public getContractDetails = async () => {
    const bestContracts = this.highestContractsVersion();

    return {
      network: {
        chainId: Number(this.network.chainId),
        name: this.network.name,
      },
      tokens: this.tokenAddresses,
      swapContracts: new Map<string, string>([
        ['EtherSwap', await bestContracts.etherSwap.getAddress()],
        ['ERC20Swap', await bestContracts.erc20Swap.getAddress()],
      ]),
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
  ): Promise<bigint | undefined> => {
    const tx = Transaction.from(txHex);
    if (tx.to === null || tx.to === undefined) {
      return undefined;
    }

    const contracts = await this.contractsForAddress(tx.to);
    if (contracts === undefined) {
      return undefined;
    }

    return contracts
      .decodeClaimData(tx.data)
      .reduce((acc, { amount }) => acc + amount, 0n);
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
