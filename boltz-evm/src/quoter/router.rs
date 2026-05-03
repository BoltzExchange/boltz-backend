use crate::quoter::Call;
use crate::quoter::common::{check_i24, check_u24};
use crate::quoter::route::{Data, Hop, UniswapV3Hop, UniswapV4Hop};
use alloy::dyn_abi::DynSolValue;
use alloy::primitives::{Address, Bytes, I256, U256, address};
use alloy::sol;
use alloy::sol_types::SolCall;
use anyhow::{Result, anyhow};

sol!(
    #[sol(rpc)]
    "./src/quoter/uniswap_v3/abis/IUniversalRouter.sol"
);

sol!("./src/quoter/uniswap_v3/abis/IERC20.sol");

const ACTION_OPEN_DELTA: U256 = U256::ZERO;
const ACTION_ADDRESS_THIS: Address = address!("0000000000000000000000000000000000000002");

#[derive(Debug, Clone)]
pub struct Router {
    weth: Address,
    router: Address,
}

impl Router {
    pub fn new(weth: Address, router: Address) -> Self {
        Self { weth, router }
    }

    pub fn handle_v3_eth(&self, token: Address) -> Address {
        if token == Address::ZERO {
            self.weth
        } else {
            token
        }
    }

    pub fn encode(
        &self,
        data: Data,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>> {
        if data.hops.is_empty() {
            return Err(anyhow!("no hops"));
        }

        let tokens = data.tokens();
        let mut calls = Vec::new();
        let mut commands = Commands::new();

        match &data.hops[0] {
            Hop::UniswapV3(_) if data.token_in == Address::ZERO => {
                commands = commands.wrap_ether(ACTION_ADDRESS_THIS, amount_in);
            }
            _ if data.token_in != Address::ZERO => {
                calls.push(Call {
                    to: data.token_in,
                    value: U256::ZERO,
                    data: IERC20::transferCall {
                        to: self.router,
                        value: amount_in,
                    }
                    .abi_encode(),
                });
            }
            _ => {}
        }

        for (index, hop) in data.hops.iter().enumerate() {
            let is_first = index == 0;
            let is_last = index == data.hops.len() - 1;
            let token_in = tokens[index];
            let token_out = hop.token_out();
            let output_recipient = self.output_recipient(hop, is_last, token_out, recipient);
            let min_output = if is_last { amount_out_min } else { U256::ZERO };
            let hop_amount_in = if is_first {
                AmountIn::Exact(amount_in)
            } else {
                AmountIn::ContractBalance
            };

            commands = match hop {
                Hop::UniswapV3(hop) => commands.v3_swap_exact_in(
                    output_recipient,
                    hop_amount_in,
                    min_output,
                    self.v3_path(token_in, hop)?,
                    false,
                ),
                Hop::UniswapV4(hop) => commands.v4_swap_exact_in(
                    self.v4_tokens(token_in, token_out, hop),
                    hop_amount_in,
                    min_output,
                    output_recipient,
                )?,
            };
        }

        if let Some(Hop::UniswapV3(last)) = data.hops.last()
            && last.token_out == Address::ZERO
        {
            commands = commands.unwrap_ether(recipient, amount_out_min);
        }

        calls.push(Call {
            to: self.router,
            value: self.value_for_route(&data, amount_in),
            data: IUniversalRouter::execute_1Call {
                commands: commands.commands.into(),
                inputs: commands.inputs,
            }
            .abi_encode(),
        });

        Ok(calls)
    }

    fn output_recipient(
        &self,
        hop: &Hop,
        is_last: bool,
        token_out: Address,
        recipient: Address,
    ) -> Address {
        if !is_last {
            return ACTION_ADDRESS_THIS;
        }

        match hop {
            Hop::UniswapV3(_) if token_out == Address::ZERO => ACTION_ADDRESS_THIS,
            _ => recipient,
        }
    }

    fn value_for_route(&self, data: &Data, amount_in: U256) -> U256 {
        if data.token_in == Address::ZERO {
            amount_in
        } else {
            U256::ZERO
        }
    }

    fn v3_path(&self, token_in: Address, hop: &UniswapV3Hop) -> Result<PathEncoder> {
        PathEncoder::new()
            .add_token(self.handle_v3_eth(token_in))
            .add_hop(hop.fee, self.handle_v3_eth(hop.token_out))
    }

    fn v4_tokens(&self, token_in: Address, token_out: Address, hop: &UniswapV4Hop) -> V4Tokens {
        let (currency0, currency1) = if token_in < token_out {
            (token_in, token_out)
        } else {
            (token_out, token_in)
        };

        V4Tokens {
            currency_in: token_in,
            currency_out: token_out,
            currency0,
            currency1,
            zero_for_one: token_in == currency0,
            fee: hop.fee,
            tick_spacing: hop.tick_spacing,
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum AmountIn {
    Exact(U256),
    ContractBalance,
}

impl AmountIn {
    fn command_amount(self) -> U256 {
        match self {
            AmountIn::Exact(amount) => amount,
            AmountIn::ContractBalance => action_contract_balance(),
        }
    }

    fn v4_swap_amount(self) -> U256 {
        match self {
            AmountIn::Exact(amount) => amount,
            AmountIn::ContractBalance => ACTION_OPEN_DELTA,
        }
    }

    fn v4_settle_amount(self) -> U256 {
        match self {
            AmountIn::Exact(amount) => amount,
            AmountIn::ContractBalance => action_contract_balance(),
        }
    }
}

#[derive(Debug, Clone, Copy)]
struct V4Tokens {
    currency_in: Address,
    currency_out: Address,
    currency0: Address,
    currency1: Address,
    zero_for_one: bool,
    fee: u64,
    tick_spacing: i32,
}

#[derive(Debug, Clone)]
struct Commands {
    commands: Vec<u8>,
    inputs: Vec<Bytes>,
}

impl Commands {
    fn new() -> Self {
        Self {
            commands: Vec::new(),
            inputs: Vec::new(),
        }
    }

    fn v3_swap_exact_in(
        mut self,
        recipient: Address,
        amount_in: AmountIn,
        amount_out_min: U256,
        path: PathEncoder,
        payer_is_user: bool,
    ) -> Self {
        self.add(
            Command::V3SwapExactIn,
            encode_dynamic_params(vec![
                DynSolValue::Address(recipient),
                DynSolValue::Uint(amount_in.command_amount(), 256),
                DynSolValue::Uint(amount_out_min, 256),
                DynSolValue::Bytes(path.data),
                DynSolValue::Bool(payer_is_user),
                DynSolValue::Array(vec![]),
            ])
            .into(),
        );
        self
    }

    fn v4_swap_exact_in(
        mut self,
        tokens: V4Tokens,
        amount_in: AmountIn,
        amount_out_min: U256,
        recipient: Address,
    ) -> Result<Self> {
        let (actions, params) = match amount_in {
            AmountIn::Exact(amount) => (
                vec![Action::SwapExactInSingle, Action::Settle, Action::Take],
                vec![
                    v4_exact_input_single(tokens, amount, amount_out_min)?,
                    encode_static_params(vec![
                        DynSolValue::Address(tokens.currency_in),
                        DynSolValue::Uint(amount, 256),
                        DynSolValue::Bool(false),
                    ]),
                    encode_static_params(vec![
                        DynSolValue::Address(tokens.currency_out),
                        DynSolValue::Address(recipient),
                        DynSolValue::Uint(amount_out_min, 256),
                    ]),
                ],
            ),
            AmountIn::ContractBalance => (
                vec![Action::Settle, Action::SwapExactInSingle, Action::Take],
                vec![
                    encode_static_params(vec![
                        DynSolValue::Address(tokens.currency_in),
                        DynSolValue::Uint(amount_in.v4_settle_amount(), 256),
                        DynSolValue::Bool(false),
                    ]),
                    v4_exact_input_single(tokens, amount_in.v4_swap_amount(), amount_out_min)?,
                    encode_static_params(vec![
                        DynSolValue::Address(tokens.currency_out),
                        DynSolValue::Address(recipient),
                        DynSolValue::Uint(amount_out_min, 256),
                    ]),
                ],
            ),
        };

        self.add(
            Command::V4Swap,
            encode_dynamic_params(vec![
                DynSolValue::Bytes(
                    actions
                        .into_iter()
                        .map(|action| action as u8)
                        .collect::<Vec<_>>(),
                ),
                DynSolValue::Array(params.into_iter().map(DynSolValue::Bytes).collect()),
            ])
            .into(),
        );

        Ok(self)
    }

    fn wrap_ether(mut self, recipient: Address, amount: U256) -> Self {
        self.add(
            Command::WrapEth,
            encode_static_params(vec![
                DynSolValue::Address(recipient),
                DynSolValue::Uint(amount, 256),
            ])
            .into(),
        );

        self
    }

    fn unwrap_ether(mut self, recipient: Address, amount: U256) -> Self {
        self.add(
            Command::UnwrapWeth,
            encode_static_params(vec![
                DynSolValue::Address(recipient),
                DynSolValue::Uint(amount, 256),
            ])
            .into(),
        );

        self
    }

    fn add(&mut self, command: Command, input: Bytes) {
        self.commands.push(command.encode(false));
        self.inputs.push(input);
    }
}

fn v4_exact_input_single(
    tokens: V4Tokens,
    amount_in: U256,
    amount_out_min: U256,
) -> Result<Vec<u8>> {
    check_u24(tokens.fee, "fee")?;
    check_i24(tokens.tick_spacing, "tickSpacing")?;
    check_u128(amount_in, "amountIn")?;
    check_u128(amount_out_min, "amountOutMin")?;

    Ok(DynSolValue::Tuple(vec![
        DynSolValue::Tuple(vec![
            DynSolValue::Address(tokens.currency0),
            DynSolValue::Address(tokens.currency1),
            DynSolValue::Uint(U256::from(tokens.fee), 24),
            DynSolValue::Int(I256::try_from(tokens.tick_spacing)?, 24),
            DynSolValue::Address(Address::ZERO),
        ]),
        DynSolValue::Bool(tokens.zero_for_one),
        DynSolValue::Uint(amount_in, 128),
        DynSolValue::Uint(amount_out_min, 128),
        DynSolValue::Uint(U256::ZERO, 256),
        DynSolValue::Bytes(vec![]),
    ])
    .abi_encode())
}

fn encode_static_params(values: Vec<DynSolValue>) -> Vec<u8> {
    DynSolValue::Tuple(values).abi_encode()
}

fn encode_dynamic_params(values: Vec<DynSolValue>) -> Vec<u8> {
    let mut data = DynSolValue::Tuple(values).abi_encode();
    data.drain(0..32);
    data
}

fn check_u128(value: U256, name: &str) -> Result<()> {
    if value > U256::from(u128::MAX) {
        return Err(anyhow!("{name} must be a 128-bit value"));
    }

    Ok(())
}

fn action_contract_balance() -> U256 {
    U256::from(1) << 255
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum Command {
    V3SwapExactIn = 0x00,
    V3SwapExactOut = 0x01,
    Permit2TransferFrom = 0x02,
    Permit2PermitBatch = 0x03,
    Sweep = 0x04,
    Transfer = 0x05,
    PayPortion = 0x06,
    PayPortionFullPrecision = 0x07,
    V2SwapExactIn = 0x08,
    V2SwapExactOut = 0x09,
    Permit2Permit = 0x0a,
    WrapEth = 0x0b,
    UnwrapWeth = 0x0c,
    Permit2TransferFromBatch = 0x0d,
    BalanceCheckErc20 = 0x0e,
    V4Swap = 0x10,
}

impl Command {
    const MASK: u8 = 0b0111_1111;

    fn encode(&self, allow_revert: bool) -> u8 {
        (*self as u8 & Self::MASK) | ((allow_revert as u8) << 7)
    }
}

#[derive(Debug, Clone, Copy)]
#[repr(u8)]
enum Action {
    SwapExactInSingle = 0x06,
    Settle = 0x0b,
    Take = 0x0e,
}

#[derive(Debug, Clone)]
pub struct PathEncoder {
    data: Vec<u8>,
}

impl PathEncoder {
    pub fn new() -> Self {
        Self { data: Vec::new() }
    }

    pub fn build(self) -> Vec<u8> {
        self.data
    }

    pub fn add_hop(self, fee: u64, token_out: Address) -> Result<Self> {
        Ok(self.add_fee(fee)?.add_token(token_out))
    }

    pub fn add_token(mut self, token: Address) -> Self {
        self.data.extend_from_slice(token.as_slice());
        self
    }

    pub fn add_fee(mut self, fee: u64) -> Result<Self> {
        check_u24(fee, "fee")?;

        let fee_bytes = [(fee >> 16) as u8, (fee >> 8) as u8, fee as u8];
        self.data.extend_from_slice(&fee_bytes);
        Ok(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::dyn_abi::DynSolType;
    use alloy::primitives::address;

    #[test]
    fn encodes_mixed_v3_v4_route() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let recipient = address!("0000000000000000000000000000000000000004");
        let router = address!("0000000000000000000000000000000000000005");
        let weth = address!("0000000000000000000000000000000000000006");

        let calls = Router::new(weth, router)
            .encode(
                Data {
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
                },
                recipient,
                U256::from(100),
                U256::from(95),
            )
            .unwrap();

        assert_eq!(calls.len(), 2);
        assert_eq!(calls[0].to, token_a);
        assert_eq!(calls[1].to, router);
        assert_eq!(calls[1].value, U256::ZERO);

        let execute = decode_execute(&calls[1]);
        assert_eq!(
            execute.commands.as_ref(),
            &[
                Command::V3SwapExactIn.encode(false),
                Command::V4Swap.encode(false),
            ],
        );
        assert_eq!(
            decode_v4_actions(&execute.inputs[1]),
            vec![
                Action::Settle as u8,
                Action::SwapExactInSingle as u8,
                Action::Take as u8,
            ],
        );
    }

    #[test]
    fn encodes_mixed_v4_v3_route() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");
        let recipient = address!("0000000000000000000000000000000000000004");
        let router = address!("0000000000000000000000000000000000000005");
        let weth = address!("0000000000000000000000000000000000000006");

        let calls = Router::new(weth, router)
            .encode(
                Data {
                    token_in: token_a,
                    hops: vec![
                        Hop::UniswapV4(UniswapV4Hop {
                            token_out: token_b,
                            fee: 3_000,
                            tick_spacing: 60,
                        }),
                        Hop::UniswapV3(UniswapV3Hop {
                            token_out: token_c,
                            fee: 500,
                        }),
                    ],
                },
                recipient,
                U256::from(100),
                U256::from(95),
            )
            .unwrap();

        assert_eq!(calls.len(), 2);
        assert_eq!(calls[0].to, token_a);
        assert_eq!(calls[1].to, router);
        assert_eq!(calls[1].value, U256::ZERO);

        let execute = decode_execute(&calls[1]);
        assert_eq!(
            execute.commands.as_ref(),
            &[
                Command::V4Swap.encode(false),
                Command::V3SwapExactIn.encode(false),
            ],
        );
        assert_eq!(
            decode_v4_actions(&execute.inputs[0]),
            vec![
                Action::SwapExactInSingle as u8,
                Action::Settle as u8,
                Action::Take as u8,
            ],
        );
    }

    #[test]
    fn native_input_to_v4_sends_execute_value_without_wrap() {
        let token = address!("0000000000000000000000000000000000000001");
        let recipient = address!("0000000000000000000000000000000000000002");
        let router = address!("0000000000000000000000000000000000000003");
        let weth = address!("0000000000000000000000000000000000000004");

        let calls = Router::new(weth, router)
            .encode(
                Data {
                    token_in: Address::ZERO,
                    hops: vec![Hop::UniswapV4(UniswapV4Hop {
                        token_out: token,
                        fee: 3_000,
                        tick_spacing: 60,
                    })],
                },
                recipient,
                U256::from(100),
                U256::from(95),
            )
            .unwrap();

        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].to, router);
        assert_eq!(calls[0].value, U256::from(100));
    }

    #[test]
    fn v3_native_output_unwraps_to_recipient() {
        let token = address!("0000000000000000000000000000000000000001");
        let recipient = address!("0000000000000000000000000000000000000002");
        let router = address!("0000000000000000000000000000000000000003");
        let weth = address!("0000000000000000000000000000000000000004");

        let calls = Router::new(weth, router)
            .encode(
                Data {
                    token_in: token,
                    hops: vec![Hop::UniswapV3(UniswapV3Hop {
                        token_out: Address::ZERO,
                        fee: 500,
                    })],
                },
                recipient,
                U256::from(100),
                U256::from(95),
            )
            .unwrap();

        assert_eq!(calls.len(), 2);
        assert_eq!(calls[0].to, token);
        assert_eq!(calls[1].to, router);
        assert_eq!(calls[1].value, U256::ZERO);
    }

    #[test]
    fn v4_rejects_amounts_that_do_not_fit_uint128() {
        let token = address!("0000000000000000000000000000000000000001");
        let recipient = address!("0000000000000000000000000000000000000002");
        let router = address!("0000000000000000000000000000000000000003");
        let weth = address!("0000000000000000000000000000000000000004");

        let err = Router::new(weth, router)
            .encode(
                Data {
                    token_in: Address::ZERO,
                    hops: vec![Hop::UniswapV4(UniswapV4Hop {
                        token_out: token,
                        fee: 500,
                        tick_spacing: 10,
                    })],
                },
                recipient,
                U256::from(u128::MAX) + U256::from(1),
                U256::from(95),
            )
            .unwrap_err();

        assert_eq!(err.to_string(), "amountIn must be a 128-bit value");
    }

    fn decode_execute(call: &Call) -> IUniversalRouter::execute_1Call {
        IUniversalRouter::execute_1Call::abi_decode(&call.data).unwrap()
    }

    fn decode_v4_actions(input: &Bytes) -> Vec<u8> {
        let ty = DynSolType::Tuple(vec![
            DynSolType::Bytes,
            DynSolType::Array(Box::new(DynSolType::Bytes)),
        ]);

        let DynSolValue::Tuple(values) = ty.abi_decode_params(input).unwrap() else {
            panic!("expected V4 swap tuple input");
        };

        let DynSolValue::Bytes(actions) = &values[0] else {
            panic!("expected V4 action bytes");
        };

        actions.clone()
    }
}
