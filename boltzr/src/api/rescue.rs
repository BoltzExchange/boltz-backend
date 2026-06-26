use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::service::{
    KeyVecIterator, MAX_GAP_LIMIT, MAX_PAGINATION_LIMIT, Pagination, PubkeyIterator, RestoreQuery,
    SingleKeyIterator, XpubIterator,
};
use crate::swap::manager::SwapManager;
use crate::utils::serde::{
    EvmAddressDeserialize, PublicKeyDeserialize, PublicKeyVecDeserialize, XpubDeserialize,
};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
#[serde(untagged)]
pub enum RescueParams {
    Xpub {
        xpub: XpubDeserialize,
        #[serde(rename = "derivationPath")]
        derivation_path: Option<String>,
        #[serde(rename = "gapLimit")]
        gap_limit: Option<u32>,
        pagination: Option<Pagination>,
    },
    PublicKey {
        #[serde(rename = "publicKey")]
        public_key: PublicKeyDeserialize,
    },
    PublicKeyVec {
        #[serde(rename = "publicKeys")]
        public_keys: PublicKeyVecDeserialize,
    },
    Address {
        address: EvmAddressDeserialize,
        timestamp: u64,
        signature: String,
    },
}

#[derive(Serialize)]
pub struct RestoreIndexResponse {
    pub index: i64,
}

const RESTORE_SIGNATURE_VALIDITY_SECS: u64 = 60;

fn restore_proof_message(address: &str, timestamp: u64) -> String {
    format!("Boltz swap restore\naddress: {address}\ntimestamp: {timestamp}")
}

fn verify_restore_signature(
    address: &boltz_evm::Address,
    timestamp: u64,
    signature: &str,
) -> Result<(), AxumError> {
    let now = chrono::Utc::now().timestamp();
    let timestamp_secs = i64::try_from(timestamp).map_err(|_| {
        AxumError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            anyhow::anyhow!("signature timestamp is not within the validity window"),
        )
    })?;
    if now.abs_diff(timestamp_secs) > RESTORE_SIGNATURE_VALIDITY_SECS {
        return Err(AxumError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            anyhow::anyhow!("signature timestamp is not within the validity window"),
        ));
    }

    let message = restore_proof_message(&address.to_string(), timestamp);
    let recovered = boltz_evm::recover_signer(message.as_bytes(), signature)
        .map_err(|e| AxumError::new(StatusCode::UNPROCESSABLE_ENTITY, e))?;

    if recovered != *address {
        return Err(AxumError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            anyhow::anyhow!("signature does not match address"),
        ));
    }

    Ok(())
}

impl TryFrom<RescueParams> for Box<dyn PubkeyIterator + Send> {
    type Error = AxumError;

    fn try_from(params: RescueParams) -> Result<Self, Self::Error> {
        match params {
            RescueParams::Xpub {
                xpub,
                derivation_path,
                gap_limit,
                pagination,
            } => {
                if let Some(limit) = gap_limit {
                    if limit == 0 {
                        return Err(AxumError::new(
                            StatusCode::UNPROCESSABLE_ENTITY,
                            anyhow::anyhow!("gapLimit must be at least 1"),
                        ));
                    }
                    if limit > MAX_GAP_LIMIT {
                        return Err(AxumError::new(
                            StatusCode::UNPROCESSABLE_ENTITY,
                            anyhow::anyhow!("gapLimit must not exceed {}", MAX_GAP_LIMIT),
                        ));
                    }
                }

                if let Some(pagination_params) = &pagination {
                    if pagination_params.limit == 0 {
                        return Err(AxumError::new(
                            StatusCode::UNPROCESSABLE_ENTITY,
                            anyhow::anyhow!("limit must be at least 1"),
                        ));
                    }
                    if pagination_params.limit > MAX_PAGINATION_LIMIT {
                        return Err(AxumError::new(
                            StatusCode::UNPROCESSABLE_ENTITY,
                            anyhow::anyhow!("limit must not exceed {}", MAX_PAGINATION_LIMIT),
                        ));
                    }
                }

                let iterator = XpubIterator::new(xpub.0, derivation_path, gap_limit)
                    .map_err(|e| AxumError::new(StatusCode::UNPROCESSABLE_ENTITY, e))?
                    .with_pagination(pagination);

                Ok(Box::new(iterator))
            }
            RescueParams::PublicKey { public_key } => {
                Ok(Box::new(SingleKeyIterator::new(public_key.0)))
            }
            RescueParams::PublicKeyVec { public_keys } => {
                Ok(Box::new(KeyVecIterator::new(public_keys.0)))
            }
            RescueParams::Address { .. } => Err(AxumError::new(
                StatusCode::UNPROCESSABLE_ENTITY,
                anyhow::anyhow!("address lookup is only supported for restore"),
            )),
        }
    }
}

impl TryFrom<RescueParams> for RestoreQuery {
    type Error = AxumError;

    fn try_from(params: RescueParams) -> Result<Self, Self::Error> {
        match params {
            RescueParams::Address {
                address,
                timestamp,
                signature,
            } => {
                verify_restore_signature(&address.0, timestamp, &signature)?;
                Ok(RestoreQuery::Address(address.0.to_string()))
            }
            other => Ok(RestoreQuery::Keys(other.try_into()?)),
        }
    }
}

pub async fn swap_rescue<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(params): Json<RescueParams>,
) -> anyhow::Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let res = state.service.swap_rescue.rescue(params.try_into()?)?;
    Ok((StatusCode::OK, Json(res)).into_response())
}

pub async fn swap_restore<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(params): Json<RescueParams>,
) -> anyhow::Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let res = state.service.swap_rescue.restore(params.try_into()?)?;
    Ok((StatusCode::OK, Json(res)).into_response())
}

pub async fn swap_restore_index<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(params): Json<RescueParams>,
) -> anyhow::Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let res = state.service.swap_rescue.index(params.try_into()?).await?;
    Ok((StatusCode::OK, Json(RestoreIndexResponse { index: res })).into_response())
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::errors::ApiError;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Server, ServerState};
    use crate::service::Service;
    use crate::service::test::RescuableSwap;
    use crate::swap::manager::test::MockManager;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::{Extension, Router};
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use tower::ServiceExt;

    const VALID_XPUB: &str = "xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym";
    const INVALID_XPUB: &str = "invalid";
    const EXPECTED_ERROR_MSG: &str = "Failed to deserialize the JSON body into the target type: data did not match any variant of untagged enum RescueParams";

    fn setup_router() -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(1);
        Server::<Fetcher, MockManager>::add_routes(Router::new()).layer(Extension(Arc::new(
            ServerState {
                manager: Arc::new(MockManager::new()),
                service: Arc::new(Service::new_mocked_prometheus(false)),
                swap_status_update_tx: status_tx.clone(),
                swap_infos: Fetcher { status_tx },
            },
        )))
    }

    async fn make_rescue_request(endpoint: &str, xpub: &str) -> axum::response::Response {
        setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(endpoint)
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&serde_json::json!({
                            "xpub": xpub
                        }))
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_rescue_request_with_gap_limit(
        endpoint: &str,
        xpub: &str,
        gap_limit: u32,
    ) -> axum::response::Response {
        setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(endpoint)
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&serde_json::json!({
                            "xpub": xpub,
                            "gapLimit": gap_limit
                        }))
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_restore_request_with_pagination(
        endpoint: &str,
        xpub: &str,
        start_index: Option<u32>,
        limit: Option<u32>,
    ) -> axum::response::Response {
        let mut body = serde_json::json!({
            "xpub": xpub
        });

        if start_index.is_some() || limit.is_some() {
            let mut pagination_obj = serde_json::json!({});
            if let Some(start) = start_index {
                pagination_obj["startIndex"] = serde_json::Value::Number(start.into());
            }
            if let Some(lim) = limit {
                pagination_obj["limit"] = serde_json::Value::Number(lim.into());
            }
            body["pagination"] = pagination_obj;
        }

        setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(endpoint)
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_json_request(
        endpoint: &str,
        body: serde_json::Value,
    ) -> axum::response::Response {
        setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(endpoint)
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn assert_successful_response(res: axum::response::Response) {
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<Vec<RescuableSwap>>(&body).unwrap(),
            vec![],
        );
    }

    async fn assert_invalid_xpub_response(res: axum::response::Response) {
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<ApiError>(&body).unwrap().error,
            EXPECTED_ERROR_MSG
        );
    }

    #[tokio::test]
    async fn test_swap_rescue() {
        let res = make_rescue_request("/v2/swap/rescue", VALID_XPUB).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_rescue_invalid_xpub() {
        let res = make_rescue_request("/v2/swap/rescue", INVALID_XPUB).await;
        assert_invalid_xpub_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_restore() {
        let res = make_rescue_request("/v2/swap/restore", VALID_XPUB).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_restore_invalid_xpub() {
        let res = make_rescue_request("/v2/swap/restore", INVALID_XPUB).await;
        assert_invalid_xpub_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_rescue_with_valid_gap_limit() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/rescue", VALID_XPUB, 50).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_rescue_with_gap_limit_below_max() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/rescue", VALID_XPUB, 25).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_rescue_with_gap_limit_at_boundary() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/rescue", VALID_XPUB, 1).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_rescue_with_gap_limit_zero() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/rescue", VALID_XPUB, 0).await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert_eq!(error.error, "gapLimit must be at least 1");
    }

    #[tokio::test]
    async fn test_swap_rescue_with_gap_limit_exceeds_max() {
        let res =
            make_rescue_request_with_gap_limit("/v2/swap/rescue", VALID_XPUB, MAX_GAP_LIMIT + 1)
                .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert!(error.error.contains("gapLimit must not exceed"));
    }

    #[tokio::test]
    async fn test_swap_restore_with_valid_gap_limit() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/restore", VALID_XPUB, 50).await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_restore_with_gap_limit_zero() {
        let res = make_rescue_request_with_gap_limit("/v2/swap/restore", VALID_XPUB, 0).await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert_eq!(error.error, "gapLimit must be at least 1");
    }

    #[tokio::test]
    async fn test_swap_restore_with_valid_pagination() {
        let res =
            make_restore_request_with_pagination("/v2/swap/restore", VALID_XPUB, Some(0), Some(10))
                .await;
        assert_successful_response(res).await;
    }

    #[tokio::test]
    async fn test_swap_restore_with_start_index_only() {
        let res =
            make_restore_request_with_pagination("/v2/swap/restore", VALID_XPUB, Some(0), None)
                .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn test_swap_restore_with_limit_only() {
        let res =
            make_restore_request_with_pagination("/v2/swap/restore", VALID_XPUB, None, Some(10))
                .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn test_swap_restore_with_pagination_limit_zero() {
        let res =
            make_restore_request_with_pagination("/v2/swap/restore", VALID_XPUB, Some(0), Some(0))
                .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert_eq!(error.error, "limit must be at least 1");
    }

    #[tokio::test]
    async fn test_swap_restore_with_pagination_limit_exceeds_max() {
        let res = make_restore_request_with_pagination(
            "/v2/swap/restore",
            VALID_XPUB,
            Some(0),
            Some(MAX_PAGINATION_LIMIT + 1),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert!(error.error.contains("limit must not exceed"));
    }

    const VALID_EVM_ADDRESS: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const OTHER_EVM_ADDRESS: &str = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    fn now() -> u64 {
        chrono::Utc::now().timestamp() as u64
    }

    fn signed_address_body(address: &str, timestamp: u64) -> serde_json::Value {
        let message = super::restore_proof_message(address, timestamp);
        let signature = boltz_evm::test_utils::sign_message(message.as_bytes());
        serde_json::json!({
            "address": address,
            "timestamp": timestamp,
            "signature": signature,
        })
    }

    #[tokio::test]
    async fn test_swap_restore_by_address() {
        let res = make_json_request(
            "/v2/swap/restore",
            signed_address_body(VALID_EVM_ADDRESS, now()),
        )
        .await;
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<Vec<crate::service::test::RestorableSwap>>(&body).unwrap(),
            vec![],
        );
    }

    #[tokio::test]
    async fn test_swap_restore_signature_mismatch() {
        let res = make_json_request(
            "/v2/swap/restore",
            signed_address_body(OTHER_EVM_ADDRESS, now()),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert_eq!(error.error, "signature does not match address");
    }

    #[tokio::test]
    async fn test_swap_restore_stale_timestamp() {
        let res = make_json_request(
            "/v2/swap/restore",
            signed_address_body(VALID_EVM_ADDRESS, now() - 10_000),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert!(error.error.contains("validity window"));
    }

    #[tokio::test]
    async fn test_swap_restore_out_of_range_timestamp() {
        let res = make_json_request(
            "/v2/swap/restore",
            signed_address_body(VALID_EVM_ADDRESS, u64::MAX),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert!(error.error.contains("validity window"));
    }

    #[tokio::test]
    async fn test_swap_restore_invalid_signature() {
        let res = make_json_request(
            "/v2/swap/restore",
            serde_json::json!({
                "address": VALID_EVM_ADDRESS,
                "timestamp": now(),
                "signature": "0xnot-a-signature",
            }),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn test_swap_restore_invalid_address() {
        let res = make_json_request(
            "/v2/swap/restore",
            serde_json::json!({
                "address": "not-an-evm-address",
                "timestamp": now(),
                "signature": "0xdead",
            }),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn test_swap_rescue_rejects_address() {
        let res = make_json_request(
            "/v2/swap/rescue",
            signed_address_body(VALID_EVM_ADDRESS, now()),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error = serde_json::from_slice::<ApiError>(&body).unwrap();
        assert_eq!(error.error, "address lookup is only supported for restore");
    }

    #[tokio::test]
    async fn test_swap_restore_index_rejects_address() {
        let res = make_json_request(
            "/v2/swap/restore/index",
            signed_address_body(VALID_EVM_ADDRESS, now()),
        )
        .await;
        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }
}
