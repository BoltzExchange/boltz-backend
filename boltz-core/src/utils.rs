#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputType<U, S> {
    Taproot(U),
    SegwitV0(S),
    Compatibility(S),
    Legacy(S),
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputType {
    Claim([u8; 32]),
    Refund(u32),
}

pub trait Transaction {
    fn input_len(&self) -> usize;
    fn vsize(&self) -> usize;
}

pub trait TxIn {
    fn witness(&self) -> Vec<Vec<u8>>;
    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>>;
}
