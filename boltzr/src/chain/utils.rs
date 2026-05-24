use crate::chain::Client;
use crate::{chain::types::Type, wallet::Network};
use bitcoin::ScriptBuf;
use bitcoin::hashes::Hash;
use bitcoin::secp256k1::PublicKey;
use elements::hex::ToHex;
use elements::pset::serialize::Serialize;
use futures_util::{StreamExt, TryStreamExt};
use lightning::util::ser::Writeable;
use std::str::FromStr;
use std::sync::Arc;

#[derive(Hash, Eq, PartialEq, Debug, Clone)]
pub struct Outpoint {
    pub hash: Vec<u8>,
    pub vout: u32,
}

#[derive(PartialEq, Eq, Hash, Debug, Clone)]
pub enum Transaction {
    Bitcoin(bitcoin::Transaction),
    Elements(elements::Transaction),
}

#[derive(PartialEq, Debug, Clone)]
pub enum BlockHeader {
    Bitcoin(bitcoin::block::Header),
    Elements(Box<elements::BlockHeader>),
}

#[derive(PartialEq, Debug, Clone)]
pub struct Block {
    pub header: BlockHeader,
    // In an Arc so that we can clone the block without copying all the transactions every time
    pub transactions: Arc<Vec<Transaction>>,
}

pub fn encode_address(
    address_type: Type,
    script_pubkey: Vec<u8>,
    blinding_pubkey: Option<Vec<u8>>,
    network: Network,
) -> anyhow::Result<String> {
    match address_type {
        Type::Bitcoin => {
            let script_buf = ScriptBuf::from_bytes(script_pubkey);
            Ok(bitcoin::Address::from_script(&script_buf, network.bitcoin())?.to_string())
        }
        Type::Elements => {
            let pubkey = blinding_pubkey
                .map(|b| PublicKey::from_slice(b.as_ref()))
                .transpose()?;
            let script = elements::Script::from(script_pubkey);
            let addr = elements::Address::from_script(&script, pubkey, network.liquid()?).ok_or(
                anyhow::anyhow!("failed to parse liquid script: {:?}", script.to_hex()),
            )?;
            Ok(addr.to_string())
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedAddress {
    pub script_pubkey: Vec<u8>,
    pub blinding_pubkey: Option<Vec<u8>>,
}

pub fn decode_address(
    address_type: Type,
    address: &str,
    network: Network,
) -> anyhow::Result<DecodedAddress> {
    match address_type {
        Type::Bitcoin => {
            let parsed = bitcoin::Address::from_str(address)?.require_network(network.bitcoin())?;
            Ok(DecodedAddress {
                script_pubkey: parsed.script_pubkey().to_bytes(),
                blinding_pubkey: None,
            })
        }
        Type::Elements => {
            let parsed = elements::Address::from_str(address)?;
            if parsed.params != network.liquid()? {
                return Err(anyhow::anyhow!("invalid network"));
            }
            Ok(DecodedAddress {
                script_pubkey: parsed.script_pubkey().to_bytes(),
                blinding_pubkey: parsed.blinding_pubkey.map(|pk| pk.serialize().to_vec()),
            })
        }
    }
}

impl Transaction {
    pub fn parse_hex(transaction_type: &Type, transaction: &str) -> anyhow::Result<Transaction> {
        Self::parse(transaction_type, &hex::decode(transaction)?)
    }

    pub fn parse(transaction_type: &Type, transaction: &[u8]) -> anyhow::Result<Transaction> {
        match transaction_type {
            Type::Bitcoin => {
                let tx = bitcoin::consensus::deserialize(transaction)?;
                Ok(Transaction::Bitcoin(tx))
            }
            Type::Elements => {
                let tx = elements::encode::deserialize(transaction)?;
                Ok(Transaction::Elements(tx))
            }
        }
    }

    pub fn txid_hex(&self) -> String {
        match self {
            Transaction::Bitcoin(tx) => tx.compute_txid().to_hex(),
            Transaction::Elements(tx) => tx.txid().to_hex(),
        }
    }

    pub fn serialize(&self) -> Vec<u8> {
        match self {
            Transaction::Bitcoin(tx) => tx.serialize(),
            Transaction::Elements(tx) => tx.serialize(),
        }
    }

    pub fn vsize(&self) -> u64 {
        let size = match self {
            Transaction::Bitcoin(tx) => tx.vsize(),
            Transaction::Elements(tx) => tx.discount_vsize(),
        };

        size as u64
    }

    /// Calculates the fee the transaction is paying
    pub async fn calculate_fee(
        &self,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> anyhow::Result<u64> {
        match self {
            Transaction::Bitcoin(tx) => {
                let input_sum = futures::stream::iter(&tx.input)
                    .map(|input| {
                        let client = client.clone();

                        async move {
                            let input_tx = client
                                .raw_transaction(&input.previous_output.txid.to_hex())
                                .await?;
                            let input_tx: bitcoin::Transaction =
                                bitcoin::consensus::deserialize(&hex::decode(input_tx)?)?;

                            match input_tx.output.get(input.previous_output.vout as usize) {
                                Some(output) => Ok(output.value.to_sat()),
                                None => Err(anyhow::anyhow!(
                                    "input vout {} is out of bounds for tx {}",
                                    input.previous_output.vout,
                                    input.previous_output.txid
                                )),
                            }
                        }
                    })
                    .boxed()
                    .buffer_unordered(16)
                    .try_fold(0, |acc, amount| async move { Ok(acc + amount) })
                    .await?;

                Ok(input_sum
                    .checked_sub(tx.output.iter().map(|o| o.value.to_sat()).sum::<u64>())
                    .ok_or(anyhow::anyhow!("input sum is less than output sum"))?)
            }
            Transaction::Elements(tx) => {
                let fee = tx
                    .output
                    .iter()
                    .find(|o| o.script_pubkey.is_empty())
                    .ok_or(anyhow::anyhow!("no fee output found"))?;

                let fee = fee
                    .value
                    .explicit()
                    .ok_or(anyhow::anyhow!("fee output has no explicit value"))?;

                Ok(fee)
            }
        }
    }

    pub fn input_outpoints(&self) -> Vec<Outpoint> {
        match self {
            Transaction::Bitcoin(tx) => tx
                .input
                .iter()
                .map(|i| Outpoint {
                    vout: i.previous_output.vout,
                    hash: i.previous_output.txid.encode(),
                })
                .collect(),
            Transaction::Elements(tx) => tx
                .input
                .iter()
                .map(|i| Outpoint {
                    vout: i.previous_output.vout,
                    hash: i.previous_output.txid[..].to_vec(),
                })
                .collect(),
        }
    }

    pub fn output_script_pubkeys(&self) -> Vec<Vec<u8>> {
        match self {
            Transaction::Bitcoin(tx) => tx
                .output
                .iter()
                .map(|o| o.script_pubkey.to_bytes())
                .collect(),
            Transaction::Elements(tx) => tx
                .output
                .iter()
                .filter(|o| !o.script_pubkey.is_empty())
                .map(|o| o.script_pubkey.to_bytes())
                .collect(),
        }
    }
}

impl Block {
    pub fn parse_hex(block_type: &Type, block: &str) -> anyhow::Result<Block> {
        Self::parse(block_type, &hex::decode(block)?)
    }

    pub fn parse(block_type: &Type, block: &[u8]) -> anyhow::Result<Block> {
        match block_type {
            Type::Bitcoin => {
                let block: bitcoin::Block = bitcoin::consensus::deserialize(block)?;
                Ok(Block {
                    header: BlockHeader::Bitcoin(block.header),
                    transactions: Arc::new(
                        block.txdata.into_iter().map(Transaction::Bitcoin).collect(),
                    ),
                })
            }
            Type::Elements => {
                let block: elements::Block = elements::encode::deserialize(block)?;
                Ok(Block {
                    header: BlockHeader::Elements(Box::new(block.header)),
                    transactions: Arc::new(
                        block
                            .txdata
                            .into_iter()
                            .map(Transaction::Elements)
                            .collect(),
                    ),
                })
            }
        }
    }

    pub fn block_hash(&self) -> [u8; 32] {
        let mut hash = match &self.header {
            BlockHeader::Bitcoin(header) => header.block_hash().to_raw_hash().to_byte_array(),
            BlockHeader::Elements(header) => header.block_hash().to_raw_hash().to_byte_array(),
        };
        hash.reverse();
        hash
    }
}

#[cfg(test)]
mod test {
    use crate::chain::chain_client::test as bitcoin_test;
    use crate::chain::elements_client::test as elements_test;
    use crate::chain::types::Type;
    use crate::chain::utils::{Block, Outpoint, Transaction};
    use serial_test::serial;
    use std::sync::Arc;

    const BITCOIN_TX_HEX: &str = include_str!("../../fixtures/bitcoin-tx.txt");
    const ELEMENTS_TX_HEX: &str = include_str!("../../fixtures/elements-tx.txt");
    const BITCOIN_BLOCK_HEX: &str = include_str!("../../fixtures/bitcoin-block.txt");
    const ELEMENTS_BLOCK_HEX: &str = include_str!("../../fixtures/elements-block.txt");

    #[test]
    fn test_parse_transaction_bitcoin() {
        let tx = Transaction::parse_hex(&Type::Bitcoin, BITCOIN_TX_HEX).unwrap();

        assert_eq!(tx.serialize(), hex::decode(BITCOIN_TX_HEX).unwrap());

        assert_eq!(tx.input_outpoints().len(), 1);
        let mut input_id =
            hex::decode("557875c59f4fdeaaa687d43afe0e1cc826939bc7a8b2870a80a50f85a55f6403")
                .unwrap();
        input_id.reverse();
        assert_eq!(
            tx.input_outpoints(),
            vec![Outpoint {
                hash: input_id,
                vout: 1
            }]
        );

        assert_eq!(tx.output_script_pubkeys().len(), 2);
        assert_eq!(
            tx.output_script_pubkeys(),
            vec![
                hex::decode("512060b5cba1e3a0577877cd2978dfc4d859c0f8e6a5f627c93ef339d3f886fe52e7")
                    .unwrap(),
                hex::decode("5120bb7beca2338aeaa5cf8237c3106b63a70bfebb8ced05f82c7ccc399ba815da61")
                    .unwrap()
            ]
        );

        assert!(matches!(tx, Transaction::Bitcoin(_)));
    }

    #[test]
    fn test_parse_transaction_elements() {
        let tx = Transaction::parse_hex(&Type::Elements, ELEMENTS_TX_HEX).unwrap();

        assert_eq!(tx.serialize(), hex::decode(ELEMENTS_TX_HEX).unwrap());

        assert_eq!(tx.input_outpoints().len(), 1);
        let mut input_id =
            hex::decode("575d5fa731b2882a163700c8894c5432c836e8b8479f5e067f0f7a9bc2f76af5")
                .unwrap();
        input_id.reverse();
        assert_eq!(
            tx.input_outpoints(),
            vec![Outpoint {
                vout: 0,
                hash: input_id,
            }]
        );

        assert_eq!(tx.output_script_pubkeys().len(), 2);
        assert_eq!(
            tx.output_script_pubkeys(),
            vec![
                hex::decode("0014a3ab45d87ce4e48d817692d1920d0158d3cbde5d").unwrap(),
                hex::decode("00145aac09643b7db5a46d6a5b6c381187fcd3d0bc0d").unwrap()
            ]
        );

        assert!(matches!(tx, Transaction::Elements(_)));
    }

    #[test]
    fn test_vsize() {
        let tx = Transaction::parse_hex(&Type::Bitcoin, BITCOIN_TX_HEX).unwrap();
        assert_eq!(tx.vsize(), 165);
    }

    #[test]
    fn test_vsize_elements() {
        let tx = Transaction::parse_hex(&Type::Elements, ELEMENTS_TX_HEX).unwrap();
        assert_eq!(tx.vsize(), 257);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn calculate_fee_bitcoin() {
        let client = bitcoin_test::get_client().await;
        let tx = bitcoin_test::send_transaction(&client).await;
        bitcoin_test::generate_block(&client).await;

        let client = Arc::new(client) as Arc<dyn crate::chain::Client + Send + Sync>;
        let fee = tx.calculate_fee(&client).await.unwrap();

        let expected = tx.vsize();
        let tolerance = expected / 10;
        assert!(
            fee >= expected.saturating_sub(tolerance) && fee <= expected + tolerance,
            "fee {} not within ±10% of expected vsize {}",
            fee,
            expected
        );
    }

    #[tokio::test]
    async fn calculate_fee_elements() {
        let client = elements_test::get_client().0;
        let tx = Transaction::parse_hex(&Type::Elements, ELEMENTS_TX_HEX).unwrap();

        let client = Arc::new(client) as Arc<dyn crate::chain::Client + Send + Sync>;
        let fee = tx.calculate_fee(&client).await.unwrap();
        assert_eq!(fee, 25);
    }

    #[test]
    fn test_parse_block_bitcoin() {
        let block = Block::parse_hex(&Type::Bitcoin, BITCOIN_BLOCK_HEX).unwrap();
        assert_eq!(
            hex::encode(block.block_hash()),
            "6706ca496eca8887c00b5a64e504201ad71c3c1abb3e3f5f6135fda8c494f565"
        );

        assert_eq!(block.transactions.len(), 3);
        assert_eq!(
            block.transactions[0].txid_hex(),
            "f537ad0cc3daf87e5c44242690e8786af1cfcc3a3dd70b4694b9b8b165102fa7"
        );
        assert_eq!(
            block.transactions[1].txid_hex(),
            "a3f1ba7d910ecdc13f8f9a53e2243df8fcd9091bf9ee3855ececb02849e13307"
        );
        assert_eq!(
            block.transactions[2].txid_hex(),
            "ca56648ce69b89a1b8a47d339032c2638738a76eb974d982b14537822eb0d83d"
        );
    }

    mod address_codec {
        use crate::chain::types::Type;
        use crate::chain::utils::{decode_address, encode_address};
        use crate::wallet::Network;

        const P2WPKH_CONFIDENTIAL: &str =
            "el1qq0cm53ae2e5trn6wxa9lhcg7k42rrsdtqkzw2gucr9f30rchqr4dttge6skvgjr4nfu9wa4cmhef2g4vsshr6gxcl9hn0j6t6";
        const P2WPKH_UNCONFIDENTIAL: &str = "ert1q45vagtxyfp6e57zhw6udmu54y2kggt3a772qqc";
        const P2TR_CONFIDENTIAL: &str =
            "el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq";
        const P2TR_UNCONFIDENTIAL: &str =
            "ert1p4r63s2x2m4x9e8ujgcjjmrknkrs8gqmegs96uyj3f8nmh3qt375sypfq5m";
        const P2SH_NESTED_CONFIDENTIAL: &str =
            "Azpnk8khuDiLxTZxyU1SptRGHiScPgEvc8UW91reeM7abwxupYeDRWKYrdXmhBhcWjAU4VBhvn8GS5C1";
        const P2SH_NESTED_UNCONFIDENTIAL: &str = "XG1S1H3Wj6jg4CjTGVsrchUmBfNKSRVvuL";

        #[test]
        fn decode_unconfidential_yields_no_blinding_pubkey() {
            let decoded =
                decode_address(Type::Elements, P2WPKH_UNCONFIDENTIAL, Network::Regtest).unwrap();
            assert!(decoded.blinding_pubkey.is_none());
            assert!(!decoded.script_pubkey.is_empty());
        }

        #[test]
        fn decode_confidential_yields_blinding_pubkey() {
            let decoded =
                decode_address(Type::Elements, P2WPKH_CONFIDENTIAL, Network::Regtest).unwrap();
            let blinding = decoded.blinding_pubkey.expect("blinding pubkey expected");
            assert_eq!(blinding.len(), 33);
        }

        #[test]
        fn confidential_and_unconfidential_share_script_pubkey() {
            let confidential =
                decode_address(Type::Elements, P2WPKH_CONFIDENTIAL, Network::Regtest).unwrap();
            let unconfidential =
                decode_address(Type::Elements, P2WPKH_UNCONFIDENTIAL, Network::Regtest).unwrap();
            assert_eq!(confidential.script_pubkey, unconfidential.script_pubkey);
        }

        #[test]
        fn round_trips_unconfidential_p2wpkh() {
            let decoded =
                decode_address(Type::Elements, P2WPKH_UNCONFIDENTIAL, Network::Regtest).unwrap();
            let encoded =
                encode_address(Type::Elements, decoded.script_pubkey, None, Network::Regtest)
                    .unwrap();
            assert_eq!(encoded, P2WPKH_UNCONFIDENTIAL);
        }

        #[test]
        fn round_trips_confidential_p2wpkh() {
            let decoded =
                decode_address(Type::Elements, P2WPKH_CONFIDENTIAL, Network::Regtest).unwrap();
            let encoded = encode_address(
                Type::Elements,
                decoded.script_pubkey,
                decoded.blinding_pubkey,
                Network::Regtest,
            )
            .unwrap();
            assert_eq!(encoded, P2WPKH_CONFIDENTIAL);
        }

        #[test]
        fn round_trips_unconfidential_p2tr() {
            let decoded =
                decode_address(Type::Elements, P2TR_UNCONFIDENTIAL, Network::Regtest).unwrap();
            let encoded =
                encode_address(Type::Elements, decoded.script_pubkey, None, Network::Regtest)
                    .unwrap();
            assert_eq!(encoded, P2TR_UNCONFIDENTIAL);
        }

        #[test]
        fn round_trips_confidential_p2tr() {
            let decoded =
                decode_address(Type::Elements, P2TR_CONFIDENTIAL, Network::Regtest).unwrap();
            let encoded = encode_address(
                Type::Elements,
                decoded.script_pubkey,
                decoded.blinding_pubkey,
                Network::Regtest,
            )
            .unwrap();
            assert_eq!(encoded, P2TR_CONFIDENTIAL);
        }

        #[test]
        fn round_trips_unconfidential_p2sh_nested() {
            let decoded =
                decode_address(Type::Elements, P2SH_NESTED_UNCONFIDENTIAL, Network::Regtest)
                    .unwrap();
            let encoded =
                encode_address(Type::Elements, decoded.script_pubkey, None, Network::Regtest)
                    .unwrap();
            assert_eq!(encoded, P2SH_NESTED_UNCONFIDENTIAL);
        }

        #[test]
        fn round_trips_confidential_p2sh_nested() {
            let decoded =
                decode_address(Type::Elements, P2SH_NESTED_CONFIDENTIAL, Network::Regtest)
                    .unwrap();
            let encoded = encode_address(
                Type::Elements,
                decoded.script_pubkey,
                decoded.blinding_pubkey,
                Network::Regtest,
            )
            .unwrap();
            assert_eq!(encoded, P2SH_NESTED_CONFIDENTIAL);
        }

        #[test]
        fn rejects_mismatched_network() {
            let result =
                decode_address(Type::Elements, P2WPKH_UNCONFIDENTIAL, Network::Mainnet);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err().to_string(), "invalid network");
        }

        #[test]
        fn rejects_garbage_address() {
            let result = decode_address(Type::Elements, "this-is-not-an-address", Network::Regtest);
            assert!(result.is_err());
        }
    }

    #[test]
    fn test_parse_block_elements() {
        let block = Block::parse_hex(&Type::Elements, ELEMENTS_BLOCK_HEX).unwrap();
        assert_eq!(
            hex::encode(block.block_hash()),
            "eb12d8f4dbebd40f3323ff9b5b6920f2515cc8b7bee4feddcf12115aa588b5e1"
        );

        assert_eq!(block.transactions.len(), 3);
        assert_eq!(
            block.transactions[0].txid_hex(),
            "5acc35c004ec934a51b3532476de4b43a9721df7d60081dff643c184b40b0d0e"
        );
        assert_eq!(
            block.transactions[1].txid_hex(),
            "7ff7c88fa62db608487dd8ec52658c00725ee6c1925ec54378b130d37396676b"
        );
        assert_eq!(
            block.transactions[2].txid_hex(),
            "7ffc00ea31b7cfe22228fd9077f68cd86df388915902384a3c85100a779de462"
        );
    }
}
