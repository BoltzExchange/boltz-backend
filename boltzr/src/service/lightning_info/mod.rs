use crate::currencies::{Currencies, Currency};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use boltz_cache::Cache;
use rapidfuzz::distance::jaro_winkler;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, info, instrument, warn};

mod cln;
mod lnd;

use cln::ClnSource;
use lnd::LndSource;

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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Channel {
    pub source: Node,
    #[serde(skip, default)]
    pub destination: String,
    #[serde(rename = "shortChannelId")]
    pub short_channel_id: String,
    #[serde(rename = "capacity", skip_serializing_if = "Option::is_none")]
    pub capacity_sat: Option<u64>,
    pub active: bool,
    pub info: ChannelPolicy,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
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

#[async_trait]
pub trait LightningInfo {
    async fn find_node_by_alias(&self, symbol: &str, alias: &str) -> Result<Vec<Node>>;
    async fn get_channels(&self, symbol: &str, destination: &[u8]) -> Result<Vec<Channel>>;
    async fn get_channel(&self, symbol: &str, short_channel_id: String) -> Result<ChannelInfo>;
    async fn get_node_info(&self, symbol: &str, node: &[u8]) -> Result<Node>;
}

/// One source's view of the gossip graph. Channel `source` nodes carry only
/// their id here; the orchestrator enriches them from the merged node set.
struct SourceGossip {
    nodes: Vec<Node>,
    channels: Vec<Channel>,
}

#[async_trait]
trait GossipSource: Send {
    fn label(&self) -> String;
    async fn fetch(&mut self) -> Result<SourceGossip>;
}

#[derive(Clone)]
pub struct GraphLightningInfo {
    cache: Cache,
    currencies: Currencies,

    nodes: Arc<RwLock<HashMap<String, HashMap<String, Node>>>>,
}

impl GraphLightningInfo {
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

                    for (symbol, currency) in info.currencies.iter() {
                        let start = Instant::now();
                        match info.update_cache(symbol, currency).await {
                            Ok(true) => {
                                debug!(
                                    "Updated {} lightning gossip in: {:?}",
                                    symbol,
                                    start.elapsed()
                                );
                            }
                            // No lightning clients configured for the currency
                            Ok(false) => {}
                            Err(err) => {
                                warn!("Updating {} lightning gossip failed: {}", symbol, err);
                            }
                        }
                    }
                }
            });
        }

        info
    }

    /// Returns `false` when the currency has no lightning clients configured
    /// and there was nothing to update.
    #[instrument(name = "GraphLightningInfo::update_cache", skip_all, fields(symbol = symbol))]
    async fn update_cache(&self, symbol: &str, currency: &Currency) -> Result<bool> {
        let mut sources = build_sources(currency);
        if sources.is_empty() {
            return Ok(false);
        }

        info!("Updating {} lightning gossip", symbol);

        let labels: Vec<String> = sources.iter().map(|s| s.label()).collect();
        let results = futures::future::join_all(sources.iter_mut().map(|s| s.fetch())).await;

        let (merged_nodes, all_channels) = merge_gossip_results(labels, results)?;

        let node_key = Self::cache_key_node(symbol);
        for node in merged_nodes.values() {
            self.cache
                .set(&node_key, &node.id, node, Some(CACHE_TTL_SECS))
                .await?;
        }

        self.store_channels(symbol, all_channels, &merged_nodes)
            .await?;

        self.nodes
            .write()
            .await
            .insert(symbol.to_string(), merged_nodes);

        Ok(true)
    }

    async fn store_channels(
        &self,
        symbol: &str,
        channels: Vec<Channel>,
        nodes: &HashMap<String, Node>,
    ) -> Result<()> {
        let mut channels_by_dest: HashMap<String, Vec<Channel>> = HashMap::new();
        let mut channel_infos: HashMap<String, ChannelInfo> = HashMap::new();
        let mut seen: std::collections::HashSet<(String, String)> =
            std::collections::HashSet::new();

        for mut channel in channels {
            let key = (channel.short_channel_id.clone(), channel.source.id.clone());
            if !seen.insert(key) {
                continue;
            }

            if let Some(node) = nodes.get(&channel.source.id) {
                channel.source = node.clone();
            }

            channel_infos
                .entry(channel.short_channel_id.clone())
                .or_insert_with(|| ChannelInfo {
                    short_channel_id: channel.short_channel_id.clone(),
                    capacity_sat: channel.capacity_sat,
                    policies: Vec::new(),
                })
                .policies
                .push(ChannelInfoSide {
                    node: channel.source.clone(),
                    policy: channel.info.clone(),
                });

            channels_by_dest
                .entry(channel.destination.clone())
                .or_default()
                .push(channel);
        }

        let channels_key = Self::cache_key_channels(symbol);
        for (destination, channels) in channels_by_dest {
            self.cache
                .set(&channels_key, &destination, &channels, Some(CACHE_TTL_SECS))
                .await?;
        }

        let channel_key = Self::cache_key_channel(symbol);
        for (short_channel_id, channel_info) in channel_infos {
            self.cache
                .set(
                    &channel_key,
                    &short_channel_id,
                    &channel_info,
                    Some(CACHE_TTL_SECS),
                )
                .await?;
        }

        Ok(())
    }

    fn cache_key_node(symbol: &str) -> String {
        format!("gossip:{symbol}:node")
    }

    fn cache_key_channel(symbol: &str) -> String {
        format!("gossip:{symbol}:channel")
    }

    fn cache_key_channels(symbol: &str) -> String {
        format!("gossip:{symbol}:channels")
    }
}

fn merge_node(dest: &mut HashMap<String, Node>, incoming: Node) {
    match dest.get_mut(&incoming.id) {
        Some(existing) => {
            if existing.alias.as_deref().unwrap_or("").is_empty()
                && incoming.alias.as_ref().is_some_and(|a| !a.is_empty())
            {
                existing.alias = incoming.alias;
            }
            if existing.color.as_deref().unwrap_or("").is_empty()
                && incoming.color.as_ref().is_some_and(|c| !c.is_empty())
            {
                existing.color = incoming.color;
            }
        }
        None => {
            dest.insert(incoming.id.clone(), incoming);
        }
    }
}

fn merge_gossip_results(
    labels: Vec<String>,
    results: Vec<Result<SourceGossip>>,
) -> Result<(HashMap<String, Node>, Vec<Channel>)> {
    let mut successful_sources = 0;
    let mut merged_nodes: HashMap<String, Node> = HashMap::new();
    let mut all_channels: Vec<Channel> = Vec::new();

    for (label, result) in labels.into_iter().zip(results) {
        match result {
            Ok(gossip) => {
                successful_sources += 1;
                for node in gossip.nodes {
                    merge_node(&mut merged_nodes, node);
                }
                all_channels.extend(gossip.channels);
            }
            Err(err) => warn!("Fetching gossip from {} failed: {}", label, err),
        }
    }

    if successful_sources == 0 {
        return Err(anyhow!("fetching gossip failed for all sources"));
    }

    Ok((merged_nodes, all_channels))
}

fn build_sources(currency: &Currency) -> Vec<Box<dyn GossipSource>> {
    let mut sources: Vec<Box<dyn GossipSource>> = Vec::new();
    if let Some(cln) = &currency.cln {
        sources.push(Box::new(ClnSource::new(cln.clone())));
    }
    let mut lnd_keys: Vec<&String> = currency.lnds.keys().collect();
    lnd_keys.sort();
    for key in lnd_keys {
        if let Some(lnd) = currency.lnds.get(key) {
            sources.push(Box::new(LndSource::new(lnd.clone())));
        }
    }
    sources
}

#[async_trait]
impl LightningInfo for GraphLightningInfo {
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
        let key = Self::cache_key_channels(symbol);
        if let Some(channels) = self.cache.get(&key, &hex::encode(destination)).await? {
            return Ok(channels);
        }

        Err(anyhow!("no channels for node"))
    }

    async fn get_channel(&self, symbol: &str, short_channel_id: String) -> Result<ChannelInfo> {
        let short_channel_id = short_channel_id.to_lowercase();
        let short_channel_id = match short_channel_id.contains("x") {
            true => short_channel_id,
            false => lnd::scid_lnd_to_cln(&short_channel_id)?,
        };

        let key = Self::cache_key_channel(symbol);
        if let Some(channel) = self.cache.get(&key, &short_channel_id).await? {
            return Ok(channel);
        }

        Err(anyhow!("channel not found"))
    }

    async fn get_node_info(&self, symbol: &str, node: &[u8]) -> Result<Node> {
        let key = Self::cache_key_node(symbol);
        if let Some(node) = self.cache.get(&key, &hex::encode(node)).await? {
            return Ok(node);
        }

        Err(anyhow!("node not found"))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::{Currencies, Currency};
    use crate::lightning::cln::Cln;
    use crate::lightning::cln::test::cln_client;
    use crate::lightning::lnd::Lnd;
    use crate::lightning::lnd::test::lnd_client;
    use crate::wallet::{Bitcoin, Network};
    use bip39::Mnemonic;
    use boltz_cache::{Cache, MemCache};
    use std::collections::HashMap;
    use std::str::FromStr;
    use std::sync::Arc;
    use std::time::Duration;

    async fn get_currencies() -> Currencies {
        build_currencies(Some(cln_client().await), HashMap::new()).await
    }

    async fn build_currencies(cln: Option<Cln>, lnds: HashMap<String, Lnd>) -> Currencies {
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
                        Arc::new(crate::chain::chain_client::test::get_client().await),
                    )
                    .unwrap(),
                )),
                chain: Some(Arc::new(
                    crate::chain::chain_client::test::get_client().await,
                )),
                cln,
                lnds,
                evm_manager: None,
            },
        )]))
    }

    async fn lnd_only_currencies(node: &str, port: u16) -> (Currencies, Lnd) {
        let lnd = lnd_client(node, port).await;
        let mut lnds = HashMap::new();
        lnds.insert(lnd.node_id().to_string(), lnd.clone());
        (build_currencies(None, lnds).await, lnd)
    }

    #[tokio::test]
    async fn test_find_node_by_alias() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let info = GraphLightningInfo::new(cache.clone(), currencies.clone());

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

        let lightning_info = GraphLightningInfo::new(cache.clone(), currencies.clone());

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

        let lightning_info = GraphLightningInfo::new(cache.clone(), currencies.clone());

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

    #[test]
    fn test_cache_keys() {
        assert_eq!(GraphLightningInfo::cache_key_node("BTC"), "gossip:BTC:node");
        assert_eq!(
            GraphLightningInfo::cache_key_channel("BTC"),
            "gossip:BTC:channel"
        );
        assert_eq!(
            GraphLightningInfo::cache_key_channels("BTC"),
            "gossip:BTC:channels"
        );
    }

    #[tokio::test]
    async fn test_nonexistent_node() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let currencies = get_currencies().await;

        let lightning_info = GraphLightningInfo::new(cache, currencies);

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

    /// Sleep until `f` returns `Ok`, or fail after `max_ms`. Cache reads can lag
    /// the spawned refresh task, especially when fanning out to multiple nodes.
    async fn wait_until<T, F, Fut>(max_ms: u64, mut f: F) -> Result<T>
    where
        F: FnMut() -> Fut,
        Fut: std::future::Future<Output = Result<T>>,
    {
        let start = Instant::now();
        loop {
            match f().await {
                Ok(v) => return Ok(v),
                Err(err) => {
                    if start.elapsed() >= Duration::from_millis(max_ms) {
                        return Err(err);
                    }
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
            }
        }
    }

    #[tokio::test]
    async fn test_lnd_only_get_node_info() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let (currencies, lnd) = lnd_only_currencies("lnd1", 10_009).await;

        let info = GraphLightningInfo::new(cache, currencies);

        let node_bytes = hex::decode(lnd.node_id()).unwrap();
        let node = wait_until(5_000, || async {
            info.get_node_info("BTC", &node_bytes).await
        })
        .await
        .expect("LND-known node should appear in cache");

        assert_eq!(node.id, lnd.node_id().to_lowercase());
    }

    #[tokio::test]
    async fn test_lnd_only_get_channels() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let (currencies, mut lnd) = lnd_only_currencies("lnd1", 10_009).await;

        let info = GraphLightningInfo::new(cache, currencies);

        let graph = lnd.describe_graph().await.unwrap();
        let edge = graph
            .edges
            .first()
            .expect("regtest LND should know at least one channel");

        // Use node1 as the destination side.
        let dest_bytes = hex::decode(edge.node1_pub.to_lowercase()).unwrap();

        let channels = wait_until(5_000, || async {
            info.get_channels("BTC", &dest_bytes).await
        })
        .await
        .expect("LND-known channel should be cached by destination");

        assert!(!channels.is_empty());
        assert!(
            channels.iter().any(|c| c.short_channel_id.contains('x')
                && c.source.id != edge.node1_pub.to_lowercase())
        );
    }

    #[tokio::test]
    async fn test_lnd_only_get_channel_by_scid() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let (currencies, mut lnd) = lnd_only_currencies("lnd1", 10_009).await;

        let info = GraphLightningInfo::new(cache, currencies);

        let graph = lnd.describe_graph().await.unwrap();
        let edge = graph
            .edges
            .first()
            .expect("regtest LND should know at least one channel");

        // Look the channel up by its raw u64 SCID (LND format) - the lookup
        // should auto-convert to the CLN-format key the cache uses.
        let lnd_scid = edge.channel_id.to_string();
        let channel_info = wait_until(5_000, || async {
            info.get_channel("BTC", lnd_scid.clone()).await
        })
        .await
        .expect("LND channel must resolve via numeric SCID");

        assert_eq!(
            channel_info.short_channel_id,
            lnd::scid_lnd_to_cln_u64(edge.channel_id)
        );
        assert!(!channel_info.policies.is_empty());
    }

    #[tokio::test]
    async fn test_merged_cln_and_lnd_alias_search() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let cln = cln_client().await;
        let lnd = lnd_client("lnd1", 10_009).await;
        let lnd_id = lnd.node_id().to_string();
        let mut lnds = HashMap::new();
        lnds.insert(lnd_id.clone(), lnd);

        let currencies = build_currencies(Some(cln), lnds).await;
        let info = GraphLightningInfo::new(cache, currencies);

        // Wait for the in-memory node map to be populated by the refresh task.
        wait_until(5_000, || async {
            let nodes = info.nodes.read().await;
            let map = nodes.get("BTC");
            if map.is_some_and(|m| m.contains_key(&lnd_id)) {
                Ok(())
            } else {
                Err(anyhow!("not yet populated"))
            }
        })
        .await
        .expect("merged node map should contain the LND node");

        let map = info.nodes.read().await;
        let entry = map
            .get("BTC")
            .and_then(|m| m.get(&lnd_id))
            .expect("LND node must be in merged set");
        assert_eq!(entry.id, lnd_id);
    }

    #[tokio::test]
    async fn test_merged_cln_and_lnd_dedup_channel_directions() {
        let mem_cache = MemCache::new();
        let cache = Cache::Memory(mem_cache);
        let cln = cln_client().await;
        let lnd = lnd_client("lnd1", 10_009).await;
        let mut lnds = HashMap::new();
        lnds.insert(lnd.node_id().to_string(), lnd);

        let currencies = build_currencies(Some(cln), lnds).await;
        let info = GraphLightningInfo::new(cache, currencies.clone());

        // Pick any well-known SCID from CLN's view of the graph.
        let mut cln = currencies.get("BTC").unwrap().cln.clone().unwrap();
        let raw_channels = cln.list_channels(None).await.unwrap();
        let public_channel = raw_channels
            .iter()
            .find(|c| c.public)
            .expect("regtest should have at least one public channel");
        let scid = public_channel.short_channel_id.clone();

        let channel_info = wait_until(5_000, || async {
            info.get_channel("BTC", scid.clone()).await
        })
        .await
        .expect("public channel should be in merged cache");

        // CLN+LND both report the channel - we should still see at most two
        // sides total (one per source pubkey direction).
        assert!(channel_info.policies.len() <= 2);

        // Source pubkeys must be unique - merge dedupes by (scid, source).
        let mut sources: Vec<String> = channel_info
            .policies
            .iter()
            .map(|p| p.node.id.clone())
            .collect();
        sources.sort();
        let unique = sources.clone();
        sources.dedup();
        assert_eq!(sources, unique, "duplicate sides in merged ChannelInfo");
    }

    #[test]
    fn test_merge_node_prefers_non_empty() {
        let mut map = HashMap::new();
        merge_node(
            &mut map,
            Node {
                id: "abc".to_string(),
                alias: None,
                color: None,
            },
        );
        merge_node(
            &mut map,
            Node {
                id: "abc".to_string(),
                alias: Some("Hello".to_string()),
                color: Some("00ff00".to_string()),
            },
        );
        let n = map.get("abc").unwrap();
        assert_eq!(n.alias.as_deref(), Some("Hello"));
        assert_eq!(n.color.as_deref(), Some("00ff00"));

        // First non-empty wins.
        merge_node(
            &mut map,
            Node {
                id: "abc".to_string(),
                alias: Some("Other".to_string()),
                color: Some("ff0000".to_string()),
            },
        );
        let n = map.get("abc").unwrap();
        assert_eq!(n.alias.as_deref(), Some("Hello"));
        assert_eq!(n.color.as_deref(), Some("00ff00"));
    }

    #[test]
    fn test_merge_gossip_results_fails_when_all_sources_fail() {
        let result = merge_gossip_results(
            vec!["CLN BTC".to_string(), "LND BTC abc".to_string()],
            vec![
                Err(anyhow!("cln unavailable")),
                Err(anyhow!("lnd unavailable")),
            ],
        );

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "fetching gossip failed for all sources"
        );
    }

    #[test]
    fn test_merge_gossip_results_allows_partial_source_failure() {
        let (nodes, channels) = merge_gossip_results(
            vec!["CLN BTC".to_string(), "LND BTC abc".to_string()],
            vec![
                Err(anyhow!("cln unavailable")),
                Ok(SourceGossip {
                    nodes: vec![Node {
                        id: "abc".to_string(),
                        alias: Some("Boltz".to_string()),
                        color: None,
                    }],
                    channels: Vec::new(),
                }),
            ],
        )
        .unwrap();

        assert!(channels.is_empty());
        assert_eq!(nodes.get("abc").unwrap().alias.as_deref(), Some("Boltz"));
    }
}
