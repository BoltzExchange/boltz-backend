use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::api::ws::types::{FundingAddressUpdate, TransactionInfo};
use crate::currencies::get_chain_client;
use crate::service::{CreateFundingAddressRequest, FundingAddressError, SetSignatureRequest};
use crate::swap::manager::SwapManager;
use crate::utils::serde::PublicKeyDeserialize;
use anyhow::Result;
use async_tungstenite::tungstenite::http::StatusCode;
use axum::extract::{Path, Query};
use axum::response::{IntoResponse, Response};
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

impl IntoResponse for FundingAddressError {
    fn into_response(self) -> Response {
        let status = match &self {
            FundingAddressError::CurrencyNotFound(_)
            | FundingAddressError::NoWallet(_)
            | FundingAddressError::NotFound(_) => StatusCode::NOT_FOUND,
            FundingAddressError::Database(_) | FundingAddressError::Internal(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        };
        AxumError::new(status, anyhow::anyhow!("{}", self)).into_response()
    }
}

#[derive(Deserialize)]
pub struct CreateRequest {
    #[serde(rename = "symbol")]
    pub symbol: String,
    #[serde(rename = "refundPublicKey")]
    pub refund_public_key: PublicKeyDeserialize,
}

#[derive(Serialize, Deserialize)]
pub struct CreateResponse {
    pub id: String,
    pub address: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: u32,
    #[serde(rename = "serverPublicKey")]
    pub server_public_key: String,
    #[serde(rename = "blindingKey", skip_serializing_if = "Option::is_none")]
    pub blinding_key: Option<String>,
    #[serde(rename = "tree")]
    pub tree: String,
}

#[derive(Serialize, Deserialize)]
pub struct GetSigningDetailsResponse {
    #[serde(rename = "pubNonce")]
    pub pub_nonce: String,
    #[serde(rename = "publicKey")]
    pub public_key: String,
    #[serde(rename = "transactionHex")]
    pub transaction_hex: String,
    #[serde(rename = "transactionHash")]
    pub transaction_hash: String,
}

#[derive(Deserialize)]
pub struct GetSigningDetailsQuery {
    #[serde(rename = "swapId")]
    pub swap_id: String,
}

#[derive(Deserialize)]
pub struct SetSignatureRequestBody {
    #[serde(rename = "pubNonce")]
    pub pub_nonce: String,
    #[serde(rename = "partialSignature")]
    pub partial_signature: String,
}

pub async fn create<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(body): Json<CreateRequest>,
) -> Result<impl IntoResponse, FundingAddressError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let request = CreateFundingAddressRequest {
        symbol: body.symbol,
        refund_public_key: body.refund_public_key.0,
    };

    let response = state.service.funding_address.create(request).await?;

    Ok((
        StatusCode::CREATED,
        Json(CreateResponse {
            id: response.id,
            address: response.address,
            server_public_key: response.server_public_key,
            timeout_block_height: response.timeout_block_height,
            blinding_key: response.blinding_key,
            tree: response.tree,
        }),
    )
        .into_response())
}

pub async fn get<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, FundingAddressError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    // TODO: consider caching
    let funding_address = state.service.funding_address.get_by_id(&id)?;

    let transaction = match &funding_address.lockup_transaction_id {
        Some(tx_id) => {
            let hex =
                match get_chain_client(state.manager.get_currencies(), &funding_address.symbol) {
                    Ok(client) => client.raw_transaction(tx_id).await.ok(),
                    Err(_) => None,
                };
            Some(TransactionInfo {
                id: tx_id.clone(),
                hex,
                eta: None,
            })
        }
        None => None,
    };

    let update = FundingAddressUpdate {
        id: funding_address.id,
        status: funding_address.status,
        transaction,
        swap_id: funding_address.swap_id,
    };

    Ok((StatusCode::OK, Json(update)).into_response())
}

pub async fn get_signing_details<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(id): Path<String>,
    Query(query): Query<GetSigningDetailsQuery>,
) -> Result<impl IntoResponse, FundingAddressError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let response = state
        .service
        .funding_address
        .get_signing_details(&id, &query.swap_id)
        .await?;

    Ok((
        StatusCode::OK,
        Json(GetSigningDetailsResponse {
            pub_nonce: response.pub_nonce,
            public_key: response.public_key,
            transaction_hex: response.transaction_hex,
            transaction_hash: response.transaction_hash,
        }),
    )
        .into_response())
}

pub async fn set_signature<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(id): Path<String>,
    Json(body): Json<SetSignatureRequestBody>,
) -> Result<impl IntoResponse, FundingAddressError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let request = SetSignatureRequest {
        id,
        pub_nonce: body.pub_nonce,
        partial_signature: body.partial_signature,
    };

    let funding_address = state.service.funding_address.set_signature(request).await?;

    state
        .manager
        .check_transaction(
            &funding_address.symbol,
            &funding_address
                .lockup_transaction_id
                .ok_or(FundingAddressError::Internal(
                    "lockup transaction id missing".to_string(),
                ))?,
        )
        .await
        .map_err(|e| FundingAddressError::Internal(e.to_string()))?;

    Ok(StatusCode::NO_CONTENT.into_response())
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::errors::ApiError;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Server, ServerState};
    use crate::db::helpers::script_pubkey::test::create_script_pubkeys_table;
    use crate::db::helpers::web_hook::test::get_pool;
    use crate::service::Service;
    use crate::service::test::get_test_currencies;
    use crate::swap::manager::test::MockManager;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::{Extension, Router};
    use bitcoin::key::{Keypair, Secp256k1};
    use http_body_util::BodyExt;
    use rstest::*;
    use std::sync::Arc;
    use tower::ServiceExt;

    const TEST_SYMBOL: &str = "BTC";

    fn get_keypair() -> String {
        let secp = Secp256k1::new();
        Keypair::new(&secp, &mut rand::thread_rng())
            .public_key()
            .to_string()
    }

    async fn setup_router() -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(1);
        let currencies = get_test_currencies().await;
        let pool = get_pool();
        crate::db::helpers::keys::test::create_keys_table(
            &pool,
            currencies.keys().cloned().collect::<Vec<String>>(),
        );
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

    async fn make_create_request(
        currency: &str,
        refund_public_key: &str,
    ) -> axum::response::Response {
        let body = serde_json::json!({
            "symbol": currency,
            "refundPublicKey": refund_public_key
        });
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/funding")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    async fn make_create_request_raw(body: String) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/funding")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_create_funding_address_success() {
        let res = make_create_request(TEST_SYMBOL, &get_keypair()).await;

        //assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        println!("body: {:?}", String::from_utf8_lossy(&body));
        let response: CreateResponse = serde_json::from_slice(&body).unwrap();
        //println!("response: {:?}", response);

        assert!(!response.id.is_empty());
        assert!(!response.address.is_empty());
        assert!(!response.server_public_key.is_empty());
        // BTC (non-Liquid) should not have a blinding key
        assert!(response.blinding_key.is_none());
        // Verify tree is populated with the expected structure
        assert!(!response.tree.is_empty());
        assert!(response.tree.contains("refundLeaf"));
    }

    #[tokio::test]
    async fn test_create_funding_address_liquid_has_blinding_key() {
        let res = make_create_request("L-BTC", &get_keypair()).await;

        assert_eq!(res.status(), StatusCode::CREATED);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let response: CreateResponse = serde_json::from_slice(&body).unwrap();

        assert!(!response.id.is_empty());
        assert!(!response.address.is_empty());
        // Liquid confidential address should start with "el" for regtest
        assert!(
            response.address.starts_with("el"),
            "Liquid address should be confidential (start with 'el'), got: {}",
            response.address
        );
        assert!(!response.server_public_key.is_empty());
        // Liquid should have a blinding key
        assert!(response.blinding_key.is_some());
        assert!(!response.blinding_key.as_ref().unwrap().is_empty());
        // Verify tree is populated with the expected structure
        assert!(!response.tree.is_empty());
        assert!(response.tree.contains("refundLeaf"));
    }

    #[tokio::test]
    async fn test_create_funding_address_currency_not_found() {
        let res = make_create_request("NONEXISTENT", &get_keypair()).await;

        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("currency not found"));
    }

    #[rstest]
    #[case("")]
    #[case("abc")]
    #[case("e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e6345")]
    #[tokio::test]
    async fn test_create_funding_address_invalid_pubkey_formats(#[case] pubkey: &str) {
        let res = make_create_request(TEST_SYMBOL, pubkey).await;

        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(!error.error.is_empty());
    }

    #[tokio::test]
    async fn test_create_funding_address_malformed_json() {
        let res = make_create_request_raw("{invalid json}".to_string()).await;

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }

    async fn make_get_request(id: &str) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::GET)
                    .uri(format!("/v2/funding/{}", id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_get_funding_address_success() {
        let create_res = make_create_request(TEST_SYMBOL, &get_keypair()).await;

        assert_eq!(create_res.status(), StatusCode::CREATED);
        let create_body = create_res.into_body().collect().await.unwrap().to_bytes();
        let create_response: CreateResponse = serde_json::from_slice(&create_body).unwrap();

        let get_res = make_get_request(&create_response.id).await;
        assert_eq!(get_res.status(), StatusCode::OK);

        let get_body = get_res.into_body().collect().await.unwrap().to_bytes();
        let get_response: FundingAddressUpdate = serde_json::from_slice(&get_body).unwrap();

        assert_eq!(get_response.id, create_response.id);
        assert!(!get_response.status.is_empty());
        assert!(get_response.transaction.is_none());
        assert!(get_response.swap_id.is_none());
    }

    #[tokio::test]
    async fn test_get_funding_address_not_found() {
        let res = make_get_request("nonexistent_id").await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
    }

    async fn make_get_signing_details_request(id: &str, swap_id: &str) -> axum::response::Response {
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::GET)
                    .uri(format!("/v2/funding/{}/signature?swapId={}", id, swap_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_get_signing_details_not_found() {
        let res = make_get_signing_details_request("nonexistent_id", "nonexistent_swap_id").await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("funding address not found"));
    }

    async fn make_set_signature_request(
        id: &str,
        pub_nonce: &str,
        partial_signature: &str,
    ) -> axum::response::Response {
        let body = serde_json::json!({
            "pubNonce": pub_nonce,
            "partialSignature": partial_signature
        });
        setup_router()
            .await
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::PATCH)
                    .uri(format!("/v2/funding/{}/signature", id))
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_vec(&body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_set_signature_not_found() {
        let res = make_set_signature_request(
            "nonexistent_id",
            "02dff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659",
            "304402200000000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000",
        )
        .await;
        //assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        println!("body: {:?}", String::from_utf8_lossy(&body));
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert!(error.error.contains("funding address not found"));
    }
}
