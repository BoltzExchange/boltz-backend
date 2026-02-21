use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::FixedBytes;
use alloy::signers::{Signature, Signer};
use alloy::sol_types::SolStruct;
use anyhow::Result;

use crate::{SwapType, SwapValues, ensure_supported_version};

mod ether_v4 {
    use alloy::sol;

    sol!(
        struct Refund {
            bytes32 preimageHash;
            uint256 amount;
            address claimAddress;
            uint256 timeout;
        }
    );
}

mod ether_current {
    use alloy::sol;

    sol!(
        struct Refund {
            bytes32 preimageHash;
            uint256 amount;
            address claimAddress;
            uint256 timelock;
        }
    );
}

mod erc20_v4 {
    use alloy::sol;

    sol!(
        struct Refund {
            bytes32 preimageHash;
            uint256 amount;
            address tokenAddress;
            address claimAddress;
            uint256 timeout;
        }
    );
}

mod erc20_current {
    use alloy::sol;

    sol!(
        struct Refund {
            bytes32 preimageHash;
            uint256 amount;
            address tokenAddress;
            address claimAddress;
            uint256 timelock;
        }
    );
}

pub fn hash(
    contract_version: u8,
    domain: &Eip712Domain,
    values: &SwapValues,
) -> Result<FixedBytes<32>> {
    ensure_supported_version(contract_version)?;

    let digest = match values.swap_type {
        SwapType::Ether => {
            if contract_version <= 4 {
                ether_v4::Refund {
                    preimageHash: values.preimage_hash,
                    amount: values.amount,
                    claimAddress: values.claim_address,
                    timeout: values.timelock,
                }
                .eip712_signing_hash(domain)
            } else {
                ether_current::Refund {
                    preimageHash: values.preimage_hash,
                    amount: values.amount,
                    claimAddress: values.claim_address,
                    timelock: values.timelock,
                }
                .eip712_signing_hash(domain)
            }
        }
        SwapType::ERC20 => {
            let token_address = values
                .token_address
                .ok_or_else(|| anyhow::anyhow!("token address is required for ERC20 refunds"))?;

            if contract_version <= 4 {
                erc20_v4::Refund {
                    preimageHash: values.preimage_hash,
                    amount: values.amount,
                    tokenAddress: token_address,
                    claimAddress: values.claim_address,
                    timeout: values.timelock,
                }
                .eip712_signing_hash(domain)
            } else {
                erc20_current::Refund {
                    preimageHash: values.preimage_hash,
                    amount: values.amount,
                    tokenAddress: token_address,
                    claimAddress: values.claim_address,
                    timelock: values.timelock,
                }
                .eip712_signing_hash(domain)
            }
        }
    };

    Ok(digest)
}

pub async fn sign(
    signer: &impl Signer,
    contract_version: u8,
    domain: &Eip712Domain,
    values: &SwapValues,
) -> Result<Signature> {
    let digest = hash(contract_version, domain, values)?;
    Ok(signer.sign_hash(&digest).await?)
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::eip712_domain;
    use alloy::primitives::{Address, U256};
    use alloy::sol_types::SolStruct;

    fn sample_values(swap_type: SwapType) -> (Address, SwapValues) {
        let contract = Address::repeat_byte(0x11);
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
        (contract, values)
    }

    #[test]
    fn test_ether_refund_hash_v4() {
        let (contract, values) = sample_values(SwapType::Ether);
        let domain = eip712_domain(SwapType::Ether, 4, 31_337, contract).unwrap();

        let result = hash(4, &domain, &values).unwrap();

        let expected = ether_v4::Refund {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            claimAddress: values.claim_address,
            timeout: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_ether_refund_hash_v5() {
        let (contract, values) = sample_values(SwapType::Ether);
        let domain = eip712_domain(SwapType::Ether, 5, 31_337, contract).unwrap();

        let result = hash(5, &domain, &values).unwrap();

        let expected = ether_current::Refund {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            claimAddress: values.claim_address,
            timelock: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_erc20_refund_hash_v4() {
        let (contract, values) = sample_values(SwapType::ERC20);
        let domain = eip712_domain(SwapType::ERC20, 4, 31_337, contract).unwrap();

        let result = hash(4, &domain, &values).unwrap();

        let expected = erc20_v4::Refund {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            tokenAddress: values.token_address.unwrap(),
            claimAddress: values.claim_address,
            timeout: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_erc20_refund_hash_v5() {
        let (contract, values) = sample_values(SwapType::ERC20);
        let domain = eip712_domain(SwapType::ERC20, 5, 31_337, contract).unwrap();

        let result = hash(5, &domain, &values).unwrap();

        let expected = erc20_current::Refund {
            preimageHash: values.preimage_hash,
            amount: values.amount,
            tokenAddress: values.token_address.unwrap(),
            claimAddress: values.claim_address,
            timelock: values.timelock,
        }
        .eip712_signing_hash(&domain);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_unsupported_contract_version() {
        let (contract, values) = sample_values(SwapType::Ether);
        let domain = Eip712Domain::new(
            Some("EtherSwap".into()),
            Some("6".into()),
            Some(U256::from(31_337)),
            Some(contract),
            None,
        );

        assert!(hash(6, &domain, &values).is_err());
    }
}
