#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod address;
#[cfg(feature = "bitcoin")]
pub mod bitcoin;
#[cfg(feature = "elements")]
pub mod elements;
#[cfg(feature = "musig")]
pub mod musig;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod network;
pub mod utils;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod wrapper;

mod consts;
mod preimage_detector;
mod target_fee;

#[cfg(test)]
mod client;

#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use address::Address;
#[cfg(feature = "musig")]
pub use musig::{Musig, PublicNonce};
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use network::Network;
pub use preimage_detector::detect_preimage;
pub use target_fee::FeeTarget;
pub use utils::Destination;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use wrapper::Transaction;
