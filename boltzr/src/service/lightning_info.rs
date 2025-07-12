use crate::cache::Cache;
use crate::chain::BaseClient;
use crate::currencies::Currencies;
use crate::lightning::cln::Cln;
use crate::lightning::cln::cln_rpc::ListchannelsChannels;
use alloy::hex;
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use rapidfuzz::distance::jaro_winkler;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, info, instrument, warn};

const MAX_DISTANCE: f64 = 0.1;
const CACHE_TTL_SECS: u64 = 3_600;

struct SearchResult<T> {
    pub distance: f64,
    pub node: T,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChannelPolicy {
    pub active: bool,
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
    pub info: ChannelPolicy,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChannelInfoSide {
    pub node: Node,
    #[serde(flatten)]
    pub policy: ChannelPolicy,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChannelInfo {
    #[serde(rename = "shortChannelId")]
    pub short_channel_id: String,
    #[serde(rename = "capacity", skip_serializing_if = "Option::is_none")]
    pub capacity_sat: Option<u64>,
    pub policies: Vec<ChannelInfoSide>,
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
            info: ChannelPolicy {
                active: v.0.active,
                base_fee_millisatoshi: v.0.base_fee_millisatoshi,
                fee_ppm: v.0.fee_per_millionth,
                delay: v.0.delay,
                htlc_minimum_millisatoshi: v.0.htlc_minimum_msat.map(|a| a.msat),
                htlc_maximum_millisatoshi: v.0.htlc_maximum_msat.map(|a| a.msat),
            },
        }
    }
}

#[async_trait]
pub trait LightningInfo {
    async fn find_node_by_alias(&self, symbol: &str, alias: &str) -> Result<Vec<Node>>;
    async fn get_channels(&self, symbol: &str, destination: &[u8]) -> Result<Vec<Channel>>;
    async fn get_channel(&self, symbol: &str, short_channel_id: String) -> Result<ChannelInfo>;
    async fn get_node_info(&self, symbol: &str, node: &[u8]) -> Result<Node>;
}

#[derive(Clone)]
pub struct ClnLightningInfo {
    cache: Cache,
    currencies: Currencies,

    nodes: Arc<RwLock<HashMap<String, HashMap<String, Node>>>>,
}

impl ClnLightningInfo {
    pub fn new(cache: Cache, currencies: Currencies) -> Self {
        let info = Self {
            cache,
            currencies,
            nodes: Arc::new(RwLock::new(HashMap::new())),
        };

        {
            let interval_duration = Duration::from_secs(CACHE_TTL_SECS - 60);
            info!("Updating lightning gossip every: {:?}", interval_duration);
            let mut interval = tokio::time::interval(interval_duration);

            let info = info.clone();
            tokio::spawn(async move {
                loop {
                    interval.tick().await;

                    for currency in info.currencies.values() {
                        let mut cln = match &currency.cln {
                            Some(cln) => cln.clone(),
                            None => continue,
                        };

                        let start = Instant::now();
                        match info.update_cache(&mut cln).await {
                            Ok(_) => {
                                debug!(
                                    "Updated {} lighting gossip in: {:?}",
                                    cln.symbol(),
                                    start.elapsed()
                                );
                            }
                            Err(err) => {
                                warn!("Updating {} lightning gossip failed: {}", cln.symbol(), err);
                            }
                        }
                    }
                }
            });
        }

        info
    }

    #[instrument(name = "ClnLightningInfo::update_cache", skip_all, fields(symbol = cln.symbol()))]
    async fn update_cache(&self, cln: &mut Cln) -> Result<()> {
        let symbol = cln.symbol();
        info!("Updating {} lightning gossip", symbol);

        let node_infos = self.update_nodes(&symbol, cln).await?;

        let mut channel_infos = HashMap::<String, ChannelInfo>::new();
        let mut channels_to_nodes = HashMap::<Vec<u8>, Vec<Channel>>::new();

        for channel_raw in cln.list_channels(None).await? {
            if !channel_raw.public {
                continue;
            }

            let source_info = match node_infos.get(&hex::encode(&channel_raw.source)) {
                Some(info) => info,
                None => continue,
            };

            let destination = channel_raw.destination.clone();
            let channel: Channel = (channel_raw, source_info.clone()).into();

            channel_infos
                .entry(channel.short_channel_id.clone())
                .or_insert_with(|| ChannelInfo {
                    short_channel_id: channel.short_channel_id.clone(),
                    capacity_sat: channel.capacity_sat,
                    policies: Vec::new(),
                })
                .policies
                .push(ChannelInfoSide {
                    node: source_info.clone(),
                    policy: channel.info.clone(),
                });

            channels_to_nodes
                .entry(destination)
                .or_default()
                .push(channel);
        }

        for (destination, channels) in channels_to_nodes {
            let (key, field) = Self::cache_key_channels(&symbol, hex::encode(destination));
            self.cache
                .set(&key, &field, &channels, Some(CACHE_TTL_SECS))
                .await?;
        }

        for (short_channel_id, channel_info) in channel_infos {
            let (key, field) = Self::cache_key_channel(&symbol, short_channel_id);
            self.cache
                .set(&key, &field, &channel_info, Some(CACHE_TTL_SECS))
                .await?;
        }

        self.nodes.write().await.insert(symbol, node_infos);

        Ok(())
    }

    #[instrument(name = "ClnLightningInfo::update_nodes", skip(self, cln))]
    async fn update_nodes(&self, symbol: &str, cln: &mut Cln) -> Result<HashMap<String, Node>> {
        let mut infos = HashMap::new();
        for node in cln.list_nodes(None).await? {
            let id_hex = hex::encode(&node.nodeid);
            let node_info = Node {
                id: id_hex.clone(),
                alias: node.alias,
                color: node.color.map(hex::encode),
            };
            let (key, field) = Self::cache_key_node(symbol, id_hex.clone());
            self.cache
                .set(&key, &field, &node_info, Some(CACHE_TTL_SECS))
                .await?;
            infos.insert(id_hex, node_info);
        }

        Ok(infos)
    }

    fn scid_lnd_to_cln(s: &str) -> Result<String> {
        let big: u128 = s.parse::<u128>()?;

        let block: u128 = big >> 40;
        let tx: u128 = (big >> 16) & 0x00FF_FFFF;
        let output: u128 = big & 0xFFFF;

        Ok(format!("{block}x{tx}x{output}"))
    }

    fn cache_key_node(symbol: &str, id: String) -> (String, String) {
        (format!("cln:{symbol}:node"), id)
    }

    fn cache_key_channel(symbol: &str, short_channel_id: String) -> (String, String) {
        (format!("cln:{symbol}:channel"), short_channel_id)
    }

    fn cache_key_channels(symbol: &str, destination: String) -> (String, String) {
        (format!("cln:{symbol}:channels"), destination)
    }
}

#[async_trait]
impl LightningInfo for ClnLightningInfo {
    async fn find_node_by_alias(&self, symbol: &str, alias: &str) -> Result<Vec<Node>> {
        let alias = alias.to_lowercase();
        let comparator = jaro_winkler::BatchComparator::new(alias.chars());

        let nodes = self.nodes.read().await;
        let nodes = match nodes.get(symbol) {
            Some(nodes) => nodes,
            None => return Err(anyhow!("no nodes for {}", symbol)),
        };

        let mut nodes = nodes
            .values()
            .filter_map(|node| {
                node.alias.as_ref().and_then(|cmp| {
                    let cmp = cmp.to_lowercase();
                    let distance = comparator.distance(cmp.chars());
                    if distance <= MAX_DISTANCE || cmp.contains(&alias) {
                        Some(SearchResult {
                            distance,
                            node: node.clone(),
                        })
                    } else {
                        None
                    }
                })
            })
            .collect::<Vec<_>>();
        nodes.sort_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap());

        Ok(nodes.into_iter().map(|r| r.node).collect())
    }

    async fn get_channels(&self, symbol: &str, destination: &[u8]) -> Result<Vec<Channel>> {
        let (key, field) = Self::cache_key_channels(symbol, hex::encode(destination));
        if let Some(channels) = self.cache.get(&key, &field).await? {
            return Ok(channels);
        }

        Err(anyhow!("no channels for node"))
    }

    async fn get_channel(&self, symbol: &str, short_channel_id: String) -> Result<ChannelInfo> {
        let short_channel_id = short_channel_id.to_lowercase();
        let short_channel_id = match short_channel_id.contains("x") {
            true => short_channel_id,
            false => Self::scid_lnd_to_cln(&short_channel_id)?,
        };

        let (key, field) = Self::cache_key_channel(symbol, short_channel_id);
        if let Some(channel) = self.cache.get(&key, &field).await? {
            return Ok(channel);
        }

        Err(anyhow!("channel not found"))
    }

    async fn get_node_info(&self, symbol: &str, node: &[u8]) -> Result<Node> {
        let (key, field) = Self::cache_key_node(symbol, hex::encode(node));
        if let Some(node) = self.cache.get(&key, &field).await? {
            return Ok(node);
        }

        Err(anyhow!("node not found"))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::cache::{Cache, MemCache};
    use crate::currencies::{Currencies, Currency};
    use crate::lightning::cln::test::cln_client;
    use crate::service::lightning_info::{ClnLightningInfo, LightningInfo};
    use crate::wallet::{Bitcoin, Network};
    use alloy::hex;
    use bip39::Mnemonic;
    use rstest::rstest;
    use std::collections::HashMap;
    use std::str::FromStr;
    use std::sync::Arc;
    use std::time::Duration;

    async fn get_currencies() -> Currencies {
        Arc::new(HashMap::<String, Currency>::from([(
            "BTC".to_string(),
            Currency {
                network: Network::Regtest,
                wallet: Some(Arc::new(
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
                )),
                chain: Some(Arc::new(crate::chain::chain_client::test::get_client())),
                cln: Some(cln_client().await),
                lnd: None,
                bumper: None,
                evm_manager: None,
            },
        )]))
    }

    #[tokio::test]
    async fn test_find_node_by_alias() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let info = ClnLightningInfo::new(cache.clone(), currencies.clone());

        let mut nodes = HashMap::new();
        nodes.insert(
            "1".to_string(),
            Node {
                id: "1".to_string(),
                alias: None,
                color: None,
            },
        );
        nodes.insert(
            "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2".to_string(),
            Node {
                id: "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2"
                    .to_string(),
                alias: Some("Boltz".to_string()),
                color: None,
            },
        );
        nodes.insert(
            "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018".to_string(),
            Node {
                id: "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018"
                    .to_string(),
                alias: Some("Boltz|CLN".to_string()),
                color: None,
            },
        );
        nodes.insert(
            "033d8656219478701227199cbd6f670335c8d408a92ae88b962c49d4dc0e83e025".to_string(),
            Node {
                id: "033d8656219478701227199cbd6f670335c8d408a92ae88b962c49d4dc0e83e025"
                    .to_string(),
                alias: Some("bfx-lnd0".to_string()),
                color: None,
            },
        );
        nodes.insert(
            "03cde60a6323f7122d5178255766e38114b4722ede08f7c9e0c5df9b912cc201d6".to_string(),
            Node {
                id: "03cde60a6323f7122d5178255766e38114b4722ede08f7c9e0c5df9b912cc201d6"
                    .to_string(),
                alias: Some("bfx-lnd1".to_string()),
                color: None,
            },
        );
        info.nodes.write().await.insert("BTC".to_string(), nodes);

        let nodes = info.find_node_by_alias("BTC", "test").await;
        assert!(nodes.is_ok());
        assert!(nodes.unwrap().is_empty());

        let nodes = info.find_node_by_alias("BTC", "BOLTZ").await;
        assert!(nodes.is_ok());
        let nodes = nodes.unwrap();
        assert_eq!(nodes.len(), 2);
        assert!(nodes.iter().any(|n| n.alias == Some("Boltz".to_string())));
        assert!(
            nodes
                .iter()
                .any(|n| n.alias == Some("Boltz|CLN".to_string()))
        );

        let nodes = info.find_node_by_alias("BTC", "bfx").await;
        assert!(nodes.is_ok());
        let nodes = nodes.unwrap();
        assert_eq!(nodes.len(), 2);
        assert!(
            nodes
                .iter()
                .any(|n| n.alias == Some("bfx-lnd0".to_string()))
        );
        assert!(
            nodes
                .iter()
                .any(|n| n.alias == Some("bfx-lnd1".to_string()))
        );
    }

    #[tokio::test]
    async fn test_lightning_info_cache_updates() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let lightning_info = ClnLightningInfo::new(cache.clone(), currencies.clone());

        // Allow some time for the background task to update the cache
        tokio::time::sleep(Duration::from_millis(1_000)).await;

        let btc = currencies.get("BTC").unwrap();
        let mut cln = btc.cln.clone().unwrap();

        let nodes = cln.list_nodes(None).await.unwrap();
        assert!(!nodes.is_empty());

        let test_node = &nodes[0];
        let node_id_hex = hex::encode(&test_node.nodeid);

        let node_info = lightning_info.get_node_info("BTC", &test_node.nodeid).await;
        assert!(node_info.is_ok());

        let node = node_info.unwrap();
        assert_eq!(node.id, node_id_hex);
        assert_eq!(node.alias, test_node.alias);
    }

    #[tokio::test]
    async fn test_get_channels() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let lightning_info = ClnLightningInfo::new(cache.clone(), currencies.clone());

        // Allow some time for the background task to update the cache
        tokio::time::sleep(Duration::from_millis(1_000)).await;

        let btc = currencies.get("BTC").unwrap();
        let mut cln = btc.cln.clone().unwrap();

        let channels = cln.list_channels(None).await.unwrap();

        let channel = &channels[0];
        let dest_node = &channel.destination;

        let channel_info = lightning_info.get_channels("BTC", dest_node).await;
        assert!(channel_info.is_ok());

        let channels = channel_info.unwrap();
        assert!(!channels.is_empty());
    }

    #[rstest]
    #[case("770697178071957505", "700945x2144x1")]
    #[case("983071147500699649", "894098x1975x1")]
    #[case("982893026614312960", "893936x1934x0")]
    #[case("982865538763587585", "893911x1018x1")]
    #[case("982274001646911489", "893373x3140x1")]
    fn test_scid_lnd_to_cln(#[case] lnd_scid: &str, #[case] expected: &str) {
        let result = ClnLightningInfo::scid_lnd_to_cln(lnd_scid);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), expected);
    }

    #[test]
    fn test_scid_lnd_to_cln_invalid_input() {
        let result = ClnLightningInfo::scid_lnd_to_cln("not a number");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_cache_keys() {
        let symbol = "BTC";
        let id = "03abcdef1234567890".to_string();

        let (key, field) = ClnLightningInfo::cache_key_node(symbol, id.clone());
        assert_eq!(key, "cln:BTC:node");
        assert_eq!(field, id);

        let (key, field) = ClnLightningInfo::cache_key_channels(symbol, id.clone());
        assert_eq!(key, "cln:BTC:channels");
        assert_eq!(field, id);
    }

    #[tokio::test]
    async fn test_nonexistent_node() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let lightning_info = ClnLightningInfo::new(cache, currencies);

        let fake_node_id = vec![0; 33];

        // We should get an error when trying to get info for a nonexistent node
        let result = lightning_info.get_node_info("BTC", &fake_node_id).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "node not found");

        // Same for channels
        let result = lightning_info.get_channels("BTC", &fake_node_id).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "no channels for node");
    }
}
