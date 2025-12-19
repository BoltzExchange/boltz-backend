use crate::evm::{Keys, utils::get_provider};
use alloy::{primitives::Address, providers::Provider, rpc::types::TransactionRequest};
use anyhow::Result;

pub async fn send_transaction(
    rpc_url: &str,
    keys: Keys,
    to: Address,
    amount: crate::parsers::Amount,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;

    let tx = provider
        .send_transaction(
            TransactionRequest::default()
                .to(to)
                .value(amount.try_into()?)
                .into(),
        )
        .await?
        .with_required_confirmations(1)
        .watch()
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}
