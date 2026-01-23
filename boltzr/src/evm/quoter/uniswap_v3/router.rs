use crate::evm::quoter::Call;
use crate::evm::quoter::uniswap_v3::router::IUniversalRouter::IUniversalRouterInstance;
use crate::evm::quoter::uniswap_v3::{Data, Hop};
use alloy::dyn_abi::DynSolValue;
use alloy::primitives::{Address, Bytes, U256};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use alloy::sol;
use alloy::sol_types::SolCall;
use anyhow::Result;

sol!(
    #[sol(rpc)]
    "./src/evm/quoter/uniswap_v3/abis/IUniversalRouter.sol"
);

sol!("./src/evm/quoter/uniswap_v3/abis/IERC20.sol");

#[derive(Debug, Clone)]
pub struct Router<P, N> {
    weth: Address,
    router: IUniversalRouterInstance<P, N>,
}

impl<P, N> Router<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    pub fn new(provider: P, weth: Address, router: Address) -> Self {
        Self {
            weth,
            router: IUniversalRouterInstance::new(router, provider),
        }
    }

    pub fn encode(
        &self,
        data: Data,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>> {
        let mut calldata = Vec::new();
        let mut commands = Commands::new();

        let is_ether_in = data.token_in == Address::ZERO;
        let is_ether_out =
            data.hops.last().ok_or(anyhow::anyhow!("no hops"))?.token == Address::ZERO;

        if is_ether_in {
            commands = commands.wrap_ether(*self.router.address(), amount_in);
        } else {
            calldata.push(Call {
                to: data.token_in,
                value: U256::ZERO,
                data: IERC20::transferCall {
                    to: *self.router.address(),
                    value: amount_in,
                }
                .abi_encode(),
            });
        }

        commands = commands.v3_swap_exact_in(
            if is_ether_out {
                *self.router.address()
            } else {
                recipient
            },
            amount_in,
            amount_out_min,
            PathEncoder::new()
                .add_token(self.handle_eth(data.token_in))
                .add_hops(
                    data.hops
                        .iter()
                        .map(|h| Hop {
                            fee: h.fee,
                            token: self.handle_eth(h.token),
                        })
                        .collect::<Vec<_>>()
                        .as_slice(),
                )?,
            false,
        );

        if is_ether_out {
            commands = commands.unwrap_ether(recipient, amount_out_min);
        }

        calldata.push(Call {
            to: *self.router.address(),
            value: if is_ether_in { amount_in } else { U256::ZERO },
            data: IUniversalRouter::execute_1Call {
                commands: commands.commands.into(),
                inputs: commands.inputs,
            }
            .abi_encode(),
        });

        Ok(calldata)
    }

    pub fn handle_eth(&self, token: Address) -> Address {
        // Uniswap V3 does not support the native token of the chain
        if token == Address::ZERO {
            return self.weth;
        }

        token
    }
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
        amount_in: U256,
        amount_out_min: U256,
        path: PathEncoder,
        payer_is_user: bool,
    ) -> Self {
        let mut data = DynSolValue::Tuple(vec![
            DynSolValue::Address(recipient),
            DynSolValue::Uint(amount_in, 256),
            DynSolValue::Uint(amount_out_min, 256),
            DynSolValue::Bytes(path.data),
            DynSolValue::Bool(payer_is_user),
        ])
        .abi_encode();

        // Remove the first 32 bytes (for some reason alloy adds them)
        data.drain(0..32);

        self.add(Command::V3SwapExactIn, data.into());
        self
    }

    fn wrap_ether(mut self, recipient: Address, amount: U256) -> Self {
        self.add(
            Command::WrapEth,
            DynSolValue::Tuple(vec![
                DynSolValue::Address(recipient),
                DynSolValue::Uint(amount, 256),
            ])
            .abi_encode()
            .into(),
        );

        self
    }

    fn unwrap_ether(mut self, recipient: Address, amount: U256) -> Self {
        self.add(
            Command::UnwrapWeth,
            DynSolValue::Tuple(vec![
                DynSolValue::Address(recipient),
                DynSolValue::Uint(amount, 256),
            ])
            .abi_encode()
            .into(),
        );

        self
    }

    fn add(&mut self, command: Command, input: Bytes) {
        self.commands.push(command.encode(false));
        self.inputs.push(input);
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum Command {
    // 0x00..0x08
    V3SwapExactIn = 0x00,
    V3SwapExactOut,
    Permit2TransferFrom,
    Permit2PermitBatch,
    Sweep,
    Transfer,
    PayPortion,

    // 0x08..0x10
    V2SwapExactIn = 0x08,
    V2SwapExactOut,
    Permit2Permit,
    WrapEth,
    UnwrapWeth,
    Permit2TransferFromBatch,
}

impl Command {
    const MASK: u8 = 0b00111111;

    fn encode(&self, allow_revert: bool) -> u8 {
        (*self as u8 & Self::MASK) | ((allow_revert as u8) << 7)
    }
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

    pub fn add_hops(mut self, hops: &[Hop]) -> Result<Self> {
        for hop in hops {
            self = self.add_hop(hop.fee, hop.token)?;
        }
        Ok(self)
    }

    pub fn add_hop(self, fee: u64, token_out: Address) -> Result<Self> {
        Ok(self.add_fee(fee)?.add_token(token_out))
    }

    pub fn add_token(mut self, token: Address) -> Self {
        self.data.extend_from_slice(token.as_slice());
        self
    }

    pub fn add_fee(mut self, fee: u64) -> Result<Self> {
        if fee > 0xFFFFFF {
            return Err(anyhow::anyhow!("fee must be a 24-bit value"));
        }

        let fee_bytes = [(fee >> 16) as u8, (fee >> 8) as u8, fee as u8];
        self.data.extend_from_slice(&fee_bytes);
        Ok(self)
    }
}
