use anyhow::Result;
use tonic::transport::Channel;

#[allow(dead_code)]
mod ark_rpc {
    tonic::include_proto!("fulmine.v1");
}

#[derive(Debug, Clone)]
pub struct ArkClient {
    client: ark_rpc::service_client::ServiceClient<Channel>,
}

impl ArkClient {
    pub fn hash_preimage(preimage: &[u8]) -> [u8; 32] {
        let hash = bitcoin_hashes::Sha256::hash(preimage);
        *hash.as_byte_array()
    }

    pub fn vhtlc_id(
        preimage_hash: &[u8; 32],
        sender_pubkey: &[u8; 33],
        receiver_pubkey: &[u8; 33],
    ) -> String {
        let mut data = Vec::new();
        data.extend_from_slice(bitcoin_hashes::Ripemd160::hash(preimage_hash).as_byte_array());
        data.extend_from_slice(sender_pubkey);
        data.extend_from_slice(receiver_pubkey);
        let hash = bitcoin_hashes::Sha256::hash(&data);
        alloy::hex::encode(hash.as_byte_array())
    }

    pub async fn new(host: &str, port: u16) -> Result<Self> {
        let channel = Channel::from_shared(format!("http://{}:{}", host, port))?
            .connect()
            .await?;
        let client = ark_rpc::service_client::ServiceClient::new(channel);
        Ok(Self { client })
    }

    pub async fn claim_vhtlc(&mut self, preimage: String, vhtlc_id: String) -> Result<String> {
        let response = self
            .client
            .claim_vhtlc(ark_rpc::ClaimVhtlcRequest { preimage, vhtlc_id })
            .await?;
        Ok(response.into_inner().redeem_txid)
    }
}

#[cfg(test)]
mod tests {
    use alloy::primitives::FixedBytes;

    use super::*;

    #[test]
    fn test_hash_preimage() {
        let preimage =
            alloy::hex::decode("af3834134849c93212d49f5378e907bae048c2abe1c57535cc28b7eac3a79e20")
                .unwrap();
        let hash = ArkClient::hash_preimage(&preimage);
        assert_eq!(
            alloy::hex::encode(hash),
            "9fbe5a42f88dbf55f04bb86f769c7c98af008c6975c28d5cd209483fec35e1d4"
        );
    }

    #[test]
    fn test_vhtlc_id() {
        let preimage_hash = FixedBytes::<32>::try_from(
            alloy::hex::decode("9fbe5a42f88dbf55f04bb86f769c7c98af008c6975c28d5cd209483fec35e1d4")
                .unwrap()
                .as_slice(),
        )
        .unwrap();
        let sender_pubkey = FixedBytes::<33>::try_from(
            alloy::hex::decode(
                "0294f6023ea0ba9599a8f38325cf349cbe7080042b8bcfffdf7ca03d0945eecfd8",
            )
            .unwrap()
            .as_slice(),
        )
        .unwrap();
        let receiver_pubkey = FixedBytes::<33>::try_from(
            alloy::hex::decode(
                "02586f2d45828bc7364c6e0eea41109aba825bc3a2dc15097791ec27c02473fa0a",
            )
            .unwrap()
            .as_slice(),
        )
        .unwrap();

        let vhtlc_id = ArkClient::vhtlc_id(&preimage_hash, &sender_pubkey, &receiver_pubkey);
        assert_eq!(
            vhtlc_id,
            "bf5aeb40d46aaa677c03420ce2bea3dc7c3116fc283f85d9cffed8d87281ff48"
        );
    }
}
