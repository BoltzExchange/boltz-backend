use alloy::primitives::Address;
use alloy::signers::Signature;
use anyhow::Result;
use std::str::FromStr;

pub fn recover_signer(message: &[u8], signature: &str) -> Result<Address> {
    let signature = Signature::from_str(signature)?;
    Ok(signature.recover_address_from_msg(message)?)
}

#[cfg(test)]
mod test {
    use super::*;
    use alloy::signers::SignerSync;
    use alloy::signers::local::PrivateKeySigner;

    const TEST_KEY: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    fn signer() -> PrivateKeySigner {
        TEST_KEY.parse().unwrap()
    }

    fn sign(message: &[u8]) -> String {
        format!(
            "0x{}",
            hex::encode(signer().sign_message_sync(message).unwrap().as_bytes())
        )
    }

    #[test]
    fn test_recover_signer() {
        let message = b"Boltz swap restore";
        assert_eq!(
            recover_signer(message, &sign(message)).unwrap(),
            signer().address()
        );
    }

    #[test]
    fn test_recover_signer_no_prefix() {
        let message = b"Boltz swap restore";
        let signature = hex::encode(signer().sign_message_sync(message).unwrap().as_bytes());
        assert_eq!(
            recover_signer(message, &signature).unwrap(),
            signer().address()
        );
    }

    #[test]
    fn test_recover_signer_tampered_message() {
        let signature = sign(b"original message");
        assert_ne!(
            recover_signer(b"different message", &signature).unwrap(),
            signer().address()
        );
    }

    #[test]
    fn test_recover_signer_invalid_signature() {
        assert!(recover_signer(b"message", "not-a-signature").is_err());
    }
}
