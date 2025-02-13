use crate::cache::Cache;
use crate::chain::BaseClient;
use crate::currencies::Currencies;
use crate::lightning::cln::Cln;
use crate::lightning::cln::cln_rpc::ListchannelsChannels;
use alloy::hex;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

const CACHE_NODE_TTL_SECS: u64 = 3_600;
const CACHE_CHANNELS_TTL_SECS: u64 = 600;

#[derive(Debug, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChannelInfo {
    #[serde(rename = "baseFeeMillisatoshi")]
    pub base_fee_millisatoshi: u32,
    #[serde(rename = "feePpm")]
    pub fee_ppm: u32,
    pub delay: u32,
    #[serde(
        rename = "htlcMinimumMillisatoshi",
        skip_serializing_if = "Option::is_none"
    )]
    pub htlc_minimum_millisatoshi: Option<u64>,
    #[serde(
        rename = "htlcMaximumMillisatoshi",
        skip_serializing_if = "Option::is_none"
    )]
    pub htlc_maximum_millisatoshi: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Channel {
    pub source: Node,
    #[serde(rename = "shortChannelId")]
    pub short_channel_id: String,
    #[serde(rename = "capacity", skip_serializing_if = "Option::is_none")]
    pub capacity_sat: Option<u64>,
    pub active: bool,
    pub info: ChannelInfo,
}

impl From<(ListchannelsChannels, Node)> for Channel {
    fn from(v: (ListchannelsChannels, Node)) -> Self {
        Self {
            source: Node {
                id: hex::encode(v.0.source),
                alias: v.1.alias,
                color: v.1.color,
            },
            short_channel_id: v.0.short_channel_id,
            capacity_sat: v.0.amount_msat.map(|a| a.msat / 1_000),
            active: v.0.active,
            info: ChannelInfo {
                base_fee_millisatoshi: v.0.base_fee_millisatoshi,
                fee_ppm: v.0.fee_per_millionth,
                delay: v.0.delay,
                htlc_minimum_millisatoshi: v.0.htlc_minimum_msat.map(|a| a.msat),
                htlc_maximum_millisatoshi: v.0.htlc_maximum_msat.map(|a| a.msat),
            },
        }
    }
}

#[derive(Debug)]
pub enum InfoFetchError {
    NoNode,
    FetchError(anyhow::Error),
}

impl From<anyhow::Error> for InfoFetchError {
    fn from(value: anyhow::Error) -> Self {
        InfoFetchError::FetchError(value)
    }
}

#[async_trait]
pub trait LightningInfo {
    async fn get_channels(
        &self,
        symbol: &str,
        destination: Vec<u8>,
    ) -> Result<Vec<Channel>, InfoFetchError>;

    async fn get_node_info(&self, symbol: &str, node: Vec<u8>) -> Result<Node, InfoFetchError>;
}

pub struct ClnLightningInfo<C: Cache + Send + Sync> {
    currencies: Currencies,
    cache: Option<C>,
}

impl<C: Cache + Send + Sync> ClnLightningInfo<C> {
    pub fn new(cache: Option<C>, currencies: Currencies) -> Self {
        Self { cache, currencies }
    }

    async fn get_node_info_from_cln(&self, cln: &mut Cln, id: Vec<u8>) -> anyhow::Result<Node> {
        let cache_key = Self::cache_key_node(&cln.symbol(), &id);
        if let Some(cache) = &self.cache {
            if let Some(node) = cache.get(&cache_key).await? {
                return Ok(node);
            }
        }

        let mut node = Node {
            id: hex::encode(&id),
            alias: None,
            color: None,
        };

        let nodes = cln.list_nodes(Some(id)).await?;
        if !nodes.is_empty() {
            let node_entry = nodes[0].clone();
            node.alias = node_entry.alias;
            node.color = node_entry.color.map(hex::encode);
        };

        if let Some(cache) = &self.cache {
            cache
                .set_ttl(&cache_key, &node, CACHE_NODE_TTL_SECS)
                .await?;
        }

        Ok(node)
    }

    fn get_cln(&self, symbol: &str) -> Result<Cln, InfoFetchError> {
        Ok(
            match match self.currencies.get(symbol) {
                Some(cur) => &cur.cln,
                None => return Err(InfoFetchError::NoNode),
            } {
                Some(cln) => cln.clone(),
                None => return Err(InfoFetchError::NoNode),
            },
        )
    }

    fn cache_key_node(symbol: &str, id: &[u8]) -> String {
        format!("cln:{}:node:{}", symbol, hex::encode(id))
    }

    fn cache_key_channels(symbol: &str, destination: &[u8]) -> String {
        format!("cln:{}:channels:{}", symbol, hex::encode(destination))
    }
}

#[async_trait]
impl<C: Cache + Send + Sync> LightningInfo for ClnLightningInfo<C> {
    async fn get_channels(
        &self,
        symbol: &str,
        destination: Vec<u8>,
    ) -> Result<Vec<Channel>, InfoFetchError> {
        let cache_key = Self::cache_key_channels(symbol, &destination);
        if let Some(cache) = &self.cache {
            if let Some(channels) = cache.get(&cache_key).await? {
                return Ok(channels);
            }
        }

        let mut cln = self.get_cln(symbol)?;
        let raw_channels: Vec<ListchannelsChannels> = cln.list_channels(Some(destination)).await?;

        let mut channels = Vec::new();
        for channel in raw_channels {
            if !channel.public {
                continue;
            }

            let node_info = self
                .get_node_info_from_cln(&mut cln, channel.source.clone())
                .await?;
            channels.push((channel, node_info).into());
        }

        if let Some(cache) = &self.cache {
            cache
                .set_ttl(&cache_key, &channels, CACHE_CHANNELS_TTL_SECS)
                .await?;
        }

        Ok(channels)
    }

    async fn get_node_info(&self, symbol: &str, node: Vec<u8>) -> Result<Node, InfoFetchError> {
        let mut cln = self.get_cln(symbol)?;
        self.get_node_info_from_cln(&mut cln, node)
            .await
            .map_err(InfoFetchError::FetchError)
    }
}

#[cfg(test)]
mod test {
    use crate::cache::Redis;
    use crate::currencies::{Currencies, Currency};
    use crate::lightning::cln::test::cln_client;
    use crate::service::lightning_info::{ClnLightningInfo, LightningInfo};
    use crate::wallet::{Bitcoin, Network};
    use alloy::hex;
    use bip39::Mnemonic;
    use std::collections::HashMap;
    use std::str::FromStr;
    use std::sync::Arc;

    async fn get_currencies() -> Currencies {
        Arc::new(HashMap::<String, Currency>::from([(
            "BTC".to_string(),
            Currency {
                network: Network::Regtest,
                wallet: Arc::new(
                    Bitcoin::new(
                        Network::Regtest,
                        &Mnemonic::from_str(
                            "test test test test test test test test test test test junk",
                        )
                        .unwrap()
                        .to_seed(""),
                        "m/0/0".to_string(),
                    )
                    .unwrap(),
                ),
                chain: Some(Arc::new(Box::new(
                    crate::chain::chain_client::test::get_client(),
                ))),
                cln: Some(cln_client().await),
                lnd: None,
            },
        )]))
    }

    #[tokio::test]
    async fn test_get_node_info() {
        let currencies = get_currencies().await;
        let mut cln = currencies.get("BTC").unwrap().cln.clone().unwrap();
        let node = cln.list_nodes(None).await.unwrap()[0].clone();

        let lightning_info = ClnLightningInfo::<Redis>::new(None, currencies);

        let info = lightning_info
            .get_node_info("BTC", node.nodeid.clone())
            .await
            .unwrap();

        assert_eq!(info.id, hex::encode(&node.nodeid));
        assert_eq!(info.color.unwrap(), hex::encode(node.color.unwrap()));
        assert_eq!(info.alias, node.alias);
    }

    #[tokio::test]
    async fn test_get_channels() {
        let currencies = get_currencies().await;
        let mut cln = currencies.get("BTC").unwrap().cln.clone().unwrap();
        let node = cln.list_nodes(None).await.unwrap()[0].clone();

        let lightning_info = ClnLightningInfo::<Redis>::new(None, currencies);

        let channels = lightning_info
            .get_channels("BTC", node.nodeid.clone())
            .await
            .unwrap();

        assert!(!channels.is_empty());
        assert!(channels.iter().all(|c| c.source.alias.is_some()))
    }
}
