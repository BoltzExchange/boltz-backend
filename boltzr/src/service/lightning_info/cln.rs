use super::{Channel, ChannelPolicy, GossipSource, Node, SourceGossip};
use crate::chain::BaseClient;
use crate::lightning::cln::Cln;
use crate::lightning::cln::cln_rpc::ListchannelsChannels;
use anyhow::Result;
use async_trait::async_trait;

pub(super) struct ClnSource {
    cln: Cln,
}

impl ClnSource {
    pub(super) fn new(cln: Cln) -> Self {
        Self { cln }
    }
}

#[async_trait]
impl GossipSource for ClnSource {
    fn label(&self) -> String {
        format!("CLN {}", self.cln.symbol())
    }

    async fn fetch(&mut self) -> Result<SourceGossip> {
        let mut channels_client = self.cln.clone();
        let (raw_nodes, raw_channels) = tokio::try_join!(
            self.cln.list_nodes(None),
            channels_client.list_channels(None),
        )?;

        let nodes = raw_nodes
            .into_iter()
            .map(|node| Node {
                id: hex::encode(&node.nodeid),
                alias: node.alias,
                color: node.color.map(hex::encode),
            })
            .collect();

        let channels = raw_channels
            .into_iter()
            .filter(|ch| ch.public)
            .map(|ch| {
                let source = Node {
                    id: hex::encode(&ch.source),
                    alias: None,
                    color: None,
                };
                (ch, source).into()
            })
            .collect();

        Ok(SourceGossip { nodes, channels })
    }
}

impl From<(ListchannelsChannels, Node)> for Channel {
    fn from(v: (ListchannelsChannels, Node)) -> Self {
        Self {
            source: Node {
                id: hex::encode(&v.0.source),
                alias: v.1.alias,
                color: v.1.color,
            },
            destination: hex::encode(&v.0.destination),
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
