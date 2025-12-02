use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::service::CreateFundingAddressRequest;
use crate::swap::manager::SwapManager;
use anyhow::Result;
use async_tungstenite::tungstenite::http::StatusCode;
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use bitcoin::XOnlyPublicKey;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::sync::Arc;

#[derive(Deserialize, serde::Serialize)]
pub struct CreateRequest {
    #[serde(rename = "refundPublicKey")]
    pub refund_public_key: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: Option<u32>,
}

#[derive(Serialize, serde::Deserialize)]
pub struct CreateResponse {
    pub id: String,
    pub address: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: u32,
    #[serde(rename = "boltzPublicKey")]
    pub boltz_public_key: String,
}

#[derive(Serialize, serde::Deserialize)]
pub struct GetResponse {
    pub id: String,
    pub address: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: u32,
    #[serde(rename = "boltzPublicKey")]
    pub boltz_public_key: String,
    #[serde(
        rename = "lockupTransactionId",
        skip_serializing_if = "Option::is_none"
    )]
    pub lockup_transaction_id: Option<String>,
    #[serde(rename = "lockupConfirmed")]
    pub lockup_confirmed: bool,
    #[serde(rename = "swapId", skip_serializing_if = "Option::is_none")]
    pub swap_id: Option<String>,
}

pub async fn create<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(body): Json<CreateRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let their_pubkey = XOnlyPublicKey::from_str(&body.refund_public_key).map_err(|e| {
        AxumError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            anyhow::anyhow!("invalid public key: {}", e),
        )
    })?;

    let request = CreateFundingAddressRequest {
        symbol: currency,
        refund_public_key: their_pubkey,
        timeout_block_height: body.timeout_block_height,
    };

    // Call the service to create the funding address
    let response = state.service.funding_address.create(request).map_err(|e| {
        // Map service errors to appropriate HTTP status codes
        if e.to_string().contains("currency not found") || e.to_string().contains("no wallet") {
            AxumError::new(StatusCode::NOT_FOUND, e)
        } else if e.to_string().contains("invalid") {
            AxumError::new(StatusCode::UNPROCESSABLE_ENTITY, e)
        } else {
            AxumError::new(StatusCode::INTERNAL_SERVER_ERROR, e)
        }
    })?;

    Ok((
        StatusCode::OK,
        Json(CreateResponse {
            id: response.id,
            address: response.address,
            timeout_block_height: response.timeout_block_height,
            boltz_public_key: response.boltz_public_key,
        }),
    )
        .into_response())
}

pub async fn get<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    // Get the funding address with full response data
    let response = state
        .service
        .funding_address
        .get_by_id(&id)
        .map_err(|e| AxumError::new(StatusCode::INTERNAL_SERVER_ERROR, e))?
        .ok_or_else(|| {
            AxumError::new(
                StatusCode::NOT_FOUND,
                anyhow::anyhow!("funding address not found"),
            )
        })?;

    Ok((
        StatusCode::OK,
        Json(GetResponse {
            id: response.id,
            address: response.address,
            timeout_block_height: response.timeout_block_height,
            boltz_public_key: response.boltz_public_key,
            lockup_transaction_id: response.lockup_transaction_id,
            lockup_confirmed: response.lockup_confirmed,
            swap_id: response.swap_id,
        }),
    )
        .into_response())
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::errors::ApiError;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Server, ServerState};
    use crate::service::Service;
    use crate::service::test::get_test_currencies;
    use crate::swap::manager::test::MockManager;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::{Extension, Router};
    use http_body_util::BodyExt;
    use rstest::*;
    use std::sync::Arc;
    use tower::ServiceExt;

    const TEST_SYMBOL: &str = "L-BTC";
    const TEST_XONLY_PUBKEY: &str =
        "e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452";

    async fn setup_router() -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(1);
        Server::<Fetcher, MockManager>::add_routes(Router::new()).layer(Extension(Arc::new(
            ServerState {
                manager: Arc::new(MockManager::new()),
                service: Arc::new(Service::new_mocked(
                    false,
                    Some(get_test_currencies().await),
                )),
                swap_status_update_tx: status_tx.clone(),
                swap_infos: Fetcher { status_tx },
            },
        )))
    }

    async fn make_create_request(currency: &str, body: &CreateRequest) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(format!("/v2/funding/{}", currency))
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_create_request_raw(currency: &str, body: String) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(format!("/v2/funding/{}", currency))
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_create_request_empty(currency: &str) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri(format!("/v2/funding/{}", currency))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_create_funding_address_success() {
        let res = make_create_request(
            TEST_SYMBOL,
            &CreateRequest {
                refund_public_key: TEST_XONLY_PUBKEY.to_string(),
                timeout_block_height: None,
            },
        )
        .await;

        //assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        println!("body: {:?}", body);
        println!("body: {:?}", body);
        let response: CreateResponse = serde_json::from_slice(&body).unwrap();

        assert!(!response.id.is_empty());
        assert!(!response.address.is_empty());
        assert_eq!(response.timeout_block_height, 1000);
        assert!(!response.boltz_public_key.is_empty());
    }

    #[tokio::test]
    async fn test_create_funding_address_invalid_pubkey() {
        let res = make_create_request(
            TEST_SYMBOL,
            &CreateRequest {
                refund_public_key: "invalid_pubkey".to_string(),
                timeout_block_height: None,
            },
        )
        .await;

        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("invalid public key"));
    }

    #[tokio::test]
    async fn test_create_funding_address_currency_not_found() {
        let res = make_create_request(
            "NONEXISTENT",
            &CreateRequest {
                refund_public_key: TEST_XONLY_PUBKEY.to_string(),
                timeout_block_height: None,
            },
        )
        .await;

        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("currency not found"));
    }

    #[tokio::test]
    async fn test_create_funding_address_optional_timeout() {
        let res = make_create_request(
            TEST_SYMBOL,
            &CreateRequest {
                refund_public_key: TEST_XONLY_PUBKEY.to_string(),
                timeout_block_height: None,
            },
        )
        .await;

        assert_eq!(res.status(), StatusCode::OK);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let response: CreateResponse = serde_json::from_slice(&body).unwrap();

        assert!(!response.id.is_empty());
        assert_eq!(response.timeout_block_height, 0);
    }

    #[rstest]
    #[case("", "invalid public key")]
    #[case("abc", "invalid public key")]
    #[case(
        "e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e6345",
        "invalid public key"
    )]
    #[case(
        "e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e634522",
        "invalid public key"
    )]
    #[tokio::test]
    async fn test_create_funding_address_invalid_pubkey_formats(
        #[case] pubkey: &str,
        #[case] expected_error: &str,
    ) {
        let res = make_create_request(
            TEST_SYMBOL,
            &CreateRequest {
                refund_public_key: pubkey.to_string(),
                timeout_block_height: None,
            },
        )
        .await;

        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains(expected_error));
    }

    #[tokio::test]
    async fn test_create_funding_address_malformed_json() {
        let res = make_create_request_raw(TEST_SYMBOL, "{invalid json}".to_string()).await;

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }

    async fn make_get_request(id: &str) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::GET)
                    .uri(format!("/v2/funding/address/{}", id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_get_funding_address_success() {
        // First create a funding address
        let create_res = make_create_request(
            TEST_SYMBOL,
            &CreateRequest {
                refund_public_key: TEST_XONLY_PUBKEY.to_string(),
                timeout_block_height: Some(1000),
            },
        )
        .await;

        assert_eq!(create_res.status(), StatusCode::OK);
        let create_body = create_res.into_body().collect().await.unwrap().to_bytes();
        let create_response: CreateResponse = serde_json::from_slice(&create_body).unwrap();

        // Now get it back
        let get_res = make_get_request(&create_response.id).await;
        assert_eq!(get_res.status(), StatusCode::OK);

        let get_body = get_res.into_body().collect().await.unwrap().to_bytes();
        let get_response: GetResponse = serde_json::from_slice(&get_body).unwrap();

        assert_eq!(get_response.id, create_response.id);
        assert_eq!(get_response.address, create_response.address);
        assert_eq!(
            get_response.timeout_block_height,
            create_response.timeout_block_height
        );
        assert_eq!(
            get_response.boltz_public_key,
            create_response.boltz_public_key
        );
        assert_eq!(get_response.lockup_transaction_id, None);
        assert_eq!(get_response.lockup_confirmed, false);
        assert_eq!(get_response.swap_id, None);
    }

    #[tokio::test]
    async fn test_get_funding_address_not_found() {
        let res = make_get_request("nonexistent_id").await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("funding address not found"));
    }
}
