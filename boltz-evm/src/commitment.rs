use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::{Address, FixedBytes};
use alloy::signers::{Signature, Signer};
use alloy::sol_types::SolStruct;
use anyhow::Result;

use crate::{SwapType, SwapValues};

mod ether {
    use alloy::sol;

    sol!(
        struct Commit {
            bytes32 preimageHash;
            uint256 amount;
            address claimAddress;
            address refundAddress;
            uint256 timelock;
        }
    );
}

mod erc20 {
    use alloy::sol;

    sol!(
        struct Commit {
            bytes32 preimageHash;
            uint256 amount;
            address tokenAddress;
            address claimAddress;
            address refundAddress;
            uint256 timelock;
        }
    );
}

pub fn hash(
    domain: &Eip712Domain,
    values: &SwapValues,
    refund_address: Address,
) -> Result<FixedBytes<32>> {
    let digest = match values.swap_type {
        SwapType::Ether => ether::Commit {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            claimAddress: values.claim_address,
            refundAddress: refund_address,
            timelock: values.timelock,
        }
        .eip712_signing_hash(domain),
        SwapType::ERC20 => {
            let token_address = values
                .token_address
                .ok_or_else(|| anyhow::anyhow!("token address is required for ERC20 commits"))?;

            erc20::Commit {
                preimageHash: values.preimage_hash,
                amount: values.amount,
                tokenAddress: token_address,
                claimAddress: values.claim_address,
                refundAddress: refund_address,
                timelock: values.timelock,
            }
            .eip712_signing_hash(domain)
        }
    };

    Ok(digest)
}

pub async fn sign(
    signer: &impl Signer,
    domain: &Eip712Domain,
    values: &SwapValues,
    refund_address: Address,
) -> Result<Signature> {
    let digest = hash(domain, values, refund_address)?;
    Ok(signer.sign_hash(&digest).await?)
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::eip712_domain;
    use alloy::primitives::{Address, U256};
    use alloy::sol_types::SolStruct;

    fn sample_values(swap_type: SwapType) -> (Address, Address, SwapValues) {
        let contract = Address::repeat_byte(0x11);
        let refund_address = Address::repeat_byte(0x55);
        let values = SwapValues {
            swap_type,
            preimage_hash: FixedBytes::<32>::from([0x33; 32]),
            amount: U256::from(42u64),
            token_address: if swap_type == SwapType::ERC20 {
                Some(Address::repeat_byte(0x44))
            } else {
                None
            },
            claim_address: Address::repeat_byte(0x22),
            timelock: U256::from(1234u64),
        };
        (contract, refund_address, values)
    }

    #[test]
    fn test_ether_commit_hash() {
        let (contract, refund_address, values) = sample_values(SwapType::Ether);
        let domain = eip712_domain(SwapType::Ether, 5, 31_337, contract).unwrap();

        let result = hash(&domain, &values, refund_address).unwrap();

        let expected = ether::Commit {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            claimAddress: values.claim_address,
            refundAddress: refund_address,
            timelock: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_erc20_commit_hash() {
        let (contract, refund_address, values) = sample_values(SwapType::ERC20);
        let domain = eip712_domain(SwapType::ERC20, 5, 31_337, contract).unwrap();

        let result = hash(&domain, &values, refund_address).unwrap();

        let expected = erc20::Commit {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            tokenAddress: values.token_address.unwrap(),
            claimAddress: values.claim_address,
            refundAddress: refund_address,
            timelock: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_erc20_commit_requires_token_address() {
        let (contract, refund_address, mut values) = sample_values(SwapType::ERC20);
        values.token_address = None;
        let domain = eip712_domain(SwapType::ERC20, 5, 31_337, contract).unwrap();

        assert!(hash(&domain, &values, refund_address).is_err());
    }
}
