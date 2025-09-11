#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod address;
#[cfg(feature = "bitcoin")]
pub mod bitcoin;
#[cfg(feature = "elements")]
pub mod elements;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod network;
pub mod utils;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod wrapper;

mod consts;
#[cfg(feature = "musig")]
mod musig;
mod preimage_detector;
mod target_fee;

#[cfg(test)]
mod client;

#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use address::Address;
#[cfg(feature = "musig")]
pub use musig::Musig;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub use network::Network;
pub use preimage_detector::detect_preimage;
pub use target_fee::FeeTarget;
pub use utils::Destination;
