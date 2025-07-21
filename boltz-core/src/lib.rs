#[cfg(feature = "bitcoin")]
pub mod bitcoin;
#[cfg(feature = "elements")]
pub mod elements;
#[cfg(feature = "musig")]
mod musig;
mod preimage_detector;
mod target_fee;
mod utils;

#[cfg(feature = "musig")]
pub use musig::Musig;
pub use preimage_detector::detect_preimage;
