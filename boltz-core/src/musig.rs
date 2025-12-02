use anyhow::{Result, anyhow};
use secp256k1::musig::{
    AggregatedNonce, AggregatedSignature, KeyAggCache, PartialSignature, SecretNonce, Session,
    SessionSecretRand,
};
use secp256k1::rand::rngs::ThreadRng;
use secp256k1::{Keypair, PublicKey, Scalar, SecretKey, rand};
use std::marker::PhantomData;

pub use secp256k1::XOnlyPublicKey;
pub use secp256k1::musig::PublicNonce;

pub struct NoMessage;
pub struct MissingNonce;
pub struct NonceGenerated;
pub struct NoncesAggregated;
pub struct SessionInitialized;

pub struct Unsigned;
pub struct Signed;

pub struct MusigBuilder<S, T> {
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

impl<S, T> MusigBuilder<S, T> {
    pub fn agg_pk(&self) -> XOnlyPublicKey {
        self.aggcache.agg_pk()
    }

    pub fn num_participants(&self) -> usize {
        self.pub_keys.len()
    }

    fn our_index(&self) -> Result<usize> {
        self.key_index(self.key.public_key())
    }

    fn key_index(&self, public_key: PublicKey) -> Result<usize> {
        self.pub_keys
            .iter()
            .position(|k| k == &public_key)
            .ok_or_else(|| anyhow!("key not found in public keys"))
    }
}

impl MusigBuilder<NoMessage, Unsigned> {
    pub fn new(key: Keypair, pub_keys: Vec<PublicKey>) -> Result<Self> {
        let our_pubkey = key.public_key();
        if !pub_keys.contains(&our_pubkey) {
            anyhow::bail!("our public key is not in the list of public keys");
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

    pub fn xonly_tweak_add(mut self, tweak: &Scalar) -> Result<Self> {
        self.aggcache.pubkey_xonly_tweak_add(tweak)?;
        Ok(self)
    }

    pub fn message(self, msg: [u8; 32]) -> MusigBuilder<MissingNonce, Unsigned> {
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

impl MusigBuilder<MissingNonce, Unsigned> {
    pub fn generate_nonce<R: rand::Rng + ?Sized>(
        self,
        rng: &mut R,
    ) -> MusigBuilder<NonceGenerated, Unsigned> {
        let session_secrand = SessionSecretRand::from_rng(rng);
        let (secret, public) = self.aggcache.nonce_gen(
            session_secrand,
            self.key.public_key(),
            &self.msg.unwrap(),
            None,
        );

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

    /// Reusing the same nonce will lead to leaking the private key
    pub fn dangerous_set_nonce(
        self,
        sec_nonce: &[u8],
        pub_nonce: &[u8],
    ) -> Result<MusigBuilder<NonceGenerated, Unsigned>> {
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

impl MusigBuilder<NonceGenerated, Unsigned> {
    pub fn pub_nonce(&self) -> &PublicNonce {
        self.nonce.as_ref().map(|(_, pubnonce)| pubnonce).unwrap()
    }

    /// Reusing the same nonce will lead to leaking the private key
    pub fn dangerous_secnonce(self) -> SecretNonce {
        self.nonce.unwrap().0
    }

    pub fn aggregate_nonces(
        self,
        mut nonces: Vec<(PublicKey, PublicNonce)>,
    ) -> Result<MusigBuilder<NoncesAggregated, Unsigned>> {
        if !nonces.iter().any(|(pk, _)| pk == &self.key.public_key()) {
            if let Some((_, our_nonce)) = &self.nonce {
                nonces.push((self.key.public_key(), *our_nonce));
            } else {
                anyhow::bail!("our nonce is not generated yet")
            }
        }

        if nonces.len() != self.num_participants() {
            anyhow::bail!("incorrect number of nonces")
        }

        let mut ordered = Vec::with_capacity(self.num_participants());

        for key in &self.pub_keys {
            if let Some((_, nonce)) = nonces.iter().find(|(pk, _)| pk == key) {
                ordered.push(*nonce);
            } else {
                anyhow::bail!("nonce not found for key: {}", hex::encode(key.serialize()))
            }
        }

        self.aggregate_nonces_ordered(ordered)
    }

    pub fn aggregate_nonces_ordered(
        self,
        nonces: Vec<PublicNonce>,
    ) -> Result<MusigBuilder<NoncesAggregated, Unsigned>> {
        if nonces.len() != self.num_participants() {
            anyhow::bail!("incorrect number of nonces")
        }

        if let Some((_, our_nonce)) = &self.nonce {
            if nonces[self.our_index()?] != *our_nonce {
                anyhow::bail!("our nonce is at incorrect index")
            }
        } else {
            anyhow::bail!("our nonce is not generated yet")
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

impl MusigBuilder<NoncesAggregated, Unsigned> {
    pub fn initialize_session(self) -> Result<MusigBuilder<SessionInitialized, Unsigned>> {
        let session = Session::new(&self.aggcache, self.aggnonce.unwrap(), &self.msg.unwrap());

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

impl<T> MusigBuilder<SessionInitialized, T> {
    pub fn partial_verify(&self, public_key: PublicKey, sig: PartialSignature) -> Result<bool> {
        let index = self.key_index(public_key)?;
        let nonce = self.pub_nonces.as_ref().unwrap()[index];
        Ok(self
            .session
            .unwrap()
            .partial_verify(&self.aggcache, &sig, &nonce, public_key))
    }

    pub fn partial_add(
        mut self,
        public_key: PublicKey,
        sig: PartialSignature,
    ) -> Result<MusigBuilder<SessionInitialized, T>> {
        if !self.partial_verify(public_key, sig)? {
            anyhow::bail!("partial signature is not valid")
        }

        let index = self.key_index(public_key)?;
        self.partial_sigs[index] = Some(sig);

        Ok(self)
    }
}

impl MusigBuilder<SessionInitialized, Unsigned> {
    pub fn partial_sign(mut self) -> Result<MusigBuilder<SessionInitialized, Signed>> {
        let partial_sig = self.session.unwrap().partial_sign(
            self.nonce.take().unwrap().0,
            &self.key,
            &self.aggcache,
        );
        let our_index = self.our_index()?;
        self.partial_sigs[our_index] = Some(partial_sig);

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

impl<T> MusigBuilder<T, Signed> {
    pub fn our_partial_signature(&self) -> PartialSignature {
        self.partial_sigs[self.our_index().unwrap()].unwrap()
    }
}

impl MusigBuilder<SessionInitialized, Signed> {
    pub fn partial_aggregate(self) -> Result<AggregatedSignature> {
        let partial_sigs: Result<Vec<_>> = self
            .partial_sigs
            .iter()
            .map(|s| {
                s.as_ref()
                    .ok_or_else(|| anyhow!("partial signature is missing"))
            })
            .collect();

        match partial_sigs {
            Ok(partial_sigs) => Ok(self.session.unwrap().partial_sig_agg(&partial_sigs)),
            Err(e) => Err(e),
        }
    }
}

pub struct Musig;

impl Musig {
    pub fn setup(
        key: Keypair,
        pub_keys: Vec<PublicKey>,
    ) -> Result<MusigBuilder<NoMessage, Unsigned>> {
        MusigBuilder::new(key, pub_keys)
    }

    pub fn convert_keypair(sk: [u8; 32]) -> Result<Keypair> {
        Ok(Keypair::from_secret_key(&SecretKey::from_secret_bytes(sk)?))
    }

    pub fn convert_pub_key(pub_key: &[u8]) -> Result<PublicKey> {
        Ok(PublicKey::from_slice(pub_key)?)
    }

    pub fn convert_pub_nonce(pub_nonce: &[u8]) -> Result<PublicNonce> {
        Ok(PublicNonce::from_byte_array(pub_nonce.try_into()?)?)
    }

    pub fn convert_scalar_be(scalar: &[u8]) -> Result<Scalar> {
        Ok(Scalar::from_be_bytes(scalar.try_into()?)?)
    }

    pub fn convert_partial_signature(sig: &[u8]) -> Result<PartialSignature> {
        Ok(PartialSignature::from_byte_array(sig.try_into()?)?)
    }

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

    #[test]
    fn test_our_key_not_in_list() {
        let key = Keypair::new(&mut rand::rng());
        let pub_keys = vec![
            Keypair::new(&mut rand::rng()).public_key(),
            Keypair::new(&mut rand::rng()).public_key(),
        ];

        assert_eq!(
            Musig::setup(key, pub_keys).err().unwrap().to_string(),
            "our public key is not in the list of public keys"
        );
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
