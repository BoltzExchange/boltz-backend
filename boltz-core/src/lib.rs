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
