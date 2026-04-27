//! Atomic swap primitives for Bitcoin and Liquid (Elements).
//!
//! `boltz-core` provides the building blocks the [Boltz](https://boltz.exchange)
//! backend uses to construct, sign, and rescue submarine and reverse swaps on
//! Bitcoin and Liquid. The crate is split along two axes:
//!
//! * **Chain.** The `bitcoin` and `elements` feature modules each contain
//!   chain-specific script builders, transaction constructors, and Taproot
//!   helpers. The `wrapper` module offers a thin chain-agnostic facade over
//!   both via `Transaction` and `construct_tx`.
//! * **Capability.** The `musig` module implements a typed-state MuSig2 builder
//!   for cooperative signing. The `network` module enumerates the supported
//!   chains and maps to the upstream `bitcoin::Network` /
//!   `elements::AddressParams`.
//!   The `address` module parses an address as either chain.
//!
//! Every chain and capability is gated behind a Cargo feature
//! (`bitcoin`, `elements`, `musig`); all three are enabled by default.
//!
//! See the `musig` module for a runnable end-to-end cooperative signing
//! example.

#![warn(missing_docs)]

#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod address;
#[cfg(feature = "bitcoin")]
pub mod bitcoin;
#[cfg(feature = "elements")]
pub mod elements;
#[cfg(feature = "musig")]
pub mod musig;
#[cfg(any(feature = "bitcoin", feature = "elements"))]
pub mod network;
pub mod utils;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod wrapper;

#[cfg(any(feature = "bitcoin", feature = "elements"))]
mod consts;
mod preimage_detector;
#[cfg(any(feature = "bitcoin", feature = "elements"))]
mod target_fee;

#[cfg(test)]
mod client;

#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use address::{Address, AddressError};
#[cfg(feature = "bitcoin")]
pub use bitcoin::TxError as BitcoinTxError;
#[cfg(feature = "elements")]
pub use elements::{AssetRescueError, TxError as ElementsTxError};
#[cfg(feature = "musig")]
pub use musig::{Musig, MusigError};
#[cfg(any(feature = "bitcoin", feature = "elements"))]
pub use network::{Network, NetworkError};
pub use preimage_detector::detect_preimage;
#[cfg(any(feature = "bitcoin", feature = "elements"))]
pub use target_fee::FeeTarget;
pub use utils::Destination;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use wrapper::{Transaction, WrapperError};
