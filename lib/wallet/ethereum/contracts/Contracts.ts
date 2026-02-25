import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import type { Signer } from 'ethers';
import { Contract } from 'ethers';
import type { ContractsConfig } from '../../../Config';
import type Logger from '../../../Logger';
import DefaultMap from '../../../consts/DefaultMap';
import Errors from '../../../wallet/Errors';
import type ConsolidatedEventHandler from '../ConsolidatedEventHandler';
import type { NetworkDetails } from '../EvmNetworks';
import type InjectedProvider from '../InjectedProvider';
import ContractEventHandler from './ContractEventHandler';
import ContractHandler from './ContractHandler';
import ERC20SwapABIv5 from './abis/v5/ERC20Swap.json';
import EtherSwapABIv5 from './abis/v5/EtherSwap.json';
import ERC20SwapABIv6 from './abis/v6/ERC20Swap.json';
import EtherSwapABIv6 from './abis/v6/EtherSwap.json';

enum Feature {
  BatchClaim,
  CommitmentSwap,
}

type DecodedClaim = { token?: string; preimage: string; amount: bigint };

class Contracts {
  public static readonly minVersion = 3n;
  public static readonly maxVersion = 6n;

  public static readonly supportedFeatures = new DefaultMap<
    bigint,
    Set<Feature>
  >(
    () => new Set(),
    [
      [4n, new Set([Feature.BatchClaim])],
      [5n, new Set([Feature.BatchClaim, Feature.CommitmentSwap])],
      [6n, new Set([Feature.BatchClaim, Feature.CommitmentSwap])],
    ],
  );

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
      EtherSwapABIv5,
      signer,
    ) as any as EtherSwap;

    this.erc20Swap = new Contract(
      this.contracts.erc20Swap,
      ERC20SwapABIv5,
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

    if (this.version >= 6n) {
      this.etherSwap = new Contract(
        this.contracts.etherSwap,
        EtherSwapABIv6,
        signer,
      ) as any as EtherSwap;

      this.erc20Swap = new Contract(
        this.contracts.erc20Swap,
        ERC20SwapABIv6,
        signer,
      ) as any as ERC20Swap;
    }

    eventHandler.register(this.contractEventHandler);
    this.contractHandler.init(
      this.features,
      provider,
      signer,
      this.etherSwap,
      this.erc20Swap,
    );
    await this.contractEventHandler.init(
      this.version,
      this.network,
      provider,
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

  public decodeClaimData = (
    isEtherSwap: boolean,
    data: string,
  ): DecodedClaim[] => {
    for (const decoder of isEtherSwap
      ? [
          this.decodeEtherClaimBatch,
          this.decodeEtherClaimBatchWithCommitment,
          this.decodeEtherClaim,
          this.decodeEtherClaimForAddress,
          this.decodeEtherClaimVSignature,
        ]
      : [
          this.decodeErc20ClaimBatch,
          this.decodeErc20ClaimBatchWithCommitment,
          this.decodeErc20Claim,
          this.decodeErc20ClaimForAddress,
          this.decodeErc20ClaimSignature,
        ]) {
      try {
        return decoder(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Ignored to try the next decoder
      }
    }

    return [];
  };

  private decodeEtherClaimBatch = (data: string) => {
    const dec = this.etherSwap.interface.decodeFunctionData(
      this.etherSwap.interface.getFunction(
        'claimBatch(bytes32[],uint256[],address[],uint256[])',
      ),
      data,
    );
    return dec[0].map((preimage: string, index: number) => ({
      preimage,
      amount: dec[1][index],
    }));
  };

  private decodeEtherClaimBatchWithCommitment = (data: string) => {
    const dec = this.etherSwap.interface.decodeFunctionData(
      this.etherSwap.interface.getFunction(
        'claimBatch((bytes32,uint256,address,uint256,uint8,bytes32,bytes32)[])',
      ),
      data,
    );
    return dec[0].map(({ preimage, amount }) => ({
      preimage,
      amount,
    }));
  };

  private decodeEtherClaim = (data: string) => {
    const dec = this.etherSwap.interface.decodeFunctionData(
      this.etherSwap.interface.getFunction(
        'claim(bytes32,uint256,address,uint256)',
      ),
      data,
    );
    return [
      {
        preimage: dec[0],
        amount: dec[1],
      },
    ];
  };

  private decodeEtherClaimVSignature = (data: string) => {
    for (const signature of [
      'claim(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)',
      'claim(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)',
    ] as const) {
      try {
        const dec = this.etherSwap.interface.decodeFunctionData(
          this.etherSwap.interface.getFunction(signature),
          data,
        );
        return [
          {
            preimage: dec[0],
            amount: dec[1],
          },
        ];
      } catch {
        // Ignored to try the next v6 decoder
      }
    }

    throw new Error('invalid EtherSwap v6 claim data');
  };

  private decodeEtherClaimForAddress = (data: string) => {
    const dec = this.etherSwap.interface.decodeFunctionData(
      this.etherSwap.interface.getFunction(
        'claim(bytes32,uint256,address,address,uint256)',
      ),
      data,
    );
    return [
      {
        preimage: dec[0],
        amount: dec[1],
      },
    ];
  };

  private decodeErc20ClaimBatch = (data: string) => {
    const dec = this.erc20Swap.interface.decodeFunctionData(
      this.erc20Swap.interface.getFunction(
        'claimBatch(address,bytes32[],uint256[],address[],uint256[])',
      ),
      data,
    );
    return dec[1].map((preimage: string, index: number) => ({
      preimage,
      amount: dec[2][index],
      token: dec[0],
    }));
  };

  private decodeErc20ClaimBatchWithCommitment = (data: string) => {
    const dec = this.erc20Swap.interface.decodeFunctionData(
      this.erc20Swap.interface.getFunction(
        'claimBatch(address,(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)[])',
      ),
      data,
    );
    return dec[1].map(({ preimage, amount }) => ({
      preimage,
      amount,
      token: dec[0],
    }));
  };

  private decodeErc20Claim = (data: string) => {
    const dec = this.erc20Swap.interface.decodeFunctionData(
      this.erc20Swap.interface.getFunction(
        'claim(bytes32,uint256,address,address,uint256)',
      ),
      data,
    );
    return [
      {
        preimage: dec[0],
        amount: dec[1],
        token: dec[2],
      },
    ];
  };

  private decodeErc20ClaimSignature = (data: string) => {
    for (const signature of [
      'claim(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)',
      'claim(bytes32,uint256,address,address,address,uint256,uint8,bytes32,bytes32)',
    ] as const) {
      try {
        const dec = this.erc20Swap.interface.decodeFunctionData(
          this.erc20Swap.interface.getFunction(signature),
          data,
        );
        return [
          {
            preimage: dec[0],
            amount: dec[1],
            token: dec[2],
          },
        ];
      } catch {
        // Ignored to try the next v6 decoder
      }
    }

    throw new Error('invalid ERC20Swap v6 claim data');
  };

  private decodeErc20ClaimForAddress = (data: string) => {
    const dec = this.erc20Swap.interface.decodeFunctionData(
      this.erc20Swap.interface.getFunction(
        'claim(bytes32,uint256,address,address,address,uint256)',
      ),
      data,
    );
    return [
      {
        preimage: dec[0],
        amount: dec[1],
        token: dec[2],
      },
    ];
  };
}

export default Contracts;
export { Feature };
