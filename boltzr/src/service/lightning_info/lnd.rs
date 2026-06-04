use super::{Channel, ChannelPolicy, GossipSource, Node, SourceGossip};
use crate::chain::BaseClient;
use crate::lightning::lnd::Lnd;
use crate::lightning::lnd::lnd_rpc::{LightningNode, RoutingPolicy};
use anyhow::{Context, Result};
use async_trait::async_trait;

pub(super) struct LndSource {
    lnd: Lnd,
}

impl LndSource {
    pub(super) fn new(lnd: Lnd) -> Self {
        Self { lnd }
    }
}

#[async_trait]
impl GossipSource for LndSource {
    fn label(&self) -> String {
        format!("LND {} {}", self.lnd.symbol(), self.lnd.node_id())
    }

    async fn fetch(&mut self) -> Result<SourceGossip> {
        let graph = self.lnd.describe_graph().await?;

        let nodes = graph.nodes.into_iter().map(lnd_node_to_node).collect();

        let mut channels = Vec::with_capacity(graph.edges.len() * 2);
        for edge in graph.edges {
            let scid = scid_lnd_to_cln_u64(edge.channel_id);
            for (source_pub, dest_pub, policy) in [
                (&edge.node1_pub, &edge.node2_pub, edge.node1_policy.as_ref()),
                (&edge.node2_pub, &edge.node1_pub, edge.node2_policy.as_ref()),
            ] {
                let Some(policy) = policy else {
                    continue;
                };
                let source = Node {
                    id: source_pub.to_lowercase(),
                    alias: None,
                    color: None,
                };
                channels.push(lnd_edge_side_to_channel(
                    source,
                    dest_pub.to_lowercase(),
                    scid.clone(),
                    edge.capacity,
                    policy,
                )?);
            }
        }

        Ok(SourceGossip { nodes, channels })
    }
}

fn lnd_node_to_node(node: LightningNode) -> Node {
    Node {
        id: node.pub_key.to_lowercase(),
        alias: if node.alias.is_empty() {
            None
        } else {
            Some(node.alias)
        },
        color: if node.color.is_empty() {
            None
        } else {
            Some(node.color.trim_start_matches('#').to_lowercase())
        },
    }
}

fn lnd_edge_side_to_channel(
    source: Node,
    destination: String,
    short_channel_id: String,
    capacity_sat: i64,
    policy: &RoutingPolicy,
) -> Result<Channel> {
    let active = !policy.disabled;
    let capacity_sat = if capacity_sat > 0 {
        Some(u64::try_from(capacity_sat).context("invalid LND channel capacity")?)
    } else {
        None
    };
    let policy_struct = ChannelPolicy {
        active,
        base_fee_millisatoshi: u32::try_from(policy.fee_base_msat)
            .context("invalid LND base fee millisatoshi")?,
        fee_ppm: u32::try_from(policy.fee_rate_milli_msat)
            .context("invalid LND proportional fee")?,
        delay: policy.time_lock_delta,
        htlc_minimum_millisatoshi: Some(
            u64::try_from(policy.min_htlc).context("invalid LND minimum HTLC millisatoshi")?,
        ),
        htlc_maximum_millisatoshi: if policy.max_htlc_msat > 0 {
            Some(policy.max_htlc_msat)
        } else {
            None
        },
    };
    Ok(Channel {
        source,
        destination,
        short_channel_id,
        capacity_sat,
        active,
        info: policy_struct,
    })
}

/// Convert an LND numeric short channel id (as a decimal string) into the
/// CLN `block x tx x output` format the cache is keyed by.
pub(super) fn scid_lnd_to_cln(s: &str) -> Result<String> {
    let big: u64 = s.parse::<u64>()?;
    Ok(scid_lnd_to_cln_u64(big))
}

pub(super) fn scid_lnd_to_cln_u64(channel_id: u64) -> String {
    let block: u64 = channel_id >> 40;
    let tx: u64 = (channel_id >> 16) & 0x00FF_FFFF;
    let output: u64 = channel_id & 0xFFFF;
    format!("{block}x{tx}x{output}")
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::lightning::lnd::test::lnd_client;
    use rstest::rstest;

    #[rstest]
    #[case("770697178071957505", "700945x2144x1")]
    #[case("983071147500699649", "894098x1975x1")]
    #[case("982893026614312960", "893936x1934x0")]
    #[case("982865538763587585", "893911x1018x1")]
    #[case("982274001646911489", "893373x3140x1")]
    fn test_scid_lnd_to_cln(#[case] lnd_scid: &str, #[case] expected: &str) {
        let result = scid_lnd_to_cln(lnd_scid);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), expected);
    }

    #[test]
    fn test_scid_lnd_to_cln_invalid_input() {
        let result = scid_lnd_to_cln("not a number");
        assert!(result.is_err());
    }

    #[test]
    fn test_lnd_node_to_node() {
        let n = lnd_node_to_node(LightningNode {
            last_update: 0,
            pub_key: "03ABCDEF".to_string(),
            alias: "Alice".to_string(),
            addresses: vec![],
            color: "#ff00aa".to_string(),
            features: Default::default(),
            custom_records: Default::default(),
        });
        assert_eq!(n.id, "03abcdef");
        assert_eq!(n.alias.as_deref(), Some("Alice"));
        assert_eq!(n.color.as_deref(), Some("ff00aa"));

        let n = lnd_node_to_node(LightningNode {
            last_update: 0,
            pub_key: "02DEAD".to_string(),
            alias: "".to_string(),
            addresses: vec![],
            color: "".to_string(),
            features: Default::default(),
            custom_records: Default::default(),
        });
        assert_eq!(n.id, "02dead");
        assert_eq!(n.alias, None);
        assert_eq!(n.color, None);
    }

    #[test]
    fn test_lnd_edge_side_to_channel_disabled_polarity() {
        let source = Node {
            id: "03aaaa".to_string(),
            alias: None,
            color: None,
        };
        let policy = RoutingPolicy {
            time_lock_delta: 40,
            min_htlc: 1_000,
            fee_base_msat: 1_500,
            fee_rate_milli_msat: 250,
            disabled: true,
            max_htlc_msat: 100_000,
            last_update: 0,
            custom_records: Default::default(),
            inbound_fee_base_msat: 0,
            inbound_fee_rate_milli_msat: 0,
        };
        let channel = lnd_edge_side_to_channel(
            source,
            "03bbbb".to_string(),
            "1x2x3".to_string(),
            5_000_000,
            &policy,
        )
        .unwrap();

        assert!(!channel.active);
        assert!(!channel.info.active);
        assert_eq!(channel.info.base_fee_millisatoshi, 1_500);
        assert_eq!(channel.info.fee_ppm, 250);
        assert_eq!(channel.info.delay, 40);
        assert_eq!(channel.info.htlc_minimum_millisatoshi, Some(1_000));
        assert_eq!(channel.info.htlc_maximum_millisatoshi, Some(100_000));
        assert_eq!(channel.capacity_sat, Some(5_000_000));
        assert_eq!(channel.short_channel_id, "1x2x3");
        assert_eq!(channel.destination, "03bbbb");
    }

    #[test]
    fn test_lnd_edge_side_max_htlc_zero_omitted() {
        let policy = RoutingPolicy {
            time_lock_delta: 0,
            min_htlc: 0,
            fee_base_msat: 0,
            fee_rate_milli_msat: 0,
            disabled: false,
            max_htlc_msat: 0,
            last_update: 0,
            custom_records: Default::default(),
            inbound_fee_base_msat: 0,
            inbound_fee_rate_milli_msat: 0,
        };
        let channel = lnd_edge_side_to_channel(
            Node {
                id: "03a".to_string(),
                alias: None,
                color: None,
            },
            "03b".to_string(),
            "1x2x3".to_string(),
            0,
            &policy,
        )
        .unwrap();
        assert_eq!(channel.info.htlc_maximum_millisatoshi, None);
        assert_eq!(channel.capacity_sat, None);
        assert!(channel.active);
    }

    #[test]
    fn test_lnd_edge_side_rejects_invalid_signed_values() {
        let source = Node {
            id: "03a".to_string(),
            alias: None,
            color: None,
        };
        let base_policy = RoutingPolicy {
            time_lock_delta: 0,
            min_htlc: 0,
            fee_base_msat: 0,
            fee_rate_milli_msat: 0,
            disabled: false,
            max_htlc_msat: 0,
            last_update: 0,
            custom_records: Default::default(),
            inbound_fee_base_msat: 0,
            inbound_fee_rate_milli_msat: 0,
        };

        for policy in [
            RoutingPolicy {
                fee_base_msat: -1,
                ..base_policy.clone()
            },
            RoutingPolicy {
                fee_rate_milli_msat: -1,
                ..base_policy.clone()
            },
            RoutingPolicy {
                min_htlc: -1,
                ..base_policy
            },
        ] {
            assert!(
                lnd_edge_side_to_channel(
                    source.clone(),
                    "03b".to_string(),
                    "1x2x3".to_string(),
                    0,
                    &policy,
                )
                .is_err()
            );
        }
    }

    #[tokio::test]
    async fn test_lnd_source_fetch_returns_nodes_and_channels() {
        let mut source = LndSource::new(lnd_client("lnd1", 10_009).await);

        // A single fetch yields both nodes and channels from one DescribeGraph.
        let gossip = source.fetch().await.expect("fetch ok");

        assert!(!gossip.nodes.is_empty());
        assert!(!gossip.channels.is_empty());
        // Each channel is one direction of an edge, keyed in CLN scid format.
        assert!(
            gossip
                .channels
                .iter()
                .all(|c| c.short_channel_id.contains('x'))
        );
    }
}
