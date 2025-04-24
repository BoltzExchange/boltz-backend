use crate::api::ServerState;
use crate::api::errors::{ApiError, AxumError};
use crate::api::ws::status::SwapInfos;
use crate::swap::manager::SwapManager;
use alloy::hex;
use anyhow::Result;
use axum::extract::Path;
use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct LightningInfoParams {
    currency: String,
    node: String,
}

#[derive(Deserialize)]
pub struct SearchQuery {
    alias: String,
}

pub async fn node_info<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(LightningInfoParams { node, currency }): Path<LightningInfoParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let node = match decode_node(&node) {
        Ok(node) => node,
        Err(response) => return Ok(*response),
    };

    Ok(
        match state
            .service
            .lightning_info
            .get_node_info(&currency, &node)
            .await
        {
            Ok(res) => (StatusCode::OK, Json(res)).into_response(),
            Err(err) => handle_info_fetch_error(err),
        },
    )
}

pub async fn channels<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(LightningInfoParams { node, currency }): Path<LightningInfoParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let node = match decode_node(&node) {
        Ok(node) => node,
        Err(response) => return Ok(*response),
    };

    Ok(
        match state
            .service
            .lightning_info
            .get_channels(&currency, &node)
            .await
        {
            Ok(res) => (StatusCode::OK, Json(res)).into_response(),
            Err(err) => handle_info_fetch_error(err),
        },
    )
}

pub async fn search<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Query(query): Query<SearchQuery>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    Ok(
        match state
            .service
            .lightning_info
            .find_node_by_alias(&currency, &query.alias)
            .await
        {
            Ok(res) => (StatusCode::OK, Json(res)).into_response(),
            Err(err) => handle_info_fetch_error(err),
        },
    )
}

fn decode_node(node: &str) -> Result<Vec<u8>, Box<axum::http::Response<axum::body::Body>>> {
    fn invalid_node_response<E: std::fmt::Display>(
        err: E,
    ) -> axum::http::Response<axum::body::Body> {
        (
            StatusCode::BAD_REQUEST,
            Json(ApiError {
                error: format!("invalid node: {err}"),
            }),
        )
            .into_response()
    }

    Ok(match hex::decode(node) {
        Ok(node) => {
            if node.len() != 33 {
                return Err(Box::new(invalid_node_response("not a public key")));
            }

            node
        }
        Err(err) => return Err(Box::new(invalid_node_response(err))),
    })
}

fn handle_info_fetch_error(err: anyhow::Error) -> axum::http::Response<axum::body::Body> {
    (
        StatusCode::NOT_FOUND,
        Json(ApiError {
            error: err.to_string(),
        }),
    )
        .into_response()
}

#[cfg(test)]
mod test {
    use super::*;
    use http_body_util::BodyExt;
    use rstest::*;

    #[rstest]
    #[case("03a7ee82c3c7fc4c796d26e513676d445d49b9c62004a47f2e813695a439a8fd01")]
    #[case("02d39d33219daac2e5db99c07d4568485d2842e108ff7c1fb0ce13b0cc908e559b")]
    fn test_decode_node(#[case] node: &str) {
        assert_eq!(decode_node(node).unwrap(), hex::decode(node).unwrap());
    }

    #[rstest]
    #[case(
        "03a7ee82c3c7fc4c796d26e513676d445d49b9c62004a47f2e813695a439a8fd",
        "not a public key"
    )]
    #[case(
        "03a7ee82c3c7fc4c796d26e513676d445d49b9c62004a47f2e813695a439a8fd0102",
        "not a public key"
    )]
    #[case("asdf", "invalid character 's' at position 1")]
    #[tokio::test]
    async fn test_decode_node_err(#[case] node: &str, #[case] expected: &str) {
        let res = decode_node(node).err().unwrap();

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, format!("invalid node: {expected}"));
    }
}
