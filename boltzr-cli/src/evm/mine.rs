use crate::evm::{Keys, utils::get_provider};
use alloy::{providers::Provider, rpc::types::TransactionRequest};
use anyhow::Result;

pub async fn mine(rpc_url: &str, keys: Keys, blocks: u64) -> Result<()> {
    let (provider, signer) = get_provider(rpc_url, keys)?;
    let signer_address = signer.address();
    let nonce = provider.get_transaction_count(signer_address).await?;

    for i in nonce..nonce + blocks {
        provider
            .send_transaction(
                TransactionRequest::default()
                    .to(signer_address)
                    .nonce(i)
                    .into(),
            )
            .await?
            .with_required_confirmations(1)
            .watch()
            .await?;
    }

    Ok(())
}
