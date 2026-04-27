//! Shared types and traits used across the chain modules: the
//! [`OutputType`] / [`InputType`] descriptors, the [`Destination`]
//! pay-to spec, and the [`TxIn`] trait that
//! [`detect_preimage`](crate::detect_preimage) generic-bounds against.

/// The script type a swap output uses.
///
/// `U` is the per-variant payload for Taproot outputs (typically the
/// uncooperative-spend `Tree` details for swap inputs, or `()` for plain
/// destinations). `S` is the payload for pre-Taproot variants.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputType<U, S> {
    /// BIP-341 Taproot output.
    Taproot(U),
    /// Native segwit v0 (`P2WSH` / `P2WPKH`) output.
    SegwitV0(S),
    /// Nested-segwit (`P2SH`-wrapped `P2WSH`) output.
    Compatibility(S),
    /// Legacy `P2SH` output.
    Legacy(S),
}

/// Which side of a swap is being spent on an input.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputType {
    /// Claim leg, holding the 32-byte preimage that unlocks the HTLC.
    Claim([u8; 32]),
    /// Refund leg, holding the absolute locktime that must be reached.
    Refund(u32),
}

/// Where the funds of a constructed transaction should be sent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Destination<'a, A> {
    /// Sweep all input value (minus fees) to a single address.
    Single(A),
    /// Pay a list of explicit outputs and send any remainder to a change address.
    Multiple(Outputs<'a, A>),
}

/// Explicit outputs plus a change destination, used by [`Destination::Multiple`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Outputs<'a, A> {
    /// Address that receives the residual input value after `outputs` and fees.
    pub change: A,
    /// List of `(address, amount in satoshis)` outputs to pay explicitly.
    pub outputs: &'a [(A, u64)],
}

#[cfg(any(feature = "bitcoin", feature = "elements"))]
pub(crate) trait Transaction {
    fn input_len(&self) -> usize;
    fn vsize(&self) -> usize;
}

/// A transaction input that exposes its witness and pushed script-sig bytes,
/// used by [`detect_preimage`](crate::detect_preimage) to scan claim spends.
pub trait TxIn {
    /// All witness stack items for this input.
    fn witness(&self) -> Vec<Vec<u8>>;
    /// All data pushes from this input's `scriptSig` (excluding opcodes).
    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>>;
}
