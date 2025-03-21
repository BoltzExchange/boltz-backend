use crate::api::ServerState;
use crate::api::errors::{ApiError, AxumError};
use crate::api::types::assert_not_zero;
use crate::api::ws::status::SwapInfos;
use crate::swap::manager::SwapManager;
use anyhow::Result;
use async_tungstenite::tungstenite::http::StatusCode;
use axum::body::Body;
use axum::extract::Path;
use axum::http::Response;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct CreateRequest {
    offer: String,
    url: String,
}

#[derive(Serialize)]
pub struct CreateResponse {}

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchRequest {
    offer: String,
    // In satoshis
    #[serde(deserialize_with = "assert_not_zero")]
    amount: u64,
}

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchResponse {
    invoice: String,
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
    let cln = match state
        .manager
        .get_currency(&currency)
        .and_then(|currency| currency.cln)
    {
        Some(cln) => cln,
        None => return Ok(no_cln_error()),
    };

    cln.hold.add_offer(body.offer, body.url)?;
    Ok((StatusCode::CREATED, Json(CreateResponse {})).into_response())
}

pub async fn fetch<S, M>(
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
        None => no_cln_error(),
    })
}

fn no_cln_error() -> Response<Body> {
    (
        StatusCode::NOT_FOUND,
        Json(ApiError {
            error: "no BOLT12 support".to_string(),
        }),
    )
        .into_response()
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::Server;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::currencies::Currency;
    use crate::lightning::invoice::Invoice;
    use crate::service::Service;
    use crate::swap::manager::test::MockManager;
    use crate::wallet::Network;
    use axum::Router;
    use axum::body::Body;
    use axum::extract::Request;
    use bip39::Mnemonic;
    use http_body_util::BodyExt;
    use std::str::FromStr;
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
                    wallet: Arc::new(
                        crate::wallet::Bitcoin::new(
                            Network::Regtest,
                            &Mnemonic::from_str(
                                "test test test test test test test test test test test junk",
                            )
                            .unwrap()
                            .to_seed(""),
                            "m/0/0".to_string(),
                        )
                        .unwrap(),
                    ),
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
                            amount: 1,
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

    #[tokio::test]
    async fn test_bolt12_fetch_zero_amount() {
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

        assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<ApiError>(&body).unwrap().error,
            "Failed to deserialize the JSON body into the target type: amount: invalid value: integer `0`, expected value greater than 0 at line 1 column 23"
        );
    }
}
