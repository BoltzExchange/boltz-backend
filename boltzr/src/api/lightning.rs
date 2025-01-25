use crate::api::errors::{ApiError, AxumError};
use crate::api::ws::status::SwapInfos;
use crate::api::ServerState;
use crate::service::ChannelFetchError;
use alloy::hex;
use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct LightningChannelsParams {
    currency: String,
    node: String,
}

pub async fn lightning_channels<S>(
    Extension(state): Extension<Arc<ServerState<S>>>,
    Path(LightningChannelsParams { node, currency }): Path<LightningChannelsParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
{
    let node = match hex::decode(node) {
        Ok(node) => node,
        Err(err) => {
            return Ok((
                StatusCode::BAD_REQUEST,
                Json(ApiError {
                    error: format!("invalid node: {}", err),
                }),
            )
                .into_response())
        }
    };

    Ok(
        match state
            .service
            .lightning_info
            .get_channels(&currency, node)
            .await
        {
            Ok(res) => (StatusCode::OK, Json(res)).into_response(),
            Err(err) => (
                match err {
                    ChannelFetchError::NoNode => StatusCode::NOT_FOUND,
                    ChannelFetchError::FetchError(_) => StatusCode::INTERNAL_SERVER_ERROR,
                },
                Json(ApiError {
                    error: match err {
                        ChannelFetchError::NoNode => "no node available".to_string(),
                        ChannelFetchError::FetchError(err) => format!("{}", err),
                    },
                }),
            )
                .into_response(),
        },
    )
}
