use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::swap::manager::SwapManager;
use anyhow::{Result, anyhow};
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use boltz_evm::quoter::{Call, Data as QuoterData, QuoteAggregator};
use boltz_evm::{Address, U256};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

const NO_QUOTES_FOUND: &str = "no quotes found";

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
}

#[derive(Deserialize)]
pub struct QuoteInputParams {
    #[serde(flatten)]
    pub params: QuoteParams,
    #[serde(rename = "amountIn")]
    pub amount_in: U256,
}

#[derive(Deserialize)]
pub struct QuoteOutputParams {
    #[serde(flatten)]
    pub params: QuoteParams,
    #[serde(rename = "amountOut")]
    pub amount_out: U256,
}

#[derive(Serialize)]
pub struct QuoteResponse {
    #[serde(serialize_with = "boltz_evm::serde_utils::u256::serialize")]
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

pub async fn quote_input<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(path): Path<QuotePath>,
    Query(params): Query<QuoteInputParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let mut quotes = get_quote_aggregator(&state, &path.currency)?
        .quote_input(
            params.params.token_in,
            params.params.token_out,
            params.amount_in,
        )
        .await?
        .into_iter()
        .map(|(quote, data)| QuoteResponse { quote, data })
        .collect::<Vec<_>>();

    if quotes.is_empty() {
        return Err(AxumError::new(
            StatusCode::NOT_FOUND,
            anyhow!(NO_QUOTES_FOUND),
        ));
    }

    // Descending order
    quotes.sort_by(|a, b| b.quote.cmp(&a.quote));

    Ok((StatusCode::OK, Json(quotes)).into_response())
}

pub async fn quote_output<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(path): Path<QuotePath>,
    Query(params): Query<QuoteOutputParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let mut quotes = get_quote_aggregator(&state, &path.currency)?
        .quote_output(
            params.params.token_in,
            params.params.token_out,
            params.amount_out,
        )
        .await?
        .into_iter()
        .map(|(quote, data)| QuoteResponse { quote, data })
        .collect::<Vec<_>>();

    if quotes.is_empty() {
        return Err(AxumError::new(
            StatusCode::NOT_FOUND,
            anyhow!(NO_QUOTES_FOUND),
        ));
    }

    // Ascending order
    quotes.sort_by(|a, b| a.quote.cmp(&b.quote));

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
