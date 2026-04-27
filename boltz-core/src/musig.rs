//! MuSig2 cooperative signing.
//!
//! This module wraps `secp256k1`'s MuSig2 primitives in a phantom-typed
//! state machine ([`MusigBuilder`]) so the type system enforces the
//! protocol order: a method can only be called when the builder is in the
//! state that method is allowed in. Six type aliases name the reachable
//! states ([`Setup`], [`WithMessage`], [`WithNonce`], [`WithAggregatedNonces`],
//! [`WithSession`], [`SignedSession`]).
//!
//! The full protocol flow is: [`Musig::setup`] → [`Setup::message`] →
//! [`WithMessage::generate_nonce`] → exchange [`WithNonce::pub_nonce`] with
//! co-signers → [`WithNonce::aggregate_nonces`] → [`WithAggregatedNonces::initialize_session`]
//! → [`WithSession::partial_sign`] → exchange partial signatures via
//! [`MusigBuilder::partial_add`] → [`SignedSession::partial_aggregate`].
//!
//! For nonce-handling escape hatches see [`WithMessage::dangerous_set_nonce`]
//! and [`WithNonce::dangerous_secnonce`]. Reusing a secret nonce leaks the
//! private key — read those `# Safety` blocks before persisting nonce state
//! across processes.
//!
//! # Example: 2-of-2 cooperative signing
//!
//! Each party drives its own [`MusigBuilder`] through the protocol and they
//! exchange the public nonce and partial signature in between.
//!
//! ```
//! use boltz_core::musig::Musig;
//! use secp256k1::{Keypair, rand};
//!
//! let our_key = Keypair::new(&mut rand::rng());
//! let their_key = Keypair::new(&mut rand::rng());
//! let pub_keys = vec![our_key.public_key(), their_key.public_key()];
//! let msg = [0x42u8; 32];
//!
//! // Each party initializes its own builder up to the nonce phase.
//! let our = Musig::setup(our_key, pub_keys.clone())?
//!     .message(msg)
//!     .generate_nonce(&mut rand::rng());
//! let their = Musig::setup(their_key, pub_keys)?
//!     .message(msg)
//!     .generate_nonce(&mut rand::rng());
//!
//! // Exchange public nonces.
//! let our_pub_nonce = *our.pub_nonce();
//! let their_pub_nonce = *their.pub_nonce();
//!
//! // Each party aggregates the other's nonce, opens the session, and signs.
//! let our = our
//!     .aggregate_nonces(vec![(their_key.public_key(), their_pub_nonce)])?
//!     .initialize_session()?
//!     .partial_sign()?;
//! let their = their
//!     .aggregate_nonces(vec![(our_key.public_key(), our_pub_nonce)])?
//!     .initialize_session()?
//!     .partial_sign()?;
//!
//! // Counterparty sends their partial signature; we absorb it and aggregate.
//! let their_partial = their.our_partial_signature();
//! let combined = our.partial_add(their_key.public_key(), their_partial)?;
//!
//! let agg_pk = combined.agg_pk();
//! let final_sig = combined.partial_aggregate()?;
//! final_sig.verify(&agg_pk, &msg)?;
//! # Ok::<(), boltz_core::musig::MusigError>(())
//! ```
#![deny(missing_docs)]

use secp256k1::musig::{
    AggregatedNonce, AggregatedSignature, KeyAggCache, PartialSignature, PublicNonce, SecretNonce,
    Session, SessionSecretRand,
};
use secp256k1::rand::rngs::ThreadRng;
use secp256k1::{Keypair, PublicKey, Scalar, SecretKey, rand};
use std::marker::PhantomData;

/// Re-export of `secp256k1::XOnlyPublicKey` used as the aggregated MuSig2 public key.
pub use secp256k1::XOnlyPublicKey;

/// Errors produced by the MuSig2 builder.
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum MusigError {
    /// The local public key was not present in the list passed to [`Musig::setup`].
    #[error("our public key is not in the list of public keys")]
    OurKeyNotInList,
    /// A public key was looked up that does not appear in the participant list.
    #[error("key not found in public keys")]
    KeyNotFound,
    /// Tried to aggregate nonces before [`WithMessage::generate_nonce`] was called.
    #[error("our nonce is not generated yet")]
    OurNonceNotGenerated,
    /// The set of nonces passed to [`WithNonce::aggregate_nonces`] does not match the participant count.
    #[error("incorrect number of nonces")]
    IncorrectNonceCount,
    /// No nonce was supplied for the participant identified by this hex-encoded public key.
    #[error("nonce not found for key: {0}")]
    NonceNotFoundForKey(String),
    /// In [`WithNonce::aggregate_nonces_ordered`] our own nonce is not at our participant index.
    #[error("our nonce is at incorrect index")]
    OurNonceWrongIndex,
    /// A partial signature passed to [`MusigBuilder::partial_add`] failed verification.
    #[error("partial signature is not valid")]
    InvalidPartialSignature,
    /// At [`SignedSession::partial_aggregate`] some participants had not contributed a partial signature.
    #[error("partial signature is missing")]
    MissingPartialSignature,
    /// Underlying `secp256k1` error.
    #[error(transparent)]
    Secp(#[from] secp256k1::Error),
    /// Failed to parse a public nonce, partial signature, or related MuSig2 byte payload.
    #[error(transparent)]
    Parse(#[from] secp256k1::musig::ParseError),
    /// Tweak supplied to [`Setup::xonly_tweak_add`] is invalid.
    #[error(transparent)]
    InvalidTweak(#[from] secp256k1::musig::InvalidTweakErr),
    /// A scalar value passed to [`Musig::convert_scalar_be`] exceeds the curve order.
    #[error(transparent)]
    OutOfRange(#[from] secp256k1::scalar::OutOfRangeError),
    /// A byte slice did not have the expected fixed length for the value being parsed.
    #[error(transparent)]
    Slice(#[from] std::array::TryFromSliceError),
}

/// Compile-time state markers for [`MusigBuilder`].
///
/// These types parameterize the builder so each method is only callable in
/// the appropriate phase of the MuSig2 protocol. They are sealed: external
/// crates cannot implement [`State`] or [`Signedness`].
pub mod state {
    /// Marks a state in the protocol progression
    /// (initial → message set → nonce generated → nonces aggregated → session ready).
    pub trait State: sealed::Sealed {}
    /// Marks whether the local partial signature has been produced yet.
    pub trait Signedness: sealed::Sealed {}

    /// Initial state: builder constructed, no message bound yet.
    pub struct NoMessage;
    /// Message has been set; local nonce not yet generated.
    pub struct MissingNonce;
    /// Local nonce generated; awaiting co-signer nonces.
    pub struct NonceGenerated;
    /// All nonces aggregated; session not yet initialized.
    pub struct NoncesAggregated;
    /// Session initialized; ready to sign / verify partial signatures.
    pub struct SessionInitialized;

    /// The local participant has not produced a partial signature yet.
    pub struct Unsigned;
    /// The local participant has produced a partial signature.
    pub struct Signed;

    impl State for NoMessage {}
    impl State for MissingNonce {}
    impl State for NonceGenerated {}
    impl State for NoncesAggregated {}
    impl State for SessionInitialized {}

    impl Signedness for Unsigned {}
    impl Signedness for Signed {}

    mod sealed {
        pub trait Sealed {}
        impl Sealed for super::NoMessage {}
        impl Sealed for super::MissingNonce {}
        impl Sealed for super::NonceGenerated {}
        impl Sealed for super::NoncesAggregated {}
        impl Sealed for super::SessionInitialized {}
        impl Sealed for super::Unsigned {}
        impl Sealed for super::Signed {}
    }
}

use state::{
    MissingNonce, NoMessage, NonceGenerated, NoncesAggregated, SessionInitialized, Signed,
    Signedness, State, Unsigned,
};

/// Builder right after [`Musig::setup`]: ready to absorb a message.
pub type Setup = MusigBuilder<NoMessage, Unsigned>;
/// Builder after [`MusigBuilder::message`]: ready to generate a nonce.
pub type WithMessage = MusigBuilder<MissingNonce, Unsigned>;
/// Builder after [`MusigBuilder::generate_nonce`]: ready to aggregate co-signer nonces.
pub type WithNonce = MusigBuilder<NonceGenerated, Unsigned>;
/// Builder after [`MusigBuilder::aggregate_nonces`]: ready to initialize the session.
pub type WithAggregatedNonces = MusigBuilder<NoncesAggregated, Unsigned>;
/// Builder after [`MusigBuilder::initialize_session`]: ready to produce a partial signature.
pub type WithSession = MusigBuilder<SessionInitialized, Unsigned>;
/// Builder after [`MusigBuilder::partial_sign`]: ready to aggregate partial signatures.
pub type SignedSession = MusigBuilder<SessionInitialized, Signed>;

/// Phantom-typed state machine that drives a MuSig2 signing session.
///
/// The two type parameters track which protocol step the builder is in
/// (`S: State`) and whether the local participant has produced their
/// partial signature yet (`T: Signedness`). The reachable states are spelled
/// out by the [`Setup`], [`WithMessage`], [`WithNonce`],
/// [`WithAggregatedNonces`], [`WithSession`], and [`SignedSession`] type
/// aliases. See the [module-level example](self) for end-to-end usage.
#[must_use = "MusigBuilder advances the signing state machine; dropping it discards signing progress"]
pub struct MusigBuilder<S: State, T: Signedness> {
    key: Keypair,
    msg: Option<[u8; 32]>,
    nonce: Option<(SecretNonce, PublicNonce)>,

    aggcache: KeyAggCache,
    pub_keys: Vec<PublicKey>,
    pub_nonces: Option<Vec<PublicNonce>>,
    aggnonce: Option<AggregatedNonce>,
    session: Option<Session>,
    partial_sigs: Vec<Option<PartialSignature>>,

    _state: PhantomData<S>,
    _signed: PhantomData<T>,
}

impl<S: State, T: Signedness> MusigBuilder<S, T> {
    /// The aggregated x-only public key for this signing session.
    pub fn agg_pk(&self) -> XOnlyPublicKey {
        self.aggcache.agg_pk()
    }

    /// Number of participants in this signing session.
    pub fn num_participants(&self) -> usize {
        self.pub_keys.len()
    }

    fn our_index(&self) -> Result<usize, MusigError> {
        self.key_index(self.key.public_key())
    }

    fn key_index(&self, public_key: PublicKey) -> Result<usize, MusigError> {
        self.pub_keys
            .iter()
            .position(|k| k == &public_key)
            .ok_or(MusigError::KeyNotFound)
    }
}

impl Setup {
    /// Construct a new MuSig2 builder for the given local key and participant set.
    ///
    /// Returns [`MusigError::OurKeyNotInList`] if `key`'s public key is not in `pub_keys`.
    pub fn new(key: Keypair, pub_keys: Vec<PublicKey>) -> Result<Self, MusigError> {
        let our_pubkey = key.public_key();
        if !pub_keys.contains(&our_pubkey) {
            return Err(MusigError::OurKeyNotInList);
        }

        let aggcache = KeyAggCache::new(&pub_keys.iter().collect::<Vec<_>>());

        Ok(Self {
            key,
            msg: None,
            nonce: None,
            aggcache,
            partial_sigs: vec![None; pub_keys.len()],
            pub_keys,
            pub_nonces: None,
            aggnonce: None,
            session: None,
            _state: PhantomData::<NoMessage>,
            _signed: PhantomData::<Unsigned>,
        })
    }

    /// Apply an x-only tweak to the aggregated public key (BIP-341 taproot tweak).
    pub fn xonly_tweak_add(mut self, tweak: &Scalar) -> Result<Self, MusigError> {
        self.aggcache.pubkey_xonly_tweak_add(tweak)?;
        Ok(self)
    }

    /// Bind the 32-byte message that will be signed and advance to [`WithMessage`].
    pub fn message(self, msg: [u8; 32]) -> WithMessage {
        MusigBuilder {
            key: self.key,
            msg: Some(msg),
            nonce: self.nonce,
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            pub_nonces: self.pub_nonces,
            aggnonce: self.aggnonce,
            session: self.session,
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<MissingNonce>,
            _signed: PhantomData::<Unsigned>,
        }
    }
}

impl WithMessage {
    /// Generate a fresh MuSig2 nonce pair from `rng` and advance to [`WithNonce`].
    pub fn generate_nonce<R: rand::Rng + ?Sized>(self, rng: &mut R) -> WithNonce {
        let session_secrand = SessionSecretRand::from_rng(rng);
        let msg = self
            .msg
            .expect("WithMessage state guarantees message is set");
        let (secret, public) =
            self.aggcache
                .nonce_gen(session_secrand, self.key.public_key(), &msg, None);

        MusigBuilder {
            key: self.key,
            msg: self.msg,
            nonce: Some((secret, public)),
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            pub_nonces: self.pub_nonces,
            aggnonce: self.aggnonce,
            session: self.session,
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<NonceGenerated>,
            _signed: PhantomData::<Unsigned>,
        }
    }

    /// Inject a caller-supplied MuSig2 nonce pair instead of generating one.
    ///
    /// This bypasses the secure nonce generation in [`Self::generate_nonce`]
    /// and is intended only for restoring builder state across processes
    /// (e.g. resuming a half-finished signing session from on-disk storage)
    /// or for deterministic test vectors. Production code should use
    /// [`Self::generate_nonce`].
    ///
    /// # Safety
    ///
    /// MuSig2 derives security from the secret nonce being **uniformly random
    /// and used at most once across the lifetime of the signing key**. The
    /// caller is responsible for upholding the following invariants; violating
    /// any of them allows an attacker to recover the secret key from two
    /// resulting partial signatures:
    ///
    /// - `sec_nonce` MUST come from a cryptographically secure RNG (or an
    ///   equally unpredictable source — never a counter, timestamp, hash of
    ///   the message, or output of a non-CSPRNG).
    /// - The pair `(sec_nonce, pub_nonce)` MUST never have been used to
    ///   produce a partial signature with this `Keypair` against any message,
    ///   *including across process restarts, replicas, and backups*.
    /// - `sec_nonce` MUST NOT be logged or sent to any other party. If persisted
    ///   for resumption, the storage backend becomes part of the trusted signing
    ///   boundary: anyone who can read the nonce and observe the resulting
    ///   partial signature can recover the signing key. Keep persisted nonces
    ///   short-lived, access-controlled, restored at most once, and deleted
    ///   immediately after the partial signature is produced. The pre-signature
    ///   `pub_nonce` may be shared.
    /// - `pub_nonce` MUST be the public counterpart of `sec_nonce` — supplying
    ///   a mismatched pair will produce signatures that fail verification.
    ///
    /// Reusing the same `sec_nonce` for two different messages, two different
    /// co-signer sets, or two different aggregated nonces leaks the private
    /// key. Treat any state restored through this method as single-use: once
    /// `partial_sign` runs, the nonce is burned forever.
    pub fn dangerous_set_nonce(
        self,
        sec_nonce: &[u8],
        pub_nonce: &[u8],
    ) -> Result<WithNonce, MusigError> {
        Ok(MusigBuilder {
            key: self.key,
            msg: self.msg,
            nonce: Some((
                SecretNonce::dangerous_from_bytes(sec_nonce.try_into()?),
                Musig::convert_pub_nonce(pub_nonce)?,
            )),
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            pub_nonces: self.pub_nonces,
            aggnonce: self.aggnonce,
            session: self.session,
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<NonceGenerated>,
            _signed: PhantomData::<Unsigned>,
        })
    }
}

impl WithNonce {
    /// The public nonce to share with co-signers.
    pub fn pub_nonce(&self) -> &PublicNonce {
        self.nonce
            .as_ref()
            .map(|(_, pubnonce)| pubnonce)
            .expect("WithNonce state guarantees nonce is set")
    }

    /// Extract the raw secret nonce, consuming the builder.
    ///
    /// This exists so callers can serialize a half-finished signing session —
    /// for example, persist `(sec_nonce, pub_nonce)` to disk and resume later
    /// via [`MusigBuilder::dangerous_set_nonce`]. Production code that signs
    /// in a single process should never need this: feed the builder straight
    /// through `aggregate_nonces` → `initialize_session` → `partial_sign` and
    /// let the secret nonce drop on the floor.
    ///
    /// # Safety
    ///
    /// The returned [`SecretNonce`] is single-use signing material: any code
    /// path that obtains it must guarantee the following invariants. Failure
    /// to do so allows an attacker who observes two resulting partial
    /// signatures to recover the private key.
    ///
    /// - The nonce MUST be used to produce **at most one** partial signature.
    ///   That includes signing the same `(message, co-signer set, aggregated
    ///   nonce)` combination twice — every combination counts as a separate
    ///   use.
    /// - The nonce MUST NOT be reused across replicas, retries, restored
    ///   backups, or after a crash. Treat it as consumed the moment it leaves
    ///   this method, even if the resulting signature was never broadcast.
    /// - The nonce MUST NOT be logged, sent over the wire, or shared with any
    ///   other party (including co-signers — they only ever see the public
    ///   nonce).
    /// - When persisting for resumption, treat the storage backend as part of
    ///   the trusted signing boundary. Anyone who can read the nonce and
    ///   observe the resulting partial signature can recover the signing key.
    ///   Keep persisted nonces short-lived, access-controlled, delete them from
    ///   storage as soon as the partial signature is produced, and never
    ///   restore the same blob more than once.
    pub fn dangerous_secnonce(self) -> SecretNonce {
        self.nonce
            .expect("WithNonce state guarantees nonce is set")
            .0
    }

    /// Aggregate co-signer public nonces (any order; this method matches them by public key)
    /// and advance to [`WithAggregatedNonces`]. Our own nonce is appended automatically if missing.
    pub fn aggregate_nonces(
        self,
        mut nonces: Vec<(PublicKey, PublicNonce)>,
    ) -> Result<WithAggregatedNonces, MusigError> {
        if !nonces.iter().any(|(pk, _)| pk == &self.key.public_key()) {
            if let Some((_, our_nonce)) = &self.nonce {
                nonces.push((self.key.public_key(), *our_nonce));
            } else {
                return Err(MusigError::OurNonceNotGenerated);
            }
        }

        if nonces.len() != self.num_participants() {
            return Err(MusigError::IncorrectNonceCount);
        }

        let mut ordered = Vec::with_capacity(self.num_participants());

        for key in &self.pub_keys {
            if let Some((_, nonce)) = nonces.iter().find(|(pk, _)| pk == key) {
                ordered.push(*nonce);
            } else {
                return Err(MusigError::NonceNotFoundForKey(hex::encode(
                    key.serialize(),
                )));
            }
        }

        self.aggregate_nonces_ordered(ordered)
    }

    /// Aggregate co-signer public nonces, where `nonces[i]` corresponds to participant `i`
    /// in the same order as the public keys passed to [`Musig::setup`].
    pub fn aggregate_nonces_ordered(
        self,
        nonces: Vec<PublicNonce>,
    ) -> Result<WithAggregatedNonces, MusigError> {
        if nonces.len() != self.num_participants() {
            return Err(MusigError::IncorrectNonceCount);
        }

        if let Some((_, our_nonce)) = &self.nonce {
            let our_index = self
                .our_index()
                .expect("our public key is in pub_keys (checked at builder construction)");
            if nonces.get(our_index) != Some(our_nonce) {
                return Err(MusigError::OurNonceWrongIndex);
            }
        } else {
            return Err(MusigError::OurNonceNotGenerated);
        }

        Ok(MusigBuilder {
            key: self.key,
            msg: self.msg,
            nonce: self.nonce,
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            aggnonce: Some(AggregatedNonce::new(&nonces.iter().collect::<Vec<_>>())),
            pub_nonces: Some(nonces),
            session: self.session,
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<NoncesAggregated>,
            _signed: PhantomData::<Unsigned>,
        })
    }
}

impl WithAggregatedNonces {
    /// Open a MuSig2 signing session bound to the message and aggregated nonces.
    pub fn initialize_session(self) -> Result<WithSession, MusigError> {
        let aggnonce = self
            .aggnonce
            .expect("WithAggregatedNonces state guarantees aggnonce is set");
        let msg = self
            .msg
            .expect("WithAggregatedNonces state guarantees message is set");
        let session = Session::new(&self.aggcache, aggnonce, &msg);

        Ok(MusigBuilder {
            key: self.key,
            msg: self.msg,
            nonce: self.nonce,
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            pub_nonces: self.pub_nonces,
            aggnonce: self.aggnonce,
            session: Some(session),
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<SessionInitialized>,
            _signed: PhantomData::<Unsigned>,
        })
    }
}

impl<T: Signedness> MusigBuilder<SessionInitialized, T> {
    /// Verify a partial signature claimed to be produced by `public_key` against this session.
    pub fn partial_verify(
        &self,
        public_key: PublicKey,
        sig: PartialSignature,
    ) -> Result<bool, MusigError> {
        let index = self.key_index(public_key)?;
        let nonce = *self
            .pub_nonces
            .as_ref()
            .expect("SessionInitialized state guarantees pub_nonces is set")
            .get(index)
            .expect("pub_nonces.len() == pub_keys.len() (builder invariant)");
        let session = self
            .session
            .expect("SessionInitialized state guarantees session is set");
        Ok(session.partial_verify(&self.aggcache, &sig, &nonce, public_key))
    }

    /// Verify the partial signature, then store it for the participant identified by `public_key`.
    /// Returns [`MusigError::InvalidPartialSignature`] if verification fails.
    pub fn partial_add(
        mut self,
        public_key: PublicKey,
        sig: PartialSignature,
    ) -> Result<MusigBuilder<SessionInitialized, T>, MusigError> {
        if !self.partial_verify(public_key, sig)? {
            return Err(MusigError::InvalidPartialSignature);
        }

        let index = self.key_index(public_key)?;
        *self
            .partial_sigs
            .get_mut(index)
            .expect("partial_sigs.len() == pub_keys.len() (builder invariant)") = Some(sig);

        Ok(self)
    }
}

impl WithSession {
    /// Produce the local participant's partial signature and advance to [`SignedSession`].
    pub fn partial_sign(mut self) -> Result<SignedSession, MusigError> {
        let session = self
            .session
            .expect("SessionInitialized state guarantees session is set");
        let secret_nonce = self
            .nonce
            .take()
            .expect("SessionInitialized + Unsigned state guarantees nonce is set")
            .0;
        let partial_sig = session.partial_sign(secret_nonce, &self.key, &self.aggcache);
        let our_index = self
            .our_index()
            .expect("our public key is in pub_keys (checked at builder construction)");
        let our_slot = self
            .partial_sigs
            .get_mut(our_index)
            .expect("partial_sigs.len() == pub_keys.len() (builder invariant)");
        debug_assert!(our_slot.is_none());
        *our_slot = Some(partial_sig);

        Ok(MusigBuilder {
            key: self.key,
            msg: self.msg,
            nonce: None,
            aggcache: self.aggcache,
            pub_keys: self.pub_keys,
            pub_nonces: self.pub_nonces,
            aggnonce: self.aggnonce,
            session: self.session,
            partial_sigs: self.partial_sigs,
            _state: PhantomData::<SessionInitialized>,
            _signed: PhantomData::<Signed>,
        })
    }
}

impl<T: State> MusigBuilder<T, Signed> {
    /// The local participant's partial signature, ready to send to co-signers.
    pub fn our_partial_signature(&self) -> PartialSignature {
        let our_index = self
            .our_index()
            .expect("our public key is in pub_keys (checked at builder construction)");
        self.partial_sigs
            .get(our_index)
            .expect("partial_sigs.len() == pub_keys.len() (builder invariant)")
            .expect("Signed state guarantees our partial signature is filled")
    }
}

impl SignedSession {
    /// Combine all participants' partial signatures into a final BIP-340 aggregate signature.
    /// Returns [`MusigError::MissingPartialSignature`] if any participant has not contributed.
    pub fn partial_aggregate(self) -> Result<AggregatedSignature, MusigError> {
        let partial_sigs: Result<Vec<_>, MusigError> = self
            .partial_sigs
            .iter()
            .map(|s| s.as_ref().ok_or(MusigError::MissingPartialSignature))
            .collect();

        let session = self
            .session
            .expect("SessionInitialized state guarantees session is set");
        Ok(session.partial_sig_agg(&partial_sigs?))
    }
}

/// Zero-sized facade for entry points and byte-payload conversion helpers.
pub struct Musig;

impl Musig {
    /// Construct a new [`Setup`] builder for the given local key and participant set.
    pub fn setup(key: Keypair, pub_keys: Vec<PublicKey>) -> Result<Setup, MusigError> {
        Setup::new(key, pub_keys)
    }

    /// Build a `Keypair` from a 32-byte secret key.
    pub fn convert_keypair(sk: [u8; 32]) -> Result<Keypair, MusigError> {
        Ok(Keypair::from_secret_key(&SecretKey::from_secret_bytes(sk)?))
    }

    /// Parse a serialized (33- or 65-byte) compressed/uncompressed public key.
    pub fn convert_pub_key(pub_key: &[u8]) -> Result<PublicKey, MusigError> {
        Ok(PublicKey::from_slice(pub_key)?)
    }

    /// Parse a serialized 66-byte MuSig2 public nonce.
    pub fn convert_pub_nonce(pub_nonce: &[u8]) -> Result<PublicNonce, MusigError> {
        Ok(PublicNonce::from_byte_array(pub_nonce.try_into()?)?)
    }

    /// Parse a 32-byte big-endian scalar (e.g. a BIP-341 taproot tweak).
    pub fn convert_scalar_be(scalar: &[u8]) -> Result<Scalar, MusigError> {
        Ok(Scalar::from_be_bytes(scalar.try_into()?)?)
    }

    /// Parse a serialized 32-byte MuSig2 partial signature.
    pub fn convert_partial_signature(sig: &[u8]) -> Result<PartialSignature, MusigError> {
        Ok(PartialSignature::from_byte_array(sig.try_into()?)?)
    }

    /// Convenience accessor for the thread-local RNG used by `secp256k1`.
    pub fn rng() -> ThreadRng {
        rand::rng()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;
    use secp256k1::musig::new_nonce_pair;
    use secp256k1::rand::Rng;
    use static_assertions::assert_impl_all;

    // MusigBuilder is held across `.await` points in async signing flows;
    // any future field that isn't `Send + Sync` must fail the build here.
    assert_impl_all!(Setup: Send, Sync);
    assert_impl_all!(WithMessage: Send, Sync);
    assert_impl_all!(WithNonce: Send, Sync);
    assert_impl_all!(WithAggregatedNonces: Send, Sync);
    assert_impl_all!(WithSession: Send, Sync);
    assert_impl_all!(SignedSession: Send, Sync);
    assert_impl_all!(Musig: Send, Sync);
    assert_impl_all!(MusigError: Send, Sync);

    #[test]
    fn test_our_key_not_in_list() {
        let key = Keypair::new(&mut rand::rng());
        let pub_keys = vec![
            Keypair::new(&mut rand::rng()).public_key(),
            Keypair::new(&mut rand::rng()).public_key(),
        ];

        assert!(matches!(
            Musig::setup(key, pub_keys).err().unwrap(),
            MusigError::OurKeyNotInList
        ));
    }

    #[rstest]
    #[case::two(2, false)]
    #[case::two_tweak(2, true)]
    #[case::three(3, false)]
    #[case::three_tweak(3, true)]
    #[case::four(4, false)]
    #[case::four_tweak(4, true)]
    #[case::five(5, false)]
    #[case::five_tweak(5, true)]
    #[case::hundred(100, false)]
    #[case::thousand(1_000, false)]
    fn test_musig(#[case] size: usize, #[case] tweak: bool) {
        let key = Keypair::new(&mut rand::rng());

        let mut counterparties = Vec::new();
        for _ in 0..size - 1 {
            counterparties.push(Keypair::new(&mut rand::rng()));
        }

        let mut nonces = Vec::new();

        for counterparty in counterparties.iter() {
            let (secnonce, pubnonce) = new_nonce_pair(
                SessionSecretRand::from_rng(&mut rand::rng()),
                None,
                None,
                counterparty.public_key(),
                None,
                None,
            );
            nonces.push((secnonce, pubnonce));
        }

        let mut pub_keys = counterparties
            .iter()
            .map(|k| k.public_key())
            .collect::<Vec<_>>();
        pub_keys.push(key.public_key());

        let mut msg = [0u8; 32];
        rand::rng().fill(&mut msg);

        let mut musig = Musig::setup(key, pub_keys).unwrap();

        if tweak {
            musig = musig.xonly_tweak_add(&Scalar::random()).unwrap();
        }

        let musig = musig.message(msg).generate_nonce(&mut rand::rng());
        let musig = musig
            .aggregate_nonces(
                counterparties
                    .iter()
                    .enumerate()
                    .map(|(i, k)| (k.public_key(), nonces[i].1))
                    .collect(),
            )
            .unwrap();
        let musig = musig.initialize_session().unwrap();
        let mut musig = musig.partial_sign().unwrap();

        for counterparty in counterparties.iter() {
            let (secnonce, _) = nonces.remove(0);
            let sig = musig
                .session
                .unwrap()
                .partial_sign(secnonce, counterparty, &musig.aggcache);
            musig = musig.partial_add(counterparty.public_key(), sig).unwrap();
        }

        let agg_pk = musig.agg_pk();
        let sig = musig.partial_aggregate().unwrap();

        let sig = sig.verify(&agg_pk, &msg).unwrap();
        assert!(sig.verify(&msg, &agg_pk).is_ok());
    }
}
