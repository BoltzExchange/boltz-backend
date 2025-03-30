use axum::Json;
use axum::body::Body;
use axum::extract::Request;
use axum::http::StatusCode;
use axum::http::header::CONTENT_TYPE;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use tracing::warn;

const API_ERROR_BODY_SIZE: usize = 1024 * 32;

#[derive(Debug, Deserialize, Serialize)]
pub struct ApiError {
    pub error: String,
}

pub struct AxumError(anyhow::Error);

impl IntoResponse for AxumError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiError {
                error: format!("{}", self.0),
            }),
        )
            .into_response()
    }
}

impl<E> From<E> for AxumError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

pub async fn error_middleware(request: Request<Body>, next: Next) -> Response<Body> {
    let response = next.run(request).await;
    if !response.status().is_server_error() && !response.status().is_client_error() {
        return response;
    }

    // No need to convert to JSON if the response is JSON already
    if match response.headers().get(CONTENT_TYPE) {
        Some(content_type) => content_type == "application/json",
        None => false,
    } {
        return response;
    }

    let (parts, body) = response.into_parts();
    let body_str = match axum::body::to_bytes(body, API_ERROR_BODY_SIZE).await {
        Ok(bytes) => {
            if !bytes.is_empty() {
                match std::str::from_utf8(&bytes) {
                    Ok(str) => str.to_string(),
                    Err(_) => return Response::from_parts(parts, Body::from(bytes)),
                }
            } else {
                return Response::from_parts(parts, Body::from(bytes));
            }
        }
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError {
                    error: format!("could not handle body: {}", err),
                }),
            )
                .into_response();
        }
    };

    (parts.status, Json(ApiError { error: body_str })).into_response()
}

pub async fn logging_middleware(request: Request<Body>, next: Next) -> Response<Body> {
    let request_uri = request.uri().clone();
    let response = next.run(request).await;
    if !response.status().is_server_error() && !response.status().is_client_error() {
        return response;
    }

    let (parts, body) = response.into_parts();
    let body_bytes = match axum::body::to_bytes(body, API_ERROR_BODY_SIZE).await {
        Ok(bytes) => bytes,
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError {
                    error: format!("could not handle body: {}", err),
                }),
            )
                .into_response();
        }
    };

    if !body_bytes.is_empty() {
        let body_str = match std::str::from_utf8(&body_bytes) {
            Ok(str) => str.to_string(),
            Err(_) => "unreadable body".to_string(),
        };
        warn!(
            status = parts.status.as_u16(),
            "Request to {} failed with {}: {}", request_uri, parts.status, body_str,
        );
    } else {
        warn!(
            status = parts.status.as_u16(),
            "Request to {} failed with {}", request_uri, parts.status
        );
    }

    Response::from_parts(parts, Body::from(body_bytes))
}

#[cfg(test)]
mod test {
    use super::*;
    use axum::Router;
    use axum::routing::get;
    use http_body_util::BodyExt;
    use rstest::rstest;
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn test_error_middleware_ignore_success() {
        let msg = "gm";

        let router = Router::new()
            .route(
                "/",
                get(move || async move { (StatusCode::CREATED, msg).into_response() }),
            )
            .layer(axum::middleware::from_fn(error_middleware));

        let res = router
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(res.status(), StatusCode::CREATED);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(std::str::from_utf8(&body).unwrap(), msg);
    }

    #[rstest]
    #[case(StatusCode::BAD_REQUEST)]
    #[case(StatusCode::NOT_IMPLEMENTED)]
    #[tokio::test]
    async fn test_error_middleware_already_json(#[case] code: StatusCode) {
        let msg = "ngmi";

        let router = Router::new()
            .route(
                "/",
                get(move || async move {
                    (
                        code,
                        Json(ApiError {
                            error: msg.to_owned(),
                        }),
                    )
                        .into_response()
                }),
            )
            .layer(axum::middleware::from_fn(error_middleware));

        let res = router
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(res.status(), code);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let body: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(body.error, msg);
    }

    #[rstest]
    #[case(StatusCode::BAD_REQUEST)]
    #[case(StatusCode::NOT_IMPLEMENTED)]
    #[tokio::test]
    async fn test_error_middleware_to_json(#[case] code: StatusCode) {
        let msg = "ngmi";

        let router = Router::new()
            .route(
                "/",
                get(move || async move { (code, msg.to_owned()).into_response() }),
            )
            .layer(axum::middleware::from_fn(error_middleware));

        let res = router
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(res.status(), code);

        let body = res.into_body().collect().await.unwrap().to_bytes();
        let body: ApiError = serde_json::from_slice(&body).unwrap();
        assert_eq!(body.error, msg);
    }
}
