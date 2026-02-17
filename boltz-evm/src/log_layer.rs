use alloy::{
    rpc::json_rpc::{RequestPacket, ResponsePacket},
    transports::TransportError,
};
use anyhow::Result;
use std::{
    fmt::Debug,
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};
use tower::{Layer, Service};
use tracing::Instrument;

pub struct LoggingLayer {
    pub symbol: String,
}

impl<S> Layer<S> for LoggingLayer {
    type Service = LoggingService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        LoggingService {
            symbol: self.symbol.clone(),
            inner,
        }
    }
}

#[derive(Debug, Clone)]
pub struct LoggingService<S> {
    symbol: String,
    inner: S,
}

impl<S> Service<RequestPacket> for LoggingService<S>
where
    S: Service<RequestPacket, Response = ResponsePacket, Error = TransportError>,
    S::Future: Send + 'static,
    S::Response: Send + 'static + Debug,
    S::Error: Send + 'static + Debug,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: RequestPacket) -> Self::Future {
        let method = match &req {
            RequestPacket::Single(request) => request.method(),
            RequestPacket::Batch(requests) => {
                if requests.is_empty() {
                    "batch(empty)"
                } else if requests.len() == 1 {
                    requests[0].method()
                } else {
                    &format!(
                        "batch({})",
                        requests
                            .iter()
                            .map(|r| r.method())
                            .collect::<Vec<&str>>()
                            .join(", ")
                    )
                }
            }
        };

        let span = tracing::info_span!("rpc_call", symbol = self.symbol, method = method);
        Box::pin(self.inner.call(req).instrument(span))
    }
}
