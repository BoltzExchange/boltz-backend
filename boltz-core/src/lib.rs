#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod address;
#[cfg(feature = "bitcoin")]
pub mod bitcoin;
#[cfg(feature = "elements")]
pub mod elements;
pub mod utils;
#[cfg(all(feature = "bitcoin", feature = "elements"))]
pub mod wrapper;

#[cfg(test)]
mod client;
mod consts;
#[cfg(feature = "musig")]
mod musig;
mod preimage_detector;
mod target_fee;

#[cfg(feature = "musig")]
pub use musig::Musig;
pub use preimage_detector::detect_preimage;
pub use target_fee::FeeTarget;
pub use utils::Destination;
