use crate::api::ServerState;
use crate::api::errors::AxumError;
use crate::api::ws::status::SwapInfos;
use crate::swap::manager::SwapManager;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Extension, Json};
use bitcoin::bip32::Xpub;
use serde::de::Visitor;
use serde::{Deserialize, Deserializer};
use std::fmt;
use std::str::FromStr;
use std::sync::Arc;

struct XpubDeserialize(Xpub);

impl<'de> Deserialize<'de> for XpubDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct XpubDeserializeVisitor;

        impl Visitor<'_> for XpubDeserializeVisitor {
            type Value = XpubDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid xpub")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match Xpub::from_str(value) {
                    Ok(xpub) => Ok(XpubDeserialize(xpub)),
                    Err(err) => Err(E::custom(format!("invalid xpub: {}", err))),
                }
            }
        }

        deserializer.deserialize_string(XpubDeserializeVisitor)
    }
}

#[derive(Deserialize)]
pub struct RecoveryParams {
    xpub: XpubDeserialize,
}

pub async fn swap_recovery<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Json(RecoveryParams { xpub }): Json<RecoveryParams>,
) -> anyhow::Result<impl IntoResponse, AxumError>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    let res = state.service.swap_recovery.recover_xpub(&xpub.0)?;
    Ok((StatusCode::OK, Json(res)).into_response())
}

#[cfg(test)]
mod test {
    use crate::api::errors::ApiError;
    use crate::api::test::Fetcher;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Server, ServerState};
    use crate::service::Service;
    use crate::service::test::RecoverableSwap;
    use crate::swap::manager::test::MockManager;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::{Extension, Router};
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use tower::ServiceExt;

    fn setup_router() -> Router {
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);
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
    async fn test_swap_recovery() {
        let res = setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/swap/recovery")
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
            serde_json::from_slice::<Vec<RecoverableSwap>>(&body).unwrap(),
            vec![],
        );
    }

    #[tokio::test]
    async fn test_swap_recovery_invalid_xpub() {
        let res = setup_router()
            .oneshot(
                Request::builder()
                    .method(axum::http::Method::POST)
                    .uri("/v2/swap/recovery")
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
