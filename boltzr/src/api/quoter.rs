use crate::api::ServerState;
use crate::api::errors::{ApiError, AxumError};
use crate::api::ws::status::SwapInfos;
use crate::evm::quoter::Data as QuoterData;
use crate::swap::manager::SwapManager;
use alloy::primitives::{Address, U256};
use anyhow::Result;
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

pub async fn quote<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(path): Path<QuotePath>,
    Query(params): Query<QuoteParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let currency = match state.manager.get_currency(&path.currency) {
        Some(currency) => currency,
        None => {
            return Ok((
                StatusCode::NOT_FOUND,
                Json(ApiError {
                    error: format!("currency not found: {}", path.currency),
                }),
            )
                .into_response());
        }
    };

    let quotes = match currency.evm_manager {
        Some(manager) => {
            manager
                .quote_aggregator
                .quote(params.token_in, params.token_out, params.amount_in)
                .await?
        }
        None => {
            return Ok((
                StatusCode::NOT_FOUND,
                Json(ApiError {
                    error: format!("quoter not supported for currency {}", path.currency),
                }),
            )
                .into_response());
        }
    };

    let mut quotes = quotes
        .into_iter()
        .map(|(quote, data)| QuoteResponse { quote, data })
        .collect::<Vec<_>>();

    // Descending order
    quotes.sort_by(|a, b| b.quote.cmp(&a.quote));

    Ok((StatusCode::OK, Json(quotes)).into_response())
}
