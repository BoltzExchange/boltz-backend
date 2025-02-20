use axum_extra::headers::{Error, Header, HeaderName, HeaderValue};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Referral(String);

impl Referral {
    pub fn inner(&self) -> &str {
        &self.0
    }
}

impl Header for Referral {
    fn name() -> &'static HeaderName {
        static NAME: HeaderName = HeaderName::from_static("referral");
        &NAME
    }

    fn decode<'i, I>(values: &mut I) -> Result<Self, Error>
    where
        Self: Sized,
        I: Iterator<Item = &'i HeaderValue>,
    {
        let value = values.next().ok_or_else(Error::invalid)?;
        value
            .to_str()
            .map_err(|_| Error::invalid())
            .map(|value| Self(value.to_owned()))
    }

    fn encode<E: Extend<HeaderValue>>(&self, values: &mut E) {
        values.extend(std::iter::once(
            HeaderValue::from_str(&self.0).expect("invalid header value"),
        ));
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use axum::Router;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    use axum::routing::get;
    use axum_extra::TypedHeader;
    use http_body_util::BodyExt;
    use rstest::rstest;
    use tower::ServiceExt;

    #[rstest]
    #[case("Referral")]
    #[case("referral")]
    #[case("refeRral")]
    #[tokio::test]
    async fn test_referral_decode(#[case] key: &str) {
        let expected = "pro";

        let router = Router::new().route(
            "/",
            get(
                move |TypedHeader(referral): TypedHeader<Referral>| async move {
                    (StatusCode::CREATED, referral.inner().to_owned()).into_response()
                },
            ),
        );

        let res = router
            .oneshot(
                Request::builder()
                    .uri("/")
                    .header(key, expected)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = res.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(std::str::from_utf8(&body).unwrap(), expected);
    }
}
