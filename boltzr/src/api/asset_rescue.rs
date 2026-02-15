use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::chain::elements_client::SYMBOL as ELEMENTS_SYMBOL;
use crate::swap::manager::SwapManager;
use crate::utils::serde::ElementsAddressDeserialize;
use anyhow::Result;
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct SetupRequest {
    #[serde(rename = "swapId")]
    swap_id: String,
    #[serde(rename = "transactionId")]
    transaction_id: String,
    vout: u32,
    destination: ElementsAddressDeserialize,
}

#[derive(Deserialize)]
pub struct BroadcastRequest {
    #[serde(rename = "swapId")]
    swap_id: String,
    #[serde(rename = "pubNonce", deserialize_with = "hex::deserialize")]
    pub_nonce: Vec<u8>,
    #[serde(rename = "partialSignature", deserialize_with = "hex::deserialize")]
    partial_signature: Vec<u8>,
}

#[derive(Serialize)]
pub struct MusigData {
    #[serde(rename = "serverPublicKey")]
    server_public_key: String,
    #[serde(rename = "pubNonce")]
    pub_nonce: String,
    message: String,
}

#[derive(Serialize)]
pub struct SetupResponse {
    musig: MusigData,
    transaction: String,
}

#[derive(Serialize)]
pub struct BroadcastResponse {
    #[serde(rename = "transactionId")]
    transaction_id: String,
}

pub async fn setup<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(params): Json<SetupRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    check_currency(&currency)?;

    let params = state
        .manager
        .get_asset_rescue()
        .create(
            &params.swap_id,
            &params.transaction_id,
            params.vout,
            &params.destination.0,
        )
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(SetupResponse {
            musig: MusigData {
                server_public_key: hex::encode(params.our_public_key),
                pub_nonce: hex::encode(params.pub_nonce),
                message: hex::encode(params.message),
            },
            transaction: params.transaction,
        }),
    ))
}

pub async fn broadcast<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(params): Json<BroadcastRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    check_currency(&currency)?;

    let transaction_id = state
        .manager
        .get_asset_rescue()
        .broadcast(
            &params.swap_id,
            &params.pub_nonce,
            &params.partial_signature,
        )
        .await?;

    Ok(Json(BroadcastResponse { transaction_id }))
}

fn check_currency(currency: &str) -> Result<(), AxumError> {
    if currency != ELEMENTS_SYMBOL {
        return Err(AxumError::new(
            StatusCode::BAD_REQUEST,
            anyhow::anyhow!("only {} is supported", ELEMENTS_SYMBOL),
        ));
    }

    Ok(())
}
