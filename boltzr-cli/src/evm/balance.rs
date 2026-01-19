use crate::evm::utils::{IERC20, Keys, amount_to_token_units, get_provider, token_decimals};
use alloy::{
    primitives::{Address, U256},
    providers::Provider,
};
use anyhow::Result;

pub async fn get_balance(rpc_url: &str, keys: Keys, token: Option<Address>) -> Result<U256> {
    let (provider, signer) = get_provider(rpc_url, keys)?;
    let address = signer.address();

    match token {
        Some(token_address) => {
            let contract = IERC20::new(token_address, provider);
            let balance = contract.balanceOf(address).call().await?;
            Ok(balance)
        }
        None => {
            let balance = provider.get_balance(address).await?;
            Ok(balance)
        }
    }
}

pub async fn approve(
    rpc_url: &str,
    keys: Keys,
    token: Address,
    spender: Address,
    amount: crate::parsers::Amount,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let decimals = token_decimals(&provider, token).await;
    let amount = amount_to_token_units(amount, decimals)?;
    let contract = IERC20::new(token, provider);

    let tx = contract
        .approve(spender, amount)
        .send()
        .await?
        .with_required_confirmations(1)
        .watch()
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}
