use crate::api::ServerState;
use crate::api::errors::{ApiError, AxumError};
use crate::api::headers::Referral;
use crate::api::ws::status::SwapInfos;
use crate::db::models::SwapType;
use crate::swap::manager::SwapManager;
use anyhow::{Result, anyhow};
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use axum_extra::TypedHeader;
use serde::Deserialize;
use std::sync::Arc;

const PRO_REFERRAL: &str = "pro";

fn parse_swap_type(swap_type: &str) -> Result<SwapType> {
    match swap_type {
        "submarine" => Ok(SwapType::Submarine),
        "reverse" => Ok(SwapType::Reverse),
        "chain" => Ok(SwapType::Chain),
        _ => Err(anyhow!("invalid swap type: {}", swap_type)),
    }
}

#[derive(Deserialize)]
pub struct StatsParams {
    swap_type: String,
    from: String,
    to: String,
}

pub async fn get_stats<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    TypedHeader(referral): TypedHeader<Referral>,
    Path(StatsParams {
        to,
        from,
        swap_type,
    }): Path<StatsParams>,
) -> Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let referral = referral.inner();
    if referral != PRO_REFERRAL {
        return Ok((
            StatusCode::BAD_REQUEST,
            Json(ApiError {
                error: "allowed only for Boltz Pro".to_string(),
            }),
        )
            .into_response());
    }

    let swap_type = match parse_swap_type(&swap_type) {
        Ok(swap_type) => swap_type,
        Err(err) => {
            return Ok((
                StatusCode::BAD_REQUEST,
                Json(ApiError {
                    error: err.to_string(),
                }),
            )
                .into_response());
        }
    };

    let pair_stats = if let Some(stats) = &state.service.pair_stats {
        stats
    } else {
        return Ok((
            StatusCode::NOT_IMPLEMENTED,
            Json(ApiError {
                error: "historical data not available".to_string(),
            }),
        )
            .into_response());
    };

    let res = pair_stats
        .get_pair_stats(&format!("{from}/{to}"), swap_type, referral)
        .await?;

    Ok(match res {
        Some(res) => (StatusCode::OK, Json(res)).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "invalid pair".to_string(),
            }),
        )
            .into_response(),
    })
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::Server;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::service::Service;
    use crate::service::test::PairStats;
    use crate::swap::manager::test::MockManager;
    use axum::Router;
    use axum::body::Body;
    use axum::extract::Request;
    use http_body_util::BodyExt;
    use rstest::rstest;
    use tower::ServiceExt;

    fn setup_router(with_pair_stats: bool) -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);

        Server::<Fetcher, MockManager>::add_routes(Router::new()).layer(Extension(Arc::new(
            ServerState {
                manager: Arc::new(MockManager::new()),
                service: Arc::new(Service::new_mocked_prometheus(with_pair_stats)),
                swap_status_update_tx: status_tx.clone(),
                swap_infos: Fetcher { status_tx },
            },
        )))
    }

    #[tokio::test]
    async fn get_stats() {
        let res = setup_router(true)
            .oneshot(
                Request::builder()
                    .uri("/v2/swap/submarine/stats/BTC/BTC")
                    .header("Referral", PRO_REFERRAL)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::OK);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert!(serde_json::from_slice::<PairStats>(&body).is_ok());
    }

    #[tokio::test]
    async fn get_stats_historical_data_not_available() {
        let res = setup_router(false)
            .oneshot(
                Request::builder()
                    .uri("/v2/swap/submarine/stats/BTC/BTC")
                    .header("Referral", PRO_REFERRAL)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, "historical data not available");
    }

    #[rstest]
    #[case("invalid")]
    #[case("asdf")]
    #[case("123")]
    #[tokio::test]
    async fn get_stats_invalid_swap_type(#[case] swap_type: &str) {
        let res = setup_router(true)
            .oneshot(
                Request::builder()
                    .uri(format!("/v2/swap/{swap_type}/stats/BTC/BTC"))
                    .header("Referral", PRO_REFERRAL)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, format!("invalid swap type: {swap_type}"));
    }

    #[rstest]
    #[case("default")]
    #[case("not-pro")]
    #[case("invalid")]
    #[tokio::test]
    async fn get_stats_non_pro(#[case] referral: &str) {
        let res = setup_router(true)
            .oneshot(
                Request::builder()
                    .uri("/v2/swap/submarine/stats/BTC/BTC")
                    .header("Referral", referral)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let error: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(error.error, "allowed only for Boltz Pro");
    }

    #[rstest]
    #[case("submarine", SwapType::Submarine)]
    #[case("reverse", SwapType::Reverse)]
    #[case("chain", SwapType::Chain)]
    fn test_parse_swap_type(#[case] input: &str, #[case] expected: SwapType) {
        assert_eq!(parse_swap_type(input).unwrap(), expected);
    }

    #[test]
    fn test_parse_swap_type_invalid() {
        let input = "invalid";
        assert_eq!(
            parse_swap_type(input).err().unwrap().to_string(),
            format!("invalid swap type: {input}")
        );
    }
}
