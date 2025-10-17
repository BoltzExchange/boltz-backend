use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::service::{PubkeyIterator, SingleKeyIterator, XpubIterator};
use crate::swap::manager::SwapManager;
use crate::utils::serde::{PublicKeyDeserialize, XpubDeserialize};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
#[serde(untagged)]
pub enum RescueParams {
    Xpub {
        xpub: XpubDeserialize,
        #[serde(rename = "derivationPath")]
        derivation_path: Option<String>,
    },
    PublicKey {
        #[serde(rename = "publicKey")]
        public_key: PublicKeyDeserialize,
    },
}

impl TryFrom<RescueParams> for Box<dyn PubkeyIterator> {
    type Error = anyhow::Error;

    fn try_from(params: RescueParams) -> Result<Self, Self::Error> {
        match params {
            RescueParams::Xpub {
                xpub,
                derivation_path,
            } => Ok(Box::new(XpubIterator::new(xpub.0, derivation_path)?)),
            RescueParams::PublicKey { public_key } => {
                Ok(Box::new(SingleKeyIterator::new(public_key.0)))
            }
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
}
