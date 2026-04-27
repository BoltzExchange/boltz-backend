use alloy::contract::Error as ContractError;
use alloy::primitives::{Address, Bytes, U256};
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fmt;
use std::future::Future;
use tracing::{debug, warn};

const UNEXPECTED_REVERT_BYTES_SELECTOR: [u8; 4] = [0x61, 0x90, 0xb2, 0xb0];
const ERROR_STRING_SELECTOR: [u8; 4] = [0x08, 0xc3, 0x79, 0xa0];
const POOL_NOT_INITIALIZED_SELECTOR: [u8; 4] = [0x48, 0x6a, 0xa3, 0x07];
const NOT_ENOUGH_LIQUIDITY_SELECTOR: [u8; 4] = [0x7a, 0x5e, 0xd7, 0x34];
const EXPECTED_NO_QUOTE_REASONS: [&str; 2] = ["SPL", "Unexpected error"];

#[derive(Deserialize, Serialize, PartialEq, Eq, Hash, Clone, Copy, Debug)]
pub enum Dex {
    #[serde(rename = "uniswapV3")]
    UniswapV3,
    #[serde(rename = "uniswapV4")]
    UniswapV4,
}

impl fmt::Display for Dex {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Dex::UniswapV3 => write!(f, "uniswapV3"),
            Dex::UniswapV4 => write!(f, "uniswapV4"),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(tag = "dex")]
pub enum Hop {
    #[serde(rename = "uniswapV3")]
    UniswapV3(UniswapV3Hop),
    #[serde(rename = "uniswapV4")]
    UniswapV4(UniswapV4Hop),
}

impl Hop {
    pub fn dex(&self) -> Dex {
        match self {
            Hop::UniswapV3(_) => Dex::UniswapV3,
            Hop::UniswapV4(_) => Dex::UniswapV4,
        }
    }

    pub fn token_out(&self) -> Address {
        match self {
            Hop::UniswapV3(hop) => hop.token_out,
            Hop::UniswapV4(hop) => hop.token_out,
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct UniswapV3Hop {
    #[serde(rename = "tokenOut")]
    pub token_out: Address,
    pub fee: u64,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct UniswapV4Hop {
    #[serde(rename = "tokenOut")]
    pub token_out: Address,
    pub fee: u64,
    #[serde(rename = "tickSpacing")]
    pub tick_spacing: i32,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Data {
    #[serde(rename = "tokenIn")]
    pub token_in: Address,
    pub hops: Vec<Hop>,
}

impl Data {
    pub fn tokens(&self) -> Vec<Address> {
        std::iter::once(self.token_in)
            .chain(self.hops.iter().map(Hop::token_out))
            .collect()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Quote {
    pub quote: U256,
    pub data: Data,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuoteCall {
    pub target: Address,
    pub data: Bytes,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuoteCallResult {
    pub success: bool,
    pub return_data: Bytes,
}

pub(crate) trait RouteQuoter {
    fn dex(&self) -> Dex;
    fn router(&self) -> Address;
    fn multicall(&self) -> Address;

    fn candidates<'a>(
        &'a self,
        pairs: &'a [(Address, Address)],
    ) -> impl Future<Output = Result<HashMap<(Address, Address), Vec<Hop>>>> + Send + 'a;

    fn quote_input_call(&self, token_in: Address, hop: &Hop, amount_in: U256) -> Result<QuoteCall>;

    fn quote_output_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<QuoteCall>;

    fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256>;

    fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256>;
}

pub(crate) async fn generate_routes<Q>(
    token_in: Address,
    token_out: Address,
    liquid_tokens: &[Address],
    quoters: &[Q],
) -> Vec<Data>
where
    Q: RouteQuoter + Sync,
{
    let mut pairs = vec![(token_in, token_out)];
    let mut seen_intermediates = HashSet::new();
    let mut intermediates = Vec::new();

    for intermediate in liquid_tokens {
        if *intermediate == Address::ZERO || *intermediate == token_in || *intermediate == token_out
        {
            continue;
        }

        if seen_intermediates.insert(*intermediate) {
            intermediates.push(*intermediate);
            pairs.push((token_in, *intermediate));
            pairs.push((*intermediate, token_out));
        }
    }

    let candidates = candidate_hops(&pairs, quoters).await;

    let mut routes = candidates
        .get(&from_to_key(token_in, token_out))
        .into_iter()
        .flatten()
        .cloned()
        .map(|hop| Data {
            token_in,
            hops: vec![hop],
        })
        .collect::<Vec<_>>();

    for intermediate in intermediates {
        let first = candidates
            .get(&from_to_key(token_in, intermediate))
            .into_iter()
            .flatten()
            .cloned()
            .collect::<Vec<_>>();
        let second = candidates
            .get(&from_to_key(intermediate, token_out))
            .into_iter()
            .flatten()
            .cloned()
            .collect::<Vec<_>>();

        for first_hop in &first {
            for second_hop in &second {
                routes.push(Data {
                    token_in,
                    hops: vec![first_hop.clone(), second_hop.clone()],
                });
            }
        }
    }

    routes
}

pub(crate) async fn quote_input_routes<Q, F, Fut>(
    quoters: &[Q],
    mut aggregate: F,
    routes: Vec<Data>,
    amount_in: U256,
) -> Result<Vec<Quote>>
where
    Q: RouteQuoter + Sync,
    F: FnMut(Vec<QuoteCall>) -> Fut,
    Fut: Future<Output = Result<Vec<QuoteCallResult>>>,
{
    let mut pending = routes
        .into_iter()
        .filter(|route| !route.hops.is_empty())
        .map(|route| PendingInputRoute {
            route,
            index: 0,
            quote: amount_in,
        })
        .collect::<Vec<_>>();
    let mut quotes = Vec::new();

    while !pending.is_empty() {
        let mut calls = Vec::new();

        for pending_route in pending {
            let Some(call) = build_input_call(quoters, pending_route) else {
                continue;
            };
            calls.push(call);
        }

        if calls.is_empty() {
            break;
        }

        pending = Vec::new();
        let results = aggregate(calls.iter().map(|call| call.call.clone()).collect()).await?;

        for (call, result) in calls.into_iter().zip(results) {
            let Some(quote) = decode_input_result(quoters, &call, result) else {
                continue;
            };

            let mut pending_route = call.pending;
            pending_route.quote = quote;
            pending_route.index += 1;

            if pending_route.index == pending_route.route.hops.len() {
                quotes.push(Quote {
                    quote,
                    data: pending_route.route,
                });
            } else {
                pending.push(pending_route);
            }
        }
    }

    Ok(quotes)
}

pub(crate) async fn quote_output_routes<Q, F, Fut>(
    quoters: &[Q],
    mut aggregate: F,
    routes: Vec<Data>,
    amount_out: U256,
) -> Result<Vec<Quote>>
where
    Q: RouteQuoter + Sync,
    F: FnMut(Vec<QuoteCall>) -> Fut,
    Fut: Future<Output = Result<Vec<QuoteCallResult>>>,
{
    let mut pending = routes
        .into_iter()
        .filter_map(|route| {
            (!route.hops.is_empty()).then(|| PendingOutputRoute {
                index: route.hops.len() - 1,
                route,
                quote: amount_out,
            })
        })
        .collect::<Vec<_>>();
    let mut quotes = Vec::new();

    while !pending.is_empty() {
        let mut calls = Vec::new();

        for pending_route in pending {
            let Some(call) = build_output_call(quoters, pending_route) else {
                continue;
            };
            calls.push(call);
        }

        if calls.is_empty() {
            break;
        }

        pending = Vec::new();
        let results = aggregate(calls.iter().map(|call| call.call.clone()).collect()).await?;

        for (call, result) in calls.into_iter().zip(results) {
            let Some(quote) = decode_output_result(quoters, &call, result) else {
                continue;
            };

            let mut pending_route = call.pending;
            pending_route.quote = quote;

            if pending_route.index == 0 {
                quotes.push(Quote {
                    quote,
                    data: pending_route.route,
                });
            } else {
                pending_route.index -= 1;
                pending.push(pending_route);
            }
        }
    }

    Ok(quotes)
}

async fn candidate_hops<Q>(
    pairs: &[(Address, Address)],
    quoters: &[Q],
) -> HashMap<(Address, Address), Vec<Hop>>
where
    Q: RouteQuoter + Sync,
{
    let mut candidates = pairs
        .iter()
        .copied()
        .map(|pair| (from_to_key(pair.0, pair.1), Vec::new()))
        .collect::<HashMap<_, _>>();

    for quoter in quoters {
        match quoter.candidates(pairs).await {
            Ok(quoter_candidates) => {
                for (pair, hops) in quoter_candidates {
                    candidates.entry(pair).or_default().extend(hops);
                }
            }
            Err(err) => warn!("{} candidate lookup failed: {:#}", quoter.dex(), err),
        }
    }

    candidates
}

#[derive(Debug, Clone)]
struct PendingInputRoute {
    route: Data,
    index: usize,
    quote: U256,
}

#[derive(Debug, Clone)]
struct PendingOutputRoute {
    route: Data,
    index: usize,
    quote: U256,
}

#[derive(Debug, Clone)]
struct InputQuoteCall {
    pending: PendingInputRoute,
    dex: Dex,
    call: QuoteCall,
}

#[derive(Debug, Clone)]
struct OutputQuoteCall {
    pending: PendingOutputRoute,
    dex: Dex,
    call: QuoteCall,
}

fn build_input_call<Q>(quoters: &[Q], pending: PendingInputRoute) -> Option<InputQuoteCall>
where
    Q: RouteQuoter + Sync,
{
    let hop = &pending.route.hops[pending.index];
    let token_in = if pending.index == 0 {
        pending.route.token_in
    } else {
        pending.route.hops[pending.index - 1].token_out()
    };
    let dex = hop.dex();
    let call = find_quoter(quoters, dex)
        .and_then(|quoter| quoter.quote_input_call(token_in, hop, pending.quote));

    match call {
        Ok(call) => Some(InputQuoteCall { pending, dex, call }),
        Err(err) => {
            log_route_quote_error(&err);
            None
        }
    }
}

fn build_output_call<Q>(quoters: &[Q], pending: PendingOutputRoute) -> Option<OutputQuoteCall>
where
    Q: RouteQuoter + Sync,
{
    let tokens = pending.route.tokens();
    let hop = &pending.route.hops[pending.index];
    let dex = hop.dex();
    let call = find_quoter(quoters, dex)
        .and_then(|quoter| quoter.quote_output_call(tokens[pending.index], hop, pending.quote));

    match call {
        Ok(call) => Some(OutputQuoteCall { pending, dex, call }),
        Err(err) => {
            log_route_quote_error(&err);
            None
        }
    }
}

fn decode_input_result<Q>(
    quoters: &[Q],
    call: &InputQuoteCall,
    result: QuoteCallResult,
) -> Option<U256>
where
    Q: RouteQuoter + Sync,
{
    decode_quote_result(quoters, call.dex, result, |quoter, return_data| {
        quoter.decode_quote_input(return_data)
    })
}

fn decode_output_result<Q>(
    quoters: &[Q],
    call: &OutputQuoteCall,
    result: QuoteCallResult,
) -> Option<U256>
where
    Q: RouteQuoter + Sync,
{
    decode_quote_result(quoters, call.dex, result, |quoter, return_data| {
        quoter.decode_quote_output(return_data)
    })
}

fn decode_quote_result<Q, F>(
    quoters: &[Q],
    dex: Dex,
    result: QuoteCallResult,
    decoder: F,
) -> Option<U256>
where
    Q: RouteQuoter + Sync,
    F: Fn(&Q, &[u8]) -> Result<U256>,
{
    if !result.success {
        log_route_quote_revert(&result.return_data);
        return None;
    }

    match find_quoter(quoters, dex).and_then(|quoter| decoder(quoter, &result.return_data)) {
        Ok(quote) => Some(quote),
        Err(err) => {
            log_route_quote_error(&err);
            None
        }
    }
}

fn find_quoter<Q>(quoters: &[Q], dex: Dex) -> Result<&Q>
where
    Q: RouteQuoter + Sync,
{
    quoters
        .iter()
        .find(|quoter| quoter.dex() == dex)
        .ok_or_else(|| anyhow!("no quoter found for dex: {}", dex))
}

fn from_to_key(from: Address, to: Address) -> (Address, Address) {
    (from, to)
}

fn log_route_quote_error(err: &anyhow::Error) {
    if is_expected_no_quote_error(err) {
        return;
    }

    debug!("Route quote failed: {:#}", err);
}

fn log_route_quote_revert(return_data: &[u8]) {
    if is_expected_no_quote_revert_data(return_data) {
        return;
    }

    debug!(
        data = %format!("0x{}", hex::encode(return_data)),
        "Route quote failed"
    );
}

fn is_expected_no_quote_error(err: &anyhow::Error) -> bool {
    err.chain().any(|cause| {
        cause
            .downcast_ref::<ContractError>()
            .and_then(ContractError::as_revert_data)
            .is_some_and(|data| is_expected_no_quote_revert_data(data.as_ref()))
    })
}

fn is_expected_no_quote_revert_data(data: &[u8]) -> bool {
    is_expected_no_quote_selector(data)
        || is_expected_no_quote_error_string(data)
        || decode_unexpected_revert_bytes(data).is_some_and(is_expected_no_quote_revert_data)
}

fn is_expected_no_quote_selector(data: &[u8]) -> bool {
    data.starts_with(&POOL_NOT_INITIALIZED_SELECTOR)
        || data.starts_with(&NOT_ENOUGH_LIQUIDITY_SELECTOR)
}

fn is_expected_no_quote_error_string(data: &[u8]) -> bool {
    let Some(reason) = decode_error_string(data) else {
        return false;
    };

    EXPECTED_NO_QUOTE_REASONS.contains(&reason.as_str())
}

fn decode_unexpected_revert_bytes(data: &[u8]) -> Option<&[u8]> {
    if !data.starts_with(&UNEXPECTED_REVERT_BYTES_SELECTOR) || data.len() < 4 + 32 + 32 {
        return None;
    }

    decode_abi_bytes(&data[4..])
}

fn decode_error_string(data: &[u8]) -> Option<String> {
    if !data.starts_with(&ERROR_STRING_SELECTOR) || data.len() < 4 + 32 + 32 {
        return None;
    }

    std::str::from_utf8(decode_abi_bytes(&data[4..])?)
        .ok()
        .map(str::to_string)
}

fn decode_abi_bytes(payload: &[u8]) -> Option<&[u8]> {
    let offset: usize = U256::from_be_slice(&payload[..32]).try_into().ok()?;
    let length_start = offset;
    let length_end = length_start.checked_add(32)?;

    if payload.len() < length_end {
        return None;
    }

    let length = U256::from_be_slice(&payload[length_start..length_end])
        .try_into()
        .ok()?;
    let data_start = length_end;
    let data_end = data_start.checked_add(length)?;

    if payload.len() < data_end {
        return None;
    }

    Some(&payload[data_start..data_end])
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::primitives::address;
    use std::collections::{HashMap, VecDeque};
    use std::sync::Mutex;

    #[test]
    fn data_tokens_returns_route_tokens() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");

        let data = Data {
            token_in: token_a,
            hops: vec![
                Hop::UniswapV3(UniswapV3Hop {
                    token_out: token_b,
                    fee: 500,
                }),
                Hop::UniswapV4(UniswapV4Hop {
                    token_out: token_c,
                    fee: 3_000,
                    tick_spacing: 60,
                }),
            ],
        };

        assert_eq!(data.tokens(), vec![token_a, token_b, token_c]);
    }

    #[test]
    fn detects_pool_not_initialized_revert_data() {
        assert!(is_expected_no_quote_revert_data(
            &POOL_NOT_INITIALIZED_SELECTOR
        ));

        let wrapped = hex::decode(
            "6190b2b0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000004\
             486aa30700000000000000000000000000000000000000000000000000000000",
        )
        .unwrap();
        assert!(is_expected_no_quote_revert_data(&wrapped));

        assert!(!is_expected_no_quote_revert_data(&[0xde, 0xad, 0xbe, 0xef]));
    }

    #[test]
    fn detects_not_enough_liquidity_revert_data() {
        assert!(is_expected_no_quote_revert_data(
            &NOT_ENOUGH_LIQUIDITY_SELECTOR
        ));

        let wrapped = hex::decode(
            "6190b2b0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000024\
             7a5ed7343b122aa1efaf6f68dd3be31df7c466ad6a928fa59911501b9790a619e7689644\
             00000000000000000000000000000000000000000000000000000000",
        )
        .unwrap();
        assert!(is_expected_no_quote_revert_data(&wrapped));
    }

    #[test]
    fn detects_expected_no_quote_error_strings() {
        let spl = hex::decode(
            "08c379a0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000003\
             53504c0000000000000000000000000000000000000000000000000000000000",
        )
        .unwrap();
        assert_eq!(decode_error_string(&spl), Some("SPL".to_string()));
        assert!(is_expected_no_quote_revert_data(&spl));

        let unexpected = hex::decode(
            "08c379a0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000010\
             556e6578706563746564206572726f7200000000000000000000000000000000",
        )
        .unwrap();
        assert_eq!(
            decode_error_string(&unexpected),
            Some("Unexpected error".to_string()),
        );
        assert!(is_expected_no_quote_revert_data(&unexpected));

        let unknown = hex::decode(
            "08c379a0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000007\
             756e6b6e6f776e00000000000000000000000000000000000000000000000000",
        )
        .unwrap();
        assert!(!is_expected_no_quote_revert_data(&unknown));
    }

    #[test]
    fn detects_wrapped_expected_no_quote_error_string() {
        let wrapped = hex::decode(
            "6190b2b0\
             0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000064\
             08c379a000000000000000000000000000000000000000000000000000000000\
             0000002000000000000000000000000000000000000000000000000000000000\
             0000000353504c00000000000000000000000000000000000000000000000000\
             0000000000",
        )
        .unwrap();
        assert!(is_expected_no_quote_revert_data(&wrapped));
    }

    #[tokio::test]
    async fn generate_routes_combines_dexes_across_intermediates() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");

        let v3 = MockQuoter {
            dex: Dex::UniswapV3,
            candidates: HashMap::from([(
                (token_a, token_b),
                vec![Hop::UniswapV3(UniswapV3Hop {
                    token_out: token_b,
                    fee: 500,
                })],
            )]),
        };
        let v4 = MockQuoter {
            dex: Dex::UniswapV4,
            candidates: HashMap::from([(
                (token_b, token_c),
                vec![Hop::UniswapV4(UniswapV4Hop {
                    token_out: token_c,
                    fee: 3_000,
                    tick_spacing: 60,
                })],
            )]),
        };
        let quoters = vec![v3, v4];

        let routes = generate_routes(token_a, token_c, &[token_b], &quoters).await;

        assert_eq!(
            routes,
            vec![Data {
                token_in: token_a,
                hops: vec![
                    Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_b,
                        fee: 500,
                    }),
                    Hop::UniswapV4(UniswapV4Hop {
                        token_out: token_c,
                        fee: 3_000,
                        tick_spacing: 60,
                    }),
                ],
            }],
        );
    }

    #[tokio::test]
    async fn generate_routes_deduplicates_intermediates() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let quoter = MockQuoter {
            dex: Dex::UniswapV3,
            candidates: HashMap::from([
                (
                    (token_a, token_b),
                    vec![Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_b,
                        fee: 500,
                    })],
                ),
                (
                    (token_b, token_c),
                    vec![Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_c,
                        fee: 3_000,
                    })],
                ),
            ]),
        };
        let quoters = vec![quoter];

        let routes = generate_routes(
            token_a,
            token_c,
            &[Address::ZERO, token_b, token_b, token_a, token_c],
            &quoters,
        )
        .await;

        assert_eq!(routes.len(), 1);
    }

    #[tokio::test]
    async fn quote_input_routes_applies_hops_in_order() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let quoters = vec![
            MockQuoter {
                dex: Dex::UniswapV3,
                candidates: HashMap::new(),
            },
            MockQuoter {
                dex: Dex::UniswapV4,
                candidates: HashMap::new(),
            },
        ];
        let multicall = MockMulticall::new(vec![vec![quote_result(14)], vec![quote_result(15)]]);

        let quotes = quote_input_routes(
            &quoters,
            |calls| multicall.aggregate(calls),
            vec![Data {
                token_in: token_a,
                hops: vec![
                    Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_b,
                        fee: 500,
                    }),
                    Hop::UniswapV4(UniswapV4Hop {
                        token_out: token_c,
                        fee: 3_000,
                        tick_spacing: 60,
                    }),
                ],
            }],
            U256::from(7),
        )
        .await
        .unwrap();

        assert_eq!(quotes.len(), 1);
        assert_eq!(quotes[0].quote, U256::from(15));
        assert_eq!(*multicall.batch_sizes.lock().unwrap(), vec![1, 1]);
    }

    #[tokio::test]
    async fn quote_output_routes_applies_hops_in_reverse_order() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let quoters = vec![
            MockQuoter {
                dex: Dex::UniswapV3,
                candidates: HashMap::new(),
            },
            MockQuoter {
                dex: Dex::UniswapV4,
                candidates: HashMap::new(),
            },
        ];
        let multicall = MockMulticall::new(vec![vec![quote_result(21)], vec![quote_result(42)]]);

        let quotes = quote_output_routes(
            &quoters,
            |calls| multicall.aggregate(calls),
            vec![Data {
                token_in: token_a,
                hops: vec![
                    Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_b,
                        fee: 500,
                    }),
                    Hop::UniswapV4(UniswapV4Hop {
                        token_out: token_c,
                        fee: 3_000,
                        tick_spacing: 60,
                    }),
                ],
            }],
            U256::from(20),
        )
        .await
        .unwrap();

        assert_eq!(quotes.len(), 1);
        assert_eq!(quotes[0].quote, U256::from(42));
        assert_eq!(*multicall.batch_sizes.lock().unwrap(), vec![1, 1]);
    }

    #[tokio::test]
    async fn quote_input_routes_drops_failed_first_hops_before_second_phase() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let quoters = vec![MockQuoter {
            dex: Dex::UniswapV3,
            candidates: HashMap::new(),
        }];
        let multicall = MockMulticall::new(vec![vec![QuoteCallResult {
            success: false,
            return_data: POOL_NOT_INITIALIZED_SELECTOR.into(),
        }]]);

        let quotes = quote_input_routes(
            &quoters,
            |calls| multicall.aggregate(calls),
            vec![Data {
                token_in: token_a,
                hops: vec![
                    Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_b,
                        fee: 500,
                    }),
                    Hop::UniswapV3(UniswapV3Hop {
                        token_out: token_c,
                        fee: 3_000,
                    }),
                ],
            }],
            U256::from(7),
        )
        .await
        .unwrap();

        assert!(quotes.is_empty());
        assert_eq!(*multicall.batch_sizes.lock().unwrap(), vec![1]);
    }

    struct MockQuoter {
        dex: Dex,
        candidates: HashMap<(Address, Address), Vec<Hop>>,
    }

    impl RouteQuoter for MockQuoter {
        fn dex(&self) -> Dex {
            self.dex
        }

        fn router(&self) -> Address {
            Address::ZERO
        }

        fn multicall(&self) -> Address {
            Address::ZERO
        }

        async fn candidates(
            &self,
            pairs: &[(Address, Address)],
        ) -> Result<HashMap<(Address, Address), Vec<Hop>>> {
            Ok(pairs
                .iter()
                .filter_map(|pair| self.candidates.get(pair).cloned().map(|hops| (*pair, hops)))
                .collect())
        }

        fn quote_input_call(
            &self,
            _token_in: Address,
            _hop: &Hop,
            _amount_in: U256,
        ) -> Result<QuoteCall> {
            Ok(QuoteCall {
                target: Address::ZERO,
                data: Bytes::new(),
            })
        }

        fn quote_output_call(
            &self,
            _token_in: Address,
            _hop: &Hop,
            _amount_out: U256,
        ) -> Result<QuoteCall> {
            Ok(QuoteCall {
                target: Address::ZERO,
                data: Bytes::new(),
            })
        }

        fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
            decode_mock_quote(return_data)
        }

        fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
            decode_mock_quote(return_data)
        }
    }

    struct MockMulticall {
        batches: Mutex<VecDeque<Vec<QuoteCallResult>>>,
        batch_sizes: Mutex<Vec<usize>>,
    }

    impl MockMulticall {
        fn new(batches: Vec<Vec<QuoteCallResult>>) -> Self {
            Self {
                batches: Mutex::new(batches.into()),
                batch_sizes: Mutex::new(Vec::new()),
            }
        }
    }

    impl MockMulticall {
        async fn aggregate(&self, calls: Vec<QuoteCall>) -> Result<Vec<QuoteCallResult>> {
            self.batch_sizes.lock().unwrap().push(calls.len());
            self.batches
                .lock()
                .unwrap()
                .pop_front()
                .ok_or_else(|| anyhow!("missing mock multicall batch"))
        }
    }

    fn quote_result(value: u64) -> QuoteCallResult {
        QuoteCallResult {
            success: true,
            return_data: value.to_string().into_bytes().into(),
        }
    }

    fn decode_mock_quote(return_data: &[u8]) -> Result<U256> {
        Ok(std::str::from_utf8(return_data)?.parse()?)
    }
}
