#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputType {
    Taproot,
    SegwitV0,
    Compatibility,
    Legacy,
}

pub trait Transaction {
    fn input_len(&self) -> usize;
    fn vsize(&self) -> usize;
}

pub trait TxIn {
    fn witness(&self) -> Vec<Vec<u8>>;
    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>>;
}
