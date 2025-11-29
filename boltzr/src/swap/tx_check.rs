use crate::{
    chain::utils::Transaction,
    db::{
        helpers::{
            chain_swap::ChainSwapHelper, reverse_swap::ReverseSwapHelper,
            script_pubkey::ScriptPubKeyHelper,
        },
        models::{ChainSwapData, ChainSwapInfo, ReverseSwap, SomeSwap},
    },
};
use anyhow::{Context, Result};
use diesel::ExpressionMethods;
use std::sync::Arc;
use tracing::info;

struct SpentInput {
    swap_id: String,
    transaction_id: String,
    vout: u32,
}

impl TryFrom<ReverseSwap> for SpentInput {
    type Error = anyhow::Error;

    fn try_from(swap: ReverseSwap) -> Result<Self> {
        Ok(Self {
            swap_id: swap.id,
            transaction_id: swap
                .transactionId
                .ok_or(anyhow::anyhow!("transactionId is missing"))?,
            vout: swap
                .transactionVout
                .ok_or(anyhow::anyhow!("transactionVout is missing"))? as u32,
        })
    }
}

impl TryFrom<ChainSwapInfo> for SpentInput {
    type Error = anyhow::Error;

    fn try_from(swap: ChainSwapInfo) -> Result<Self> {
        let sending = swap.sending();

        Ok(Self {
            swap_id: swap.id(),
            transaction_id: sending
                .transactionId
                .clone()
                .context("transactionId is missing")?,
            vout: sending
                .transactionVout
                .clone()
                .context("transactionVout is missing")? as u32,
        })
    }
}

#[derive(Clone)]
pub struct TxChecker {
    scrip_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Send + Sync>,
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
}

impl TxChecker {
    pub fn new(
        scrip_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Send + Sync>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
    ) -> Self {
        Self {
            scrip_pubkey_helper,
            chain_swap_helper,
            reverse_swap_helper,
        }
    }

    pub fn check(&self, symbol: &str, tx: &Transaction) -> Result<Option<Vec<String>>> {
        let mut relevant = self.check_outputs(symbol, tx)?;
        relevant.append(&mut self.check_inputs(symbol, tx)?);

        Ok(if relevant.is_empty() {
            None
        } else {
            Some(relevant)
        })
    }

    fn check_outputs(&self, symbol: &str, tx: &Transaction) -> Result<Vec<String>> {
        let script_pubkeys = self
            .scrip_pubkey_helper
            .get_by_scripts(symbol, &tx.output_script_pubkeys())?;

        for script_pubkey in &script_pubkeys {
            info!(
                "Found output for Swap {} in {} transaction: {}",
                script_pubkey.swap_id,
                symbol,
                tx.txid_hex()
            );
        }

        Ok(script_pubkeys.into_iter().map(|spk| spk.swap_id).collect())
    }

    fn check_inputs(&self, symbol: &str, tx: &Transaction) -> Result<Vec<String>> {
        let outputs = tx
            .input_outpoints()
            .into_iter()
            .map(|o| alloy::hex::encode(o.hash))
            .collect::<Vec<_>>();

        let reverse_swaps = self.reverse_swap_helper.get_all_nullable(Box::new(
            crate::db::schema::reverseSwaps::dsl::transactionId.eq_any(outputs.clone()),
        ))?;
        let chain_swaps = self.chain_swap_helper.get_by_data_nullable(Box::new(
            crate::db::schema::chainSwapData::dsl::transactionId.eq_any(outputs),
        ))?;

        let mut relevant_swaps =
            Vec::<SpentInput>::with_capacity(reverse_swaps.len() + chain_swaps.len());
        for swap in reverse_swaps {
            relevant_swaps.push(swap.try_into()?);
        }
        for swap in chain_swaps {
            relevant_swaps.push(swap.try_into()?);
        }

        for swap in &relevant_swaps {
            info!(
                "Found spent input for Swap {} in {} transaction: {}",
                swap.swap_id,
                symbol,
                tx.txid_hex()
            );
        }

        Ok(relevant_swaps.into_iter().map(|s| s.swap_id).collect())
    }
}
