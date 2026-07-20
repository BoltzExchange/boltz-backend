use crate::api::ServerState;
use crate::api::errors::{ApiError, AxumError};
use crate::api::types::assert_not_zero;
use crate::api::ws::status::SwapInfos;
use crate::db::models::SwapType;
use crate::lightning::cln::OfferError;
use crate::lightning::invoice::Invoice;
use crate::swap::manager::SwapManager;
use crate::wallet::Network;
use anyhow::{Result, anyhow};
use async_tungstenite::tungstenite::http::StatusCode;
use axum::body::Body;
use axum::extract::Path;
use axum::http::Response;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use lightning::offers::offer::Amount;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct CreateRequest {
    offer: String,
    url: Option<String>,
}

#[derive(Serialize)]
pub struct CreateResponse {}

#[derive(Deserialize)]
pub struct UpdateRequest {
    offer: String,
    url: Option<String>,
    signature: String,
}

#[derive(Serialize)]
pub struct UpdateResponse {}

#[derive(Deserialize)]
pub struct DeleteRequest {
    offer: String,
    signature: String,
}

#[derive(Serialize)]
pub struct DeleteResponse {}

#[derive(Deserialize)]
pub struct ParamsPath {
    pub currency: String,
    pub receiving: String,
}

#[derive(Serialize)]
pub struct ParamsResponse {
    #[serde(rename = "minCltv")]
    pub min_cltv: u64,
}

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchRequest {
    offer: String,
    // In satoshis
    #[serde(default, deserialize_with = "assert_not_zero")]
    amount: Option<u64>,
    note: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct MagicRoutingHint {
    pub bip21: String,
    pub signature: String,
}

#[derive(Deserialize, Serialize)]
pub struct Bolt12FetchResponse {
    invoice: String,
    #[serde(rename = "magicRoutingHint", skip_serializing_if = "Option::is_none")]
    pub magic_routing_hint: Option<MagicRoutingHint>,
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

pub async fn update<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(body): Json<UpdateRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let signature = match parse_signature(body.signature) {
        Ok(signature) => signature,
        Err(err) => return Ok(*err),
    };

    let cln = match state
        .manager
        .get_currency(&currency)
        .and_then(|currency| currency.cln)
    {
        Some(cln) => cln,
        None => return Ok(no_cln_error()),
    };

    if let Err(err) = cln.hold.update_offer(body.offer, body.url, &signature) {
        return Ok(offer_error_response(err));
    }

    Ok((StatusCode::OK, Json(UpdateResponse {})).into_response())
}

pub async fn delete<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(currency): Path<String>,
    Json(body): Json<DeleteRequest>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let signature = match parse_signature(body.signature) {
        Ok(signature) => signature,
        Err(err) => return Ok(*err),
    };

    let cln = match state
        .manager
        .get_currency(&currency)
        .and_then(|currency| currency.cln)
    {
        Some(cln) => cln,
        None => return Ok(no_cln_error()),
    };

    if let Err(err) = cln.hold.delete_offer(body.offer, &signature) {
        return Ok(offer_error_response(err));
    }

    Ok((StatusCode::OK, Json(DeleteResponse {})).into_response())
}

pub async fn params<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Path(ParamsPath {
        currency,
        receiving,
    }): Path<ParamsPath>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let lightning_delta = match state
        .manager
        .get_timeouts(&receiving, &currency, SwapType::Reverse)
    {
        Ok(res) => res.1,
        Err(err) => {
            return Ok((
                StatusCode::NOT_FOUND,
                Json(ApiError {
                    error: err.to_string(),
                }),
            )
                .into_response());
        }
    };

    Ok((
        StatusCode::OK,
        Json(ParamsResponse {
            min_cltv: lightning_delta,
        }),
    )
        .into_response())
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
    let amount_msat = body
        .amount
        .map(|amount| {
            amount.checked_mul(1_000).ok_or_else(|| {
                AxumError::new(
                    StatusCode::UNPROCESSABLE_ENTITY,
                    anyhow!("amount too large"),
                )
            })
        })
        .transpose()?;

    let currency = match state.manager.get_currency(&currency) {
        Some(currency) => currency,
        None => return Ok(no_cln_error()),
    };
    let mut cln = match currency.cln {
        Some(cln) => cln,
        None => return Ok(no_cln_error()),
    };

    let amount_msat = match amount_msat {
        Some(amount_msat) => amount_msat,
        None => match offer_amount_msat(currency.network, &body.offer) {
            Ok(amount_msat) => amount_msat,
            Err(err) => return Ok(err.into_response()),
        },
    };

    let (invoice, magic_routing_hint) = cln
        .fetch_invoice(body.offer, amount_msat, body.note)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(Bolt12FetchResponse {
            invoice,
            magic_routing_hint,
        }),
    )
        .into_response())
}

fn offer_amount_msat(network: Network, offer: &str) -> std::result::Result<u64, AxumError> {
    let offer = match crate::lightning::invoice::decode(network, offer) {
        Ok(Invoice::Offer(offer)) => offer,
        _ => {
            return Err(AxumError::new(
                StatusCode::UNPROCESSABLE_ENTITY,
                anyhow!("invalid offer"),
            ));
        }
    };

    match offer.amount() {
        Some(Amount::Bitcoin { amount_msats }) => Ok(amount_msats),
        _ => Err(AxumError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            anyhow!("amount is required when the offer does not embed one"),
        )),
    }
}

fn offer_error_response(err: anyhow::Error) -> Response<Body> {
    match err.downcast_ref::<OfferError>() {
        Some(OfferError::NoOfferRegistered) => (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: err.to_string(),
            }),
        )
            .into_response(),
        Some(OfferError::InvalidSignature) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiError {
                error: err.to_string(),
            }),
        )
            .into_response(),
        None => AxumError::new_with_default_status(err).into_response(),
    }
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

fn parse_signature(signature: String) -> std::result::Result<Vec<u8>, Box<Response<Body>>> {
    match hex::decode(signature) {
        Ok(signature) => Ok(signature),
        Err(err) => Err(Box::new(
            (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(ApiError {
                    error: err.to_string(),
                }),
            )
                .into_response(),
        )),
    }
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
    use std::collections::HashMap;
    use std::str::FromStr;
    use tower::ServiceExt;

    fn setup_router(manager: MockManager) -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(1);

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
        let chain_client = Arc::new(crate::chain::chain_client::test::get_client().await);
        let mut cln = crate::lightning::cln::test::cln_client().await;

        let offer = cln.offer("any").await.unwrap();

        let mut manager = MockManager::new();
        {
            let cln = cln.clone();
            manager.expect_get_currency().returning(move |_| {
                Some(Currency {
                    network: Network::Regtest,
                    wallet: Some(Arc::new(
                        crate::wallet::Bitcoin::new(
                            Network::Regtest,
                            &Mnemonic::from_str(
                                "test test test test test test test test test test test junk",
                            )
                            .unwrap()
                            .to_seed(""),
                            "m/0/0".to_string(),
                            chain_client.clone(),
                        )
                        .unwrap(),
                    )),
                    cln: Some(cln.clone()),
                    lnds: HashMap::new(),
                    chain: None,
                    evm_manager: None,
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
                            amount: Some(amount),
                            offer: offer.bolt12,
                            note: None,
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
    async fn test_bolt12_fetch_note() {
        let chain_client = Arc::new(crate::chain::chain_client::test::get_client().await);
        let mut cln = crate::lightning::cln::test::cln_client().await;

        let offer = cln.offer("any").await.unwrap();

        let mut manager = MockManager::new();
        {
            let cln = cln.clone();
            manager.expect_get_currency().returning(move |_| {
                Some(Currency {
                    network: Network::Regtest,
                    wallet: Some(Arc::new(
                        crate::wallet::Bitcoin::new(
                            Network::Regtest,
                            &Mnemonic::from_str(
                                "test test test test test test test test test test test junk",
                            )
                            .unwrap()
                            .to_seed(""),
                            "m/0/0".to_string(),
                            chain_client.clone(),
                        )
                        .unwrap(),
                    )),
                    cln: Some(cln.clone()),
                    lnds: HashMap::new(),
                    chain: None,
                    evm_manager: None,
                })
            });
        }

        let amount = 21;
        let note = "gm";

        let res = setup_router(manager)
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/lightning/BTC/bolt12/fetch")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&Bolt12FetchRequest {
                            amount: Some(amount),
                            offer: offer.bolt12,
                            note: Some(note.to_string()),
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
                assert_eq!(
                    format!("{}", invoice.payer_note().unwrap()),
                    note.to_string()
                );
            }
            _ => unreachable!(),
        };
    }

    #[tokio::test]
    async fn test_bolt12_fetch_amount_from_offer() {
        let chain_client = Arc::new(crate::chain::chain_client::test::get_client().await);
        let mut cln = crate::lightning::cln::test::cln_client().await;

        let amount_msat = 21_000;
        let offer = cln.offer(&format!("{amount_msat}msat")).await.unwrap();

        let mut manager = MockManager::new();
        {
            let cln = cln.clone();
            manager.expect_get_currency().returning(move |_| {
                Some(Currency {
                    network: Network::Regtest,
                    wallet: Some(Arc::new(
                        crate::wallet::Bitcoin::new(
                            Network::Regtest,
                            &Mnemonic::from_str(
                                "test test test test test test test test test test test junk",
                            )
                            .unwrap()
                            .to_seed(""),
                            "m/0/0".to_string(),
                            chain_client.clone(),
                        )
                        .unwrap(),
                    )),
                    cln: Some(cln.clone()),
                    lnds: HashMap::new(),
                    chain: None,
                    evm_manager: None,
                })
            });
        }

        let res = setup_router(manager)
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/lightning/BTC/bolt12/fetch")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&Bolt12FetchRequest {
                            amount: None,
                            offer: offer.bolt12,
                            note: None,
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
                assert_eq!(invoice.amount_msats(), amount_msat);
            }
            _ => unreachable!(),
        };
    }

    #[tokio::test]
    async fn test_bolt12_fetch_no_amount_offer_without_amount() {
        let chain_client = Arc::new(crate::chain::chain_client::test::get_client().await);
        let mut cln = crate::lightning::cln::test::cln_client().await;

        let offer = cln.offer("any").await.unwrap();

        let mut manager = MockManager::new();
        {
            let cln = cln.clone();
            manager.expect_get_currency().returning(move |_| {
                Some(Currency {
                    network: Network::Regtest,
                    wallet: Some(Arc::new(
                        crate::wallet::Bitcoin::new(
                            Network::Regtest,
                            &Mnemonic::from_str(
                                "test test test test test test test test test test test junk",
                            )
                            .unwrap()
                            .to_seed(""),
                            "m/0/0".to_string(),
                            chain_client.clone(),
                        )
                        .unwrap(),
                    )),
                    cln: Some(cln.clone()),
                    lnds: HashMap::new(),
                    chain: None,
                    evm_manager: None,
                })
            });
        }

        let res = setup_router(manager)
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/lightning/BTC/bolt12/fetch")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&Bolt12FetchRequest {
                            amount: None,
                            offer: offer.bolt12,
                            note: None,
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
            "amount is required when the offer does not embed one"
        );
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
                            amount: Some(1),
                            note: None,
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
                            amount: Some(0),
                            note: None,
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
            "Failed to deserialize the JSON body into the target type: amount: invalid value: integer `0`, expected value greater than 0 at line 1 column 22"
        );
    }

    #[tokio::test]
    async fn test_bolt12_fetch_amount_overflow() {
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
                            amount: Some(u64::MAX / 1_000 + 1),
                            note: None,
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
            "amount too large"
        );
    }
}
