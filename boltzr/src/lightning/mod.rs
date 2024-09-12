use std::fmt::{Display, Formatter};

pub mod cln;
pub mod invoice;

#[derive(Debug, PartialEq)]
pub enum Error {
    NoBolt12Support(String),
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::NoBolt12Support(reason) => write!(f, "no BOLT12 support: {}", reason),
        }
    }
}

impl std::error::Error for Error {}
