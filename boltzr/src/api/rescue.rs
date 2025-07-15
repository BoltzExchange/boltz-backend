use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::swap::manager::SwapManager;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::Deserialize;
use std::sync::Arc;

use crate::utils::xpub::XpubDeserialize;
#[derive(Deserialize)]
pub struct RescueParams {
    xpub: XpubDeserialize,
    #[serde(rename = "derivationPath")]
    derivation_path: Option<String>,
}

pub async fn swap_rescue<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(RescueParams {
        xpub,
        derivation_path,
    }): Json<RescueParams>,
) -> anyhow::Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let res = state
        .service
        .swap_rescue
        .rescue_xpub(&xpub.0, derivation_path)?;
    Ok((StatusCode::OK, Json(res)).into_response())
}

#[cfg(test)]
mod test {
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

    #[tokio::test]
    async fn test_swap_rescue() {
        let res = setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/swap/rescue")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&serde_json::json!({
                            "xpub": "xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym"
                        }))
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::OK);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(
            serde_json::from_slice::<Vec<RescuableSwap>>(&body).unwrap(),
            vec![],
        );
    }

    #[tokio::test]
    async fn test_swap_rescue_invalid_xpub() {
        let res = setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/swap/rescue")
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::to_vec(&serde_json::json!({
                            "xpub": "invalid"
                        }))
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
            "Failed to deserialize the JSON body into the target type: xpub: invalid xpub: base58 encoding error at line 1 column 17"
        );
    }
}
