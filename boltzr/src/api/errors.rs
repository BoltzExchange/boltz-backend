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
    let request_method = request.method().clone();
    let request_uri = request.uri().clone();
    let (parts, body) = request.into_parts();

    let (request_body_bytes, request_body_str) = match read_body(body).await {
        Ok(body) => body,
        Err(err) => (
            axum::body::Bytes::new(),
            Some(format!("could not handle request body: {}", err)),
        ),
    };

    let response = next
        .run(Request::from_parts(parts, Body::from(request_body_bytes)))
        .await;
    if !response.status().is_server_error() && !response.status().is_client_error() {
        return response;
    }

    let (parts, body) = response.into_parts();
    let (response_body_bytes, response_body_str) = match read_body(body).await {
        Ok(body) => body,
        Err(err) => (
            axum::body::Bytes::new(),
            Some(format!("could not handle response body: {}", err)),
        ),
    };

    warn!(
        status = parts.status.as_u16(),
        "Request to {} {}{} failed with {}{}",
        request_method,
        request_uri,
        match request_body_str {
            Some(str) => format!(" ({})", str),
            None => "".to_string(),
        },
        parts.status.as_u16(),
        match response_body_str {
            Some(str) => format!(": {}", str),
            None => "".to_string(),
        },
    );

    Response::from_parts(parts, Body::from(response_body_bytes))
}

async fn read_body(body: Body) -> anyhow::Result<(axum::body::Bytes, Option<String>)> {
    let body_bytes = axum::body::to_bytes(body, API_ERROR_BODY_SIZE).await?;

    if body_bytes.is_empty() {
        Ok((body_bytes, None))
    } else {
        let body_str = std::str::from_utf8(&body_bytes)?.to_string();
        Ok((body_bytes, Some(body_str)))
    }
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
