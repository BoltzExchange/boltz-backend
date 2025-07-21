use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::evm::quoter::{Call, Data as QuoterData, QuoteAggregator};
use crate::swap::manager::SwapManager;
use alloy::primitives::{Address, U256};
use anyhow::{Result, anyhow};
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct QuotePath {
    pub currency: String,
}

#[derive(Deserialize)]
pub struct QuoteParams {
    #[serde(rename = "tokenIn")]
    pub token_in: Address,
    #[serde(rename = "tokenOut")]
    pub token_out: Address,
    #[serde(rename = "amountIn")]
    pub amount_in: U256,
}

#[derive(Serialize)]
pub struct QuoteResponse {
    #[serde(serialize_with = "crate::utils::serde::u256::serialize")]
    pub quote: U256,
    pub data: QuoterData,
}

#[derive(Deserialize)]
pub struct EncodeParams {
    pub data: QuoterData,
    pub recipient: Address,
    #[serde(rename = "amountIn")]
    pub amount_in: U256,
    #[serde(rename = "amountOutMin")]
    pub amount_out_min: U256,
}

#[derive(Serialize)]
pub struct EncodeResponse {
    pub calls: Vec<Call>,
}

pub async fn quote<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(path): Path<QuotePath>,
    Query(params): Query<QuoteParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let mut quotes = get_quote_aggregator(&state, &path.currency)?
        .quote(params.token_in, params.token_out, params.amount_in)
        .await?
        .into_iter()
        .map(|(quote, data)| QuoteResponse { quote, data })
        .collect::<Vec<_>>();

    // Descending order
    quotes.sort_by(|a, b| b.quote.cmp(&a.quote));

    Ok((StatusCode::OK, Json(quotes)).into_response())
}

pub async fn encode<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(path): Path<QuotePath>,
    Json(params): Json<EncodeParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let encoded = get_quote_aggregator(&state, &path.currency)?.encode(
        params.data,
        params.recipient,
        params.amount_in,
        params.amount_out_min,
    )?;

    Ok((StatusCode::OK, Json(EncodeResponse { calls: encoded })).into_response())
}

fn get_quote_aggregator<S, M>(
    state: &Arc<ServerState<S, M>>,
    symbol: &str,
) -> Result<QuoteAggregator, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let currency = match state.manager.get_currency(symbol) {
        Some(currency) => currency,
        None => {
            return Err(AxumError::new(
                StatusCode::NOT_FOUND,
                anyhow!("currency not found: {}", symbol),
            ));
        }
    };

    match currency.evm_manager {
        Some(manager) => Ok(manager.quote_aggregator.clone()),
        None => Err(AxumError::new(
            StatusCode::NOT_FOUND,
            anyhow!("quoter not supported for currency {}", symbol),
        )),
    }
}
