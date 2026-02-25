use crate::contracts::SwapContract;
use crate::utils::check_contract_exists;
use crate::{SwapType, SwapValues, eip712_domain};
use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::{Address, B256, FixedBytes, U256};
use alloy::providers::DynProvider;
use alloy::providers::Provider;
use alloy::providers::network::AnyNetwork;
use alloy::rpc::types::Log;
use alloy::sol_types::SolValue;
use anyhow::anyhow;
use tracing::{debug, info};

mod v5 {
    use alloy::sol;

    sol!(
        #[allow(clippy::too_many_arguments)]
        #[sol(rpc)]
        EtherSwap,
        "../lib/wallet/ethereum/contracts/abis/v5/EtherSwap.json"
    );
}

mod v6 {
    use alloy::sol;

    sol!(
        #[allow(clippy::too_many_arguments)]
        #[sol(rpc)]
        EtherSwap,
        "../lib/wallet/ethereum/contracts/abis/v6/EtherSwap.json"
    );
}

pub const NAME: &str = "EtherSwap";

macro_rules! with_ether_contract {
    ($this:expr, $contract:ident => $expr:expr) => {{
        if $this.version >= 6 {
            let $contract = v6::EtherSwap::new($this.address, $this.provider.clone());
            $expr
        } else {
            let $contract = v5::EtherSwap::new($this.address, $this.provider.clone());
            $expr
        }
    }};
}

pub struct EtherSwapContract {
    address: Address,
    provider: DynProvider<AnyNetwork>,
    version: u8,
    eip712domain: Eip712Domain,
}

#[derive(Debug, Clone, Copy)]
pub struct EtherSwapLockup {
    pub preimage_hash: FixedBytes<32>,
    pub amount: U256,
    pub claim_address: Address,
    pub refund_address: Address,
    pub timelock: U256,
}

#[derive(Debug, Clone, Copy)]
pub struct EtherSwapLockupLog {
    pub lockup: EtherSwapLockup,
    pub transaction_hash: Option<B256>,
}

impl From<v5::EtherSwap::Lockup> for EtherSwapLockup {
    fn from(lockup: v5::EtherSwap::Lockup) -> Self {
        Self {
            preimage_hash: lockup.preimageHash,
            amount: lockup.amount,
            claim_address: lockup.claimAddress,
            refund_address: lockup.refundAddress,
            timelock: lockup.timelock,
        }
    }
}

impl From<v6::EtherSwap::Lockup> for EtherSwapLockup {
    fn from(lockup: v6::EtherSwap::Lockup) -> Self {
        Self {
            preimage_hash: lockup.preimageHash,
            amount: lockup.amount,
            claim_address: lockup.claimAddress,
            refund_address: lockup.refundAddress,
            timelock: lockup.timelock,
        }
    }
}

impl EtherSwapContract {
    pub async fn new(address: Address, provider: DynProvider<AnyNetwork>) -> anyhow::Result<Self> {
        debug!("Using {}: {}", NAME, address.to_string());
        check_contract_exists(&provider, address).await?;

        let ether_swap = v5::EtherSwap::new(address, provider.clone());
        let chain_id = provider.get_chain_id().await?;
        let version = ether_swap.version().call().await?;
        info!(
            "Found {} ({}) version: {}",
            NAME,
            address.to_string(),
            version
        );

        Ok(EtherSwapContract {
            address,
            provider,
            version,
            eip712domain: eip712_domain(SwapType::Ether, version, chain_id, address)?,
        })
    }

    pub fn version(&self) -> u8 {
        self.version
    }

    pub fn eip712_domain(&self) -> &Eip712Domain {
        &self.eip712domain
    }

    pub async fn lock_funds(
        &self,
        preimage_hash: FixedBytes<32>,
        claim_address: Address,
        timelock: U256,
        amount: U256,
    ) -> anyhow::Result<B256> {
        with_ether_contract!(self, contract => {
            Ok(contract
                .lock_0(preimage_hash, claim_address, timelock)
                .value(amount)
                .send()
                .await?
                .watch()
                .await?)
        })
    }

    pub async fn claim(
        &self,
        preimage: FixedBytes<32>,
        amount: U256,
        refund_address: Address,
        timelock: U256,
    ) -> anyhow::Result<B256> {
        with_ether_contract!(self, contract => {
            Ok(contract
                .claim_2(preimage, amount, refund_address, timelock)
                .send()
                .await?
                .watch()
                .await?)
        })
    }

    pub async fn refund(
        &self,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        claim_address: Address,
        timelock: U256,
    ) -> anyhow::Result<B256> {
        with_ether_contract!(self, contract => {
            Ok(contract
                .refund_0(preimage_hash, amount, claim_address, timelock)
                .send()
                .await?
                .watch()
                .await?)
        })
    }

    pub async fn refund_cooperative(
        &self,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        claim_address: Address,
        timelock: U256,
        signature: alloy::primitives::Signature,
    ) -> anyhow::Result<alloy::primitives::B256> {
        with_ether_contract!(self, contract => {
            Ok(contract
                .refundCooperative_1(
                    preimage_hash,
                    amount,
                    claim_address,
                    timelock,
                    signature.v() as u8 + 27,
                    signature.r().into(),
                    signature.s().into(),
                )
                .send()
                .await?
                .watch()
                .await?)
        })
    }

    pub async fn find_lockup(
        &self,
        preimage_hash: FixedBytes<32>,
        query_start_height: u64,
    ) -> anyhow::Result<EtherSwapLockup> {
        with_ether_contract!(self, contract => {
            let logs = contract
                .Lockup_filter()
                .topic1(preimage_hash)
                .from_block(query_start_height)
                .query()
                .await?;
            let lockup = logs
                .into_iter()
                .max_by_key(|(_, log)| (log.block_number, log.log_index, log.transaction_index))
                .ok_or_else(|| anyhow!("no lockup found"))?;
            Ok(lockup.0.into())
        })
    }

    pub async fn lockups_in_range(
        &self,
        from_block: u64,
        to_block: u64,
    ) -> anyhow::Result<Vec<EtherSwapLockupLog>> {
        with_ether_contract!(self, contract => {
            let logs = contract
                .Lockup_filter()
                .from_block(from_block)
                .to_block(to_block)
                .query()
                .await?;

            let lockups = logs
                .into_iter()
                .map(|(event, log)| EtherSwapLockupLog {
                    lockup: event.into(),
                    transaction_hash: log.transaction_hash,
                })
                .collect();

            Ok(lockups)
        })
    }

    pub async fn is_lockup_active(&self, lockup: EtherSwapLockup) -> anyhow::Result<bool> {
        let params = (
            lockup.preimage_hash,
            lockup.amount,
            lockup.claim_address,
            lockup.refund_address,
            lockup.timelock,
        );
        let swap_hash = alloy::primitives::keccak256(SolValue::abi_encode(&params));

        with_ether_contract!(self, contract => {
            Ok(contract.swaps(swap_hash).call().await?)
        })
    }

    pub fn decode_lockup_log(log: &Log) -> Option<EtherSwapLockup> {
        log.log_decode::<v6::EtherSwap::Lockup>()
            .ok()
            .map(|event| event.inner.data.into())
            .or_else(|| {
                log.log_decode::<v5::EtherSwap::Lockup>()
                    .ok()
                    .map(|event| event.inner.data.into())
            })
    }

    pub async fn domain_separator(&self) -> anyhow::Result<FixedBytes<32>> {
        with_ether_contract!(self, contract => {
            Ok(contract
                .DOMAIN_SEPARATOR()
                .call()
                .await?)
        })
    }

    pub async fn onchain_version(&self) -> anyhow::Result<u8> {
        with_ether_contract!(self, contract => {
            Ok(contract.version().call().await?)
        })
    }
}

impl SwapContract for EtherSwapContract {
    fn address(&self) -> &Address {
        &self.address
    }

    fn version(&self) -> u8 {
        self.version
    }

    fn refund_hash(
        &self,
        domain: &Eip712Domain,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        // Needed for interface compatibility, but not used for EtherSwap
        _token_address: Address,
        claim_address: Address,
        timelock: U256,
    ) -> anyhow::Result<FixedBytes<32>> {
        crate::refund::hash(
            self.version,
            domain,
            &SwapValues {
                swap_type: SwapType::Ether,
                preimage_hash,
                amount,
                token_address: None,
                claim_address,
                timelock,
            },
        )
    }

    fn eip712_domain(&self) -> &Eip712Domain {
        &self.eip712domain
    }
}

#[cfg(test)]
mod test {
    use crate::contracts::SwapContract;
    use crate::contracts::ether_swap::EtherSwapContract;
    use crate::refund_signer::test::setup;
    use crate::test_utils::ETHER_SWAP_ADDRESS;
    use alloy::primitives::Address;

    #[tokio::test]
    async fn test_address() {
        let (_, _, _, provider) = setup().await;
        let contract = EtherSwapContract::new(ETHER_SWAP_ADDRESS.parse().unwrap(), provider)
            .await
            .unwrap();

        assert_eq!(
            contract.address(),
            &ETHER_SWAP_ADDRESS.parse::<Address>().unwrap()
        );
    }

    #[tokio::test]
    async fn test_version() {
        let (_, _, _, provider) = setup().await;
        let address = ETHER_SWAP_ADDRESS.parse().unwrap();
        let contract = EtherSwapContract::new(address, provider.clone())
            .await
            .unwrap();

        let contract_version = contract.onchain_version().await.unwrap();

        assert_eq!(contract.version(), contract_version);
    }

    #[tokio::test]
    async fn test_eip712_domain() {
        let (_, _, _, provider) = setup().await;
        let address = ETHER_SWAP_ADDRESS.parse().unwrap();
        let contract = EtherSwapContract::new(address, provider.clone())
            .await
            .unwrap();

        let hash = contract.eip712_domain().hash_struct();
        let domain_separator = contract.domain_separator().await.unwrap();

        assert_eq!(hash, domain_separator);
    }
}
