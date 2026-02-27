use crate::contracts::SwapContract;
use crate::utils::check_contract_exists;
use crate::{SwapType, SwapValues, eip712_domain};
use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::{Address, B256, FixedBytes, U256};
use alloy::providers::network::AnyNetwork;
use alloy::providers::{CallItemBuilder, DynProvider, Provider};
use alloy::rpc::types::Log;
use alloy::sol_types::SolValue;
use anyhow::anyhow;
use tracing::{debug, info};

mod v5 {
    use alloy::sol;

    sol!(
        #[allow(clippy::too_many_arguments)]
        #[sol(rpc)]
        ERC20Swap,
        "../lib/wallet/ethereum/contracts/abis/v5/ERC20Swap.json"
    );
}

mod v6 {
    use alloy::sol;

    sol!(
        #[allow(clippy::too_many_arguments)]
        #[sol(rpc)]
        ERC20Swap,
        "../lib/wallet/ethereum/contracts/abis/v6/ERC20Swap.json"
    );
}

pub const NAME: &str = "ERC20Swap";

macro_rules! with_erc20_contract {
    ($this:expr, $contract:ident => $expr:expr) => {{
        if $this.version >= 6 {
            let $contract = v6::ERC20Swap::new($this.address, $this.provider.clone());
            $expr
        } else {
            let $contract = v5::ERC20Swap::new($this.address, $this.provider.clone());
            $expr
        }
    }};
}

pub struct ERC20SwapContract {
    address: Address,
    provider: DynProvider<AnyNetwork>,
    version: u8,
    eip712domain: Eip712Domain,
}

#[derive(Debug, Clone, Copy)]
pub struct ERC20SwapLockup {
    pub preimage_hash: FixedBytes<32>,
    pub amount: U256,
    pub token_address: Address,
    pub claim_address: Address,
    pub refund_address: Address,
    pub timelock: U256,
}

#[derive(Debug, Clone, Copy)]
pub struct ERC20SwapLockupLog {
    pub lockup: ERC20SwapLockup,
    pub transaction_hash: Option<B256>,
}

impl From<v5::ERC20Swap::Lockup> for ERC20SwapLockup {
    fn from(lockup: v5::ERC20Swap::Lockup) -> Self {
        Self {
            preimage_hash: lockup.preimageHash,
            amount: lockup.amount,
            token_address: lockup.tokenAddress,
            claim_address: lockup.claimAddress,
            refund_address: lockup.refundAddress,
            timelock: lockup.timelock,
        }
    }
}

impl From<v6::ERC20Swap::Lockup> for ERC20SwapLockup {
    fn from(lockup: v6::ERC20Swap::Lockup) -> Self {
        Self {
            preimage_hash: lockup.preimageHash,
            amount: lockup.amount,
            token_address: lockup.tokenAddress,
            claim_address: lockup.claimAddress,
            refund_address: lockup.refundAddress,
            timelock: lockup.timelock,
        }
    }
}

impl ERC20SwapContract {
    fn swap_hash(lockup: &ERC20SwapLockup) -> B256 {
        let params = (
            lockup.preimage_hash,
            lockup.amount,
            lockup.token_address,
            lockup.claim_address,
            lockup.refund_address,
            lockup.timelock,
        );
        alloy::primitives::keccak256(SolValue::abi_encode(&params))
    }

    pub async fn new(address: Address, provider: DynProvider<AnyNetwork>) -> anyhow::Result<Self> {
        debug!("Using {}: {}", NAME, address.to_string());
        check_contract_exists(&provider, address).await?;

        let erc20_swap = v5::ERC20Swap::new(address, provider.clone());
        let chain_id = provider.get_chain_id().await?;
        let version = erc20_swap.version().call().await?;
        info!(
            "Found {} ({}) version: {}",
            NAME,
            address.to_string(),
            version
        );

        Ok(ERC20SwapContract {
            address,
            provider,
            version,
            eip712domain: eip712_domain(SwapType::ERC20, version, chain_id, address)?,
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
        amount: U256,
        token_address: Address,
        claim_address: Address,
        timelock: U256,
    ) -> anyhow::Result<B256> {
        with_erc20_contract!(self, contract => {
            Ok(contract
                .lock_0(preimage_hash, amount, token_address, claim_address, timelock)
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
        token_address: Address,
        refund_address: Address,
        timelock: U256,
    ) -> anyhow::Result<B256> {
        with_erc20_contract!(self, contract => {
            Ok(contract
                .claim_3(preimage, amount, token_address, refund_address, timelock)
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
        token_address: Address,
        claim_address: Address,
        timelock: U256,
    ) -> anyhow::Result<B256> {
        with_erc20_contract!(self, contract => {
            Ok(contract
                .refund_1(preimage_hash, amount, token_address, claim_address, timelock)
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
        token_address: Address,
        claim_address: Address,
        timelock: U256,
        signature: alloy::primitives::Signature,
    ) -> anyhow::Result<alloy::primitives::B256> {
        with_erc20_contract!(self, contract => {
            Ok(contract
                .refundCooperative_1(
                    preimage_hash,
                    amount,
                    token_address,
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
        token: Address,
        query_start_height: u64,
    ) -> anyhow::Result<ERC20SwapLockup> {
        with_erc20_contract!(self, contract => {
            let logs = contract
                .Lockup_filter()
                .topic1(preimage_hash)
                .from_block(query_start_height)
                .query()
                .await?;

            let lockup = logs
                .into_iter()
                .filter(|(event, _)| event.tokenAddress == token)
                .max_by_key(|(_, log)| (log.block_number, log.log_index, log.transaction_index))
                .ok_or_else(|| anyhow!("no lockup found"))?;

            Ok(lockup.0.into())
        })
    }

    pub async fn lockups_in_range(
        &self,
        from_block: u64,
        to_block: u64,
    ) -> anyhow::Result<Vec<ERC20SwapLockupLog>> {
        with_erc20_contract!(self, contract => {
            let logs = contract
                .Lockup_filter()
                .from_block(from_block)
                .to_block(to_block)
                .query()
                .await?;

            let lockups = logs
                .into_iter()
                .map(|(event, log)| ERC20SwapLockupLog {
                    lockup: event.into(),
                    transaction_hash: log.transaction_hash,
                })
                .collect();

            Ok(lockups)
        })
    }

    pub async fn is_lockup_active(&self, lockup: &ERC20SwapLockup) -> anyhow::Result<bool> {
        let swap_hash = Self::swap_hash(lockup);

        with_erc20_contract!(self, contract => {
            Ok(contract.swaps(swap_hash).call().await?)
        })
    }

    pub async fn are_lockups_active(
        &self,
        lockups: &[ERC20SwapLockup],
    ) -> anyhow::Result<Vec<bool>> {
        if lockups.is_empty() {
            return Ok(Vec::new());
        }

        let swap_hashes = lockups.iter().map(Self::swap_hash).collect::<Vec<_>>();

        with_erc20_contract!(self, contract => {
            let mut multicall = self.provider.multicall().dynamic();
            for swap_hash in &swap_hashes {
                multicall = multicall.add_call_dynamic(
                    CallItemBuilder::new(contract.swaps(*swap_hash)).allow_failure(true),
                );
            }

            multicall
                .aggregate3()
                .await?
                .into_iter()
                .map(|result| {
                    result.map_err(|err| anyhow!("check for lockup activity failed: {err}"))
                })
                .collect::<anyhow::Result<Vec<_>>>()
        })
    }

    pub fn decode_lockup_log(log: &Log) -> Option<ERC20SwapLockup> {
        log.log_decode::<v6::ERC20Swap::Lockup>()
            .ok()
            .map(|event| event.inner.data.into())
            .or_else(|| {
                log.log_decode::<v5::ERC20Swap::Lockup>()
                    .ok()
                    .map(|event| event.inner.data.into())
            })
    }

    pub async fn domain_separator(&self) -> anyhow::Result<FixedBytes<32>> {
        with_erc20_contract!(self, contract => {
            Ok(contract
                .DOMAIN_SEPARATOR()
                .call()
                .await?)
        })
    }

    pub async fn onchain_version(&self) -> anyhow::Result<u8> {
        with_erc20_contract!(self, contract => {
            Ok(contract.version().call().await?)
        })
    }
}

impl SwapContract for ERC20SwapContract {
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
        token_address: Address,
        claim_address: Address,
        timelock: U256,
    ) -> anyhow::Result<FixedBytes<32>> {
        crate::refund::hash(
            self.version,
            domain,
            &SwapValues {
                swap_type: SwapType::ERC20,
                preimage_hash,
                amount,
                token_address: Some(token_address),
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
    use crate::contracts::erc20_swap::ERC20SwapContract;
    use crate::refund_signer::test::setup;
    use crate::test_utils::ERC20_SWAP_ADDRESS;
    use alloy::primitives::Address;

    #[tokio::test]
    async fn test_address() {
        let (_, _, _, provider) = setup().await;
        let contract = ERC20SwapContract::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider)
            .await
            .unwrap();

        assert_eq!(
            contract.address(),
            &ERC20_SWAP_ADDRESS.parse::<Address>().unwrap()
        );
    }

    #[tokio::test]
    async fn test_version() {
        let (_, _, _, provider) = setup().await;
        let address = ERC20_SWAP_ADDRESS.parse().unwrap();
        let contract = ERC20SwapContract::new(address, provider.clone())
            .await
            .unwrap();

        let contract_version = contract.onchain_version().await.unwrap();

        assert_eq!(contract.version(), contract_version);
    }

    #[tokio::test]
    async fn test_eip712_domain() {
        let (_, _, _, provider) = setup().await;
        let contract =
            ERC20SwapContract::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider.clone())
                .await
                .unwrap();

        let hash = contract.eip712_domain().hash_struct();
        let domain_separator = contract.domain_separator().await.unwrap();

        assert_eq!(hash, domain_separator);
    }
}
