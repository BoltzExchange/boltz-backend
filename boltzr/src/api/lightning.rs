use crate::api::errors::{ApiError, AxumError};
use crate::api::ws::status::SwapInfos;
use crate::api::ServerState;
use crate::service::InfoFetchError;
use crate::swap::manager::SwapManager;
use alloy::hex;
use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchRequest {
    offer: String,
    // In satoshis
    amount: u64,
}

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchResponse {
    invoice: String,
}

#[derive(Deserialize)]
pub struct LightningInfoParams {
    currency: String,
    node: String,
}

pub async fn bolt12_fetch<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(body): Json<Bolt12FetchRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let cln = state
        .manager
        .get_currency(&currency)
        .and_then(|currency| currency.cln);

    Ok(match cln {
        Some(mut cln) => {
            let invoice = cln.fetch_invoice(body.offer, body.amount * 1_000).await?;
            (StatusCode::CREATED, Json(Bolt12FetchResponse { invoice })).into_response()
        }
        None => (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "no BOLT12 support".to_string(),
            }),
        )
            .into_response(),
    })
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
        Err(response) => return Ok(response),
    };

    Ok(
        match state
            .service
            .lightning_info
            .get_node_info(&currency, node)
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
        Err(response) => return Ok(response),
    };

    Ok(
        match state
            .service
            .lightning_info
            .get_channels(&currency, node)
            .await
        {
            Ok(res) => (StatusCode::OK, Json(res)).into_response(),
            Err(err) => handle_info_fetch_error(err),
        },
    )
}

fn decode_node(node: &str) -> Result<Vec<u8>, axum::http::Response<axum::body::Body>> {
    fn invalid_node_response<E: std::fmt::Display>(
        err: E,
    ) -> axum::http::Response<axum::body::Body> {
        (
            StatusCode::BAD_REQUEST,
            Json(ApiError {
                error: format!("invalid node: {}", err),
            }),
        )
            .into_response()
    }

    Ok(match hex::decode(node) {
        Ok(node) => {
            if node.len() != 33 {
                return Err(invalid_node_response("not a public key"));
            }

            node
        }
        Err(err) => return Err(invalid_node_response(err)),
    })
}

fn handle_info_fetch_error(err: InfoFetchError) -> axum::http::Response<axum::body::Body> {
    (
        match err {
            InfoFetchError::NoNode => StatusCode::NOT_FOUND,
            InfoFetchError::FetchError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        },
        Json(ApiError {
            error: match err {
                InfoFetchError::NoNode => "no node available".to_string(),
                InfoFetchError::FetchError(err) => format!("{}", err),
            },
        }),
    )
        .into_response()
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::api::Server;
    use crate::currencies::Currency;
    use crate::lightning::invoice::Invoice;
    use crate::service::Service;
    use crate::swap::manager::test::MockManager;
    use crate::wallet::Network;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::Router;
    use http_body_util::BodyExt;
    use rstest::*;
    use tower::ServiceExt;

    fn setup_router(manager: MockManager) -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);

        Server::<Fetcher, MockManager>::add_routes(Router::new()).layer(Extension(Arc::new(
            ServerState {
                manager: Arc::new(manager),
                service: Arc::new(Service::new_mocked_prometheus(false)),
                swap_status_update_tx: status_tx.clone(),
                swap_infos: Fetcher { status_tx },
            },
        )))
    }

    #[tokio::test]
    async fn test_bolt12_fetch() {
        let mut cln = crate::lightning::cln::test::cln_client().await;
        let offer = cln.offer().await.unwrap();

        let mut manager = MockManager::new();
        {
            let cln = cln.clone();
            manager.expect_get_currency().returning(move |_| {
                Some(Currency {
                    network: Network::Regtest,
                    wallet: Arc::new(crate::wallet::Bitcoin::new(Network::Regtest)),
                    cln: Some(cln.clone()),
                    lnd: None,
                    chain: None,
                })
            });
        }

        let amount = 21;

        let res = setup_router(manager)
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/lightning/BTC/bolt12/fetch")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&Bolt12FetchRequest {
                            amount,
                            offer: offer.bolt12,
                        })
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::CREATED);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let invoice = serde_json::from_slice::<Bolt12FetchResponse>(&body)
            .unwrap()
            .invoice;

        let decoded = crate::lightning::invoice::decode(Network::Regtest, &invoice).unwrap();
        match decoded {
            Invoice::Bolt12(invoice) => {
                assert_eq!(invoice.amount_msats(), amount * 1_000);
            }
            _ => unreachable!(),
        };
    }

    #[tokio::test]
    async fn test_bolt12_fetch_no_cln() {
        let mut manager = MockManager::new();
        manager.expect_get_currency().return_const(None);

        let res = setup_router(manager)
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/lightning/BTC/bolt12/fetch")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&Bolt12FetchRequest {
                            offer: "".to_string(),
                            amount: 0,
                        })
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<ApiError>(&body).unwrap().error,
            "no BOLT12 support"
        );
    }

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
        assert_eq!(error.error, format!("invalid node: {}", expected));
    }
}
