use crate::Network;
use anyhow::Result;
use bitcoin::{Address as BitcoinAddress, Script as BitcoinScript};
use elements::{
    Address as ElementsAddress, Script as ElementsScript,
    secp256k1_zkp::PublicKey as ElementsPublicKey,
};
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq)]
pub enum Address {
    Bitcoin(BitcoinAddress),
    Elements(ElementsAddress),
}

impl TryFrom<&str> for Address {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self> {
        Ok(BitcoinAddress::from_str(value)
            .map(|a| Address::Bitcoin(a.assume_checked()))
            .or_else(|_| ElementsAddress::from_str(value).map(Address::Elements))?)
    }
}

impl TryInto<BitcoinAddress> for Address {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<BitcoinAddress> {
        match self {
            Address::Bitcoin(a) => Ok(a),
            Address::Elements(_) => Err(anyhow::anyhow!(
                "cannot convert Elements address to Bitcoin address"
            )),
        }
    }
}

impl TryInto<ElementsAddress> for Address {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<ElementsAddress> {
        match self {
            Address::Bitcoin(_) => Err(anyhow::anyhow!(
                "cannot convert Bitcoin address to Elements address"
            )),
            Address::Elements(a) => Ok(a),
        }
    }
}

impl From<Address> for String {
    fn from(address: Address) -> String {
        match address {
            Address::Bitcoin(a) => a.to_string(),
            Address::Elements(a) => a.to_string(),
        }
    }
}

impl std::fmt::Display for Address {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Address::Bitcoin(a) => write!(f, "{}", a),
            Address::Elements(a) => write!(f, "{}", a),
        }
    }
}

impl Address {
    pub fn from_bitcoin_script(network: Network, script: &[u8]) -> Result<Self> {
        Ok(
            BitcoinAddress::from_script(BitcoinScript::from_bytes(script), network.bitcoin())
                .map(Address::Bitcoin)?,
        )
    }

    pub fn from_elements_script(
        network: Network,
        script: Vec<u8>,
        blinding_pubkey: Option<&[u8]>,
    ) -> Result<Self> {
        ElementsAddress::from_script(
            &ElementsScript::from(script),
            blinding_pubkey
                .map(ElementsPublicKey::from_slice)
                .transpose()?,
            network.liquid()?,
        )
        .map(Address::Elements)
        .ok_or_else(|| anyhow::anyhow!("failed to parse script"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[test]
    fn test_from_string_bitcoin() {
        let address = "bcrt1qycl82qgp7gu9rtyueydt6valr8jzcq644xdgpq";
        let parsed = Address::try_from(address).unwrap();
        assert!(matches!(parsed, Address::Bitcoin(_)));

        let bitcoin_address: BitcoinAddress = parsed.try_into().unwrap();
        assert_eq!(bitcoin_address.to_string(), address);
    }

    #[test]
    fn test_from_string_elements() {
        let address = "el1qq0lvfvk5qcz472vtprc925yyvq7gd93a8w3zwqrnh5xzznh65lpp2estxkekxddcxwapgxpnylvcmhlvfskuuzfvdqapkasp9";
        let parsed = Address::try_from(address).unwrap();
        assert!(matches!(parsed, Address::Elements(_)));

        let elements_address: ElementsAddress = parsed.try_into().unwrap();
        assert_eq!(elements_address.to_string(), address);
    }

    #[rstest]
    #[case::legacy(
        "mwsQzdoFrFTt2AamhGT1wDrCxjRf5cA6ks",
        "76a914b3609e9a6b3b9af06c5acefe22132087113e0cdf88ac"
    )]
    #[case::nested(
        "2MxvsJMSJdVTArVMAxpvTeBGCrWrETcVNEj",
        "a9143e57ff5e45a8709b4deaeba5cbfc41638e98900987"
    )]
    #[case::segwitv0(
        "bcrt1qeh2fha85eax4a5j9h6gsrngvpejnnrrs5ycy6l",
        "0014cdd49bf4f4cf4d5ed245be9101cd0c0e65398c70"
    )]
    #[case::segwitv1(
        "bcrt1pxrdqsnlkwua3ymsm7klgsl3nmq84vznp2vvpvt8yfccl5940hgws88j7x0",
        "512030da084ff6773b126e1bf5be887e33d80f560a615318162ce44e31fa16afba1d"
    )]
    fn test_from_script_bitcoin(#[case] expected_address: &str, #[case] script: &str) {
        let address = Address::from_bitcoin_script(Network::Regtest, &hex::decode(script).unwrap());
        assert!(address.is_ok());

        let address = address.unwrap();
        assert!(matches!(address, Address::Bitcoin(_)));

        let address_str: String = address.into();
        assert_eq!(address_str, expected_address);
    }

    #[rstest]
    #[case::legacy(
        "2dbrJeWLBRsUmPMeUz1G2RTA8qs9t8WG3Lo",
        "76a9141a9529a1067a825c12b67b7b13444cda644760ff88ac",
        None
    )]
    #[case::legacy_blinded(
        "CTEtMhCjmNVXB5uDLtQ92n3JPiMD2Zkpry79cfUptNabBgy2pYCxr2rwZY24yYjZo9U9JYu4MNTx6HzJ",
        "76a9141a9529a1067a825c12b67b7b13444cda644760ff88ac",
        Some("03404188a783f6bfc5f53d2d5997f589212bd8bbc75256bc8b3034593a128f4797")
    )]
    #[case::nested(
        "XTuEeCCgCWvD7wRysawRf3UHEt29WrNFbR",
        "a914b58f26bc9ab7308d3676a3194afc657ada6d57e087",
        None
    )]
    #[case::nested_blinded(
        "AzpkBp6UAsAj4XcszKNjYBWy7tZ2GWiJMVfpWKtTEDCvC6FtK1A2v5LK47jeeurFkgLKHPuCZuKkvu8Y",
        "a914b58f26bc9ab7308d3676a3194afc657ada6d57e087",
        Some("022cec646c4fe13c17d38926f2fcbdebd83db533c9faf72f5cf66ddfce2de7ab71")
    )]
    #[case::segwitv0(
        "ert1qcqyqwr656x7udwgzfqhvdhyzfdtjue89amqgqj",
        "0014c008070f54d1bdc6b902482ec6dc824b572e64e5",
        None
    )]
    #[case::segwitv0_blinded(
        "el1qqdqykq2xqtrz03adngcepwjs82g0deygackdk65rr8g68t4pht3ndsqgqu84f5dac6usyjpwcmwgyj6h9ejw25rn4p5w0x6sz",
        "0014c008070f54d1bdc6b902482ec6dc824b572e64e5",
        Some("03404b014602c627c7ad9a3190ba503a90f6e488ee2cdb6a8319d1a3aea1bae336")
    )]
    fn test_from_script_liquid(
        #[case] expected_address: &str,
        #[case] script: &str,
        #[case] blinding_pubkey: Option<&str>,
    ) {
        let blinding_pubkey_bytes = blinding_pubkey.map(|b| hex::decode(b).unwrap());
        let address = Address::from_elements_script(
            Network::Regtest,
            hex::decode(script).unwrap(),
            blinding_pubkey_bytes.as_ref().map(|b| b.as_ref()),
        );
        assert!(address.is_ok());

        let address = address.unwrap();
        assert!(matches!(address, Address::Elements(_)));

        let address_str: String = address.into();
        assert_eq!(address_str, expected_address);
    }
}
