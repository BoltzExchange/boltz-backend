import { ContractABIs } from 'boltz-core';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Contract, Signer } from 'ethers';
import { ContractsConfig } from '../../../Config';
import Logger from '../../../Logger';
import DefaultMap from '../../../consts/DefaultMap';
import Errors from '../../../wallet/Errors';
import ConsolidatedEventHandler from '../ConsolidatedEventHandler';
import { NetworkDetails } from '../EvmNetworks';
import InjectedProvider from '../InjectedProvider';
import ContractEventHandler from './ContractEventHandler';
import ContractHandler from './ContractHandler';

enum Feature {
  BatchClaim,
}

class Contracts {
  public static readonly minVersion = 3n;
  public static readonly maxVersion = 4n;

  public static readonly supportedFeatures = new DefaultMap<
    bigint,
    Set<Feature>
  >(() => new Set(), [[4n, new Set([Feature.BatchClaim])]]);

  public features: Set<Feature> = new Set();
  public version!: bigint;

  public readonly contractHandler: ContractHandler;
  public readonly contractEventHandler: ContractEventHandler;

  public etherSwap!: EtherSwap;
  public erc20Swap!: ERC20Swap;

  constructor(
    private readonly logger: Logger,
    private readonly network: NetworkDetails,
    private readonly contracts: ContractsConfig,
  ) {
    this.contractHandler = new ContractHandler(this.network);
    this.contractEventHandler = new ContractEventHandler(this.logger);
  }

  public init = async (
    provider: InjectedProvider,
    signer: Signer,
    eventHandler: ConsolidatedEventHandler,
  ) => {
    if (
      [this.contracts.etherSwap, this.contracts.erc20Swap].some(
        (value) => value === undefined || value === '',
      )
    ) {
      throw Errors.MISSING_SWAP_CONTRACTS();
    }

    this.etherSwap = new Contract(
      this.contracts.etherSwap,
      ContractABIs.EtherSwap as any,
      signer,
    ) as any as EtherSwap;

    this.erc20Swap = new Contract(
      this.contracts.erc20Swap,
      ContractABIs.ERC20Swap as any,
      signer,
    ) as any as ERC20Swap;

    const versions = await Promise.all(
      [this.etherSwap, this.erc20Swap].map((c) => c.version()),
    );
    if (versions.some((v) => v !== versions[0])) {
      throw Errors.INVALID_ETHEREUM_CONFIGURATION('contract version mismatch');
    }

    if (
      versions[0] < Contracts.minVersion ||
      versions[0] > Contracts.maxVersion
    ) {
      throw Errors.INVALID_ETHEREUM_CONFIGURATION(
        `unsupported contract version ${versions[0].toString()}`,
      );
    }

    this.version = versions[0];
    this.features = Contracts.supportedFeatures.get(versions[0]);

    eventHandler.register(this.contractEventHandler);
    this.contractHandler.init(
      this.features,
      provider,
      this.etherSwap,
      this.erc20Swap,
    );
    await this.contractEventHandler.init(
      this.version,
      this.network,
      this.etherSwap,
      this.erc20Swap,
    );

    this.logger.debug(
      `Using ${this.network.name} EtherSwap v${versions[0]} contract: ${this.contracts.etherSwap}`,
    );
    this.logger.debug(
      `Using ${this.network.name} ERC20Swap v${versions[0]} contract: ${this.contracts.erc20Swap}`,
    );
  };
}

export default Contracts;
export { Feature };
