use anyhow::{Result, anyhow};
use secp256k1::musig::{
    AggregatedNonce, AggregatedSignature, KeyAggCache, PartialSignature, PublicNonce, SecretNonce,
    Session, SessionSecretRand,
};
use secp256k1::{
    Keypair, PublicKey, Scalar, Secp256k1, Signing, Verification, XOnlyPublicKey, rand,
};

pub struct Musig {
    key: Keypair,
    nonce: Option<(SecretNonce, PublicNonce)>,

    msg: [u8; 32],

    pub_keys: Vec<PublicKey>,
    pub_nonces: Option<Vec<PublicNonce>>,
    aggcache: KeyAggCache,
    aggnonce: Option<AggregatedNonce>,
    session: Option<Session>,
    partial_sigs: Vec<Option<PartialSignature>>,
}

impl Musig {
    pub fn new<C: Verification + Signing>(
        secp: &Secp256k1<C>,
        key: Keypair,
        pub_keys: Vec<PublicKey>,
        msg: [u8; 32],
    ) -> Result<Self> {
        let pub_key_refs: Vec<&PublicKey> = pub_keys.iter().collect();
        let aggcache = KeyAggCache::new(secp, &pub_key_refs);

        let res = Self {
            key,
            nonce: None,
            msg,
            pub_nonces: None,
            aggcache,
            aggnonce: None,
            session: None,
            partial_sigs: vec![None; pub_keys.len()],
            pub_keys,
        };
        // Make sure our key in the list of public keys
        res.our_index()?;

        Ok(res)
    }

    pub fn num_participants(&self) -> usize {
        self.pub_keys.len()
    }

    pub fn agg_pk(&self) -> XOnlyPublicKey {
        self.aggcache.agg_pk()
    }

    pub fn xonly_tweak_add<C: Verification>(
        &mut self,
        secp: &Secp256k1<C>,
        tweak: &Scalar,
    ) -> Result<()> {
        self.aggcache.pubkey_xonly_tweak_add(secp, tweak)?;
        Ok(())
    }

    pub fn generate_nonce<C: Signing, R: rand::Rng + ?Sized>(
        &mut self,
        secp: &Secp256k1<C>,
        rng: &mut R,
    ) -> PublicNonce {
        let session_secrand = SessionSecretRand::from_rng(rng);
        let (secret, public) = self.aggcache.nonce_gen(
            secp,
            session_secrand,
            self.key.public_key(),
            &self.msg,
            None,
        );
        self.nonce = Some((secret, public));

        public
    }

    pub fn aggregate_nonces<C: Signing>(
        &mut self,
        secp: &Secp256k1<C>,
        mut nonces: Vec<(PublicKey, PublicNonce)>,
    ) -> Result<()> {
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

        let mut ordered = Vec::new();

        for key in &self.pub_keys {
            if let Some((_, nonce)) = nonces.iter().find(|(pk, _)| pk == key) {
                ordered.push(*nonce);
            } else {
                anyhow::bail!("nonce not found for key: {}", hex::encode(key.serialize()))
            }
        }

        self.aggregate_nonces_ordered(secp, ordered)?;

        Ok(())
    }

    pub fn aggregate_nonces_ordered<C: Signing>(
        &mut self,
        secp: &Secp256k1<C>,
        nonces: Vec<PublicNonce>,
    ) -> Result<()> {
        if let Some((_, our_nonce)) = &self.nonce {
            if nonces[self.our_index()?] != *our_nonce {
                anyhow::bail!("our nonce is at incorrect index")
            }
        } else {
            anyhow::bail!("our nonce is not generated yet")
        }

        let nonce_refs: Vec<&PublicNonce> = nonces.iter().collect();
        self.aggnonce = Some(AggregatedNonce::new(secp, &nonce_refs));

        self.pub_nonces = Some(nonces);

        Ok(())
    }

    pub fn initialize_session<C: Signing>(&mut self, secp: &Secp256k1<C>) -> Result<()> {
        if let Some(aggnonce) = &self.aggnonce {
            self.session = Some(Session::new(secp, &self.aggcache, *aggnonce, &self.msg));
        } else {
            anyhow::bail!("aggnonce is not generated yet")
        }

        Ok(())
    }

    pub fn partial_sign<C: Signing>(&mut self, secp: &Secp256k1<C>) -> Result<()> {
        if let Some((secnonce, _)) = self.nonce.take() {
            if let Some(session) = &self.session {
                let partial_sig = session.partial_sign(secp, secnonce, &self.key, &self.aggcache);
                let our_index = self.our_index()?;
                self.partial_sigs[our_index] = Some(partial_sig);
            } else {
                anyhow::bail!("session is not initialized")
            }
        } else {
            anyhow::bail!("our nonce is not generated yet")
        }

        Ok(())
    }

    pub fn partial_verify<C: Signing>(
        &self,
        secp: &Secp256k1<C>,
        public_key: PublicKey,
        sig: PartialSignature,
    ) -> Result<bool> {
        let index = self.key_index(public_key)?;

        if let Some(pub_nonces) = &self.pub_nonces {
            let nonce = pub_nonces[index];

            if let Some(session) = &self.session {
                Ok(session.partial_verify(secp, &self.aggcache, &sig, &nonce, public_key))
            } else {
                anyhow::bail!("session is not initialized")
            }
        } else {
            anyhow::bail!("public nonces are not generated yet")
        }
    }

    pub fn partial_add<C: Signing>(
        &mut self,
        secp: &Secp256k1<C>,
        public_key: PublicKey,
        sig: PartialSignature,
    ) -> Result<()> {
        if !self.partial_verify(secp, public_key, sig)? {
            anyhow::bail!("partial signature is not valid")
        }

        let index = self.key_index(public_key)?;
        self.partial_sigs[index] = Some(sig);
        Ok(())
    }

    pub fn partial_aggregate(&mut self) -> Result<AggregatedSignature> {
        if let Some(session) = &self.session {
            let partial_sigs: Result<Vec<_>> = self
                .partial_sigs
                .iter()
                .map(|s| {
                    s.as_ref()
                        .ok_or_else(|| anyhow!("partial signature is missing"))
                })
                .collect();

            match partial_sigs {
                Ok(partial_sigs) => Ok(session.partial_sig_agg(&partial_sigs)),
                Err(e) => Err(e),
            }
        } else {
            anyhow::bail!("session is not initialized")
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;
    use secp256k1::musig::new_nonce_pair;
    use secp256k1::rand::Rng;

    #[test]
    fn test_our_key_not_in_list() {
        let secp = Secp256k1::new();
        let key = Keypair::new(&secp, &mut rand::rng());
        let pub_keys = vec![
            Keypair::new(&secp, &mut rand::rng()).public_key(),
            Keypair::new(&secp, &mut rand::rng()).public_key(),
        ];
        let msg = [0u8; 32];

        assert_eq!(
            Musig::new(&secp, key, pub_keys, msg)
                .err()
                .unwrap()
                .to_string(),
            "key not found in public keys"
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
        let secp = Secp256k1::new();
        let key = Keypair::new(&secp, &mut rand::rng());

        let mut counterparties = Vec::new();
        for _ in 0..size - 1 {
            counterparties.push(Keypair::new(&secp, &mut rand::rng()));
        }

        let mut nonces = Vec::new();

        for counterparty in counterparties.iter() {
            let (secnonce, pubnonce) = new_nonce_pair(
                &secp,
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

        let mut musig = Musig::new(&secp, key, pub_keys, msg).unwrap();

        if tweak {
            musig.xonly_tweak_add(&secp, &Scalar::random()).unwrap();
        }

        musig.generate_nonce(&secp, &mut rand::rng());
        musig
            .aggregate_nonces(
                &secp,
                counterparties
                    .iter()
                    .enumerate()
                    .map(|(i, k)| (k.public_key(), nonces[i].1))
                    .collect(),
            )
            .unwrap();
        musig.initialize_session(&secp).unwrap();
        musig.partial_sign(&secp).unwrap();

        for counterparty in counterparties.iter() {
            let (secnonce, _) = nonces.remove(0);
            let sig =
                musig
                    .session
                    .unwrap()
                    .partial_sign(&secp, secnonce, counterparty, &musig.aggcache);
            musig
                .partial_add(&secp, counterparty.public_key(), sig)
                .unwrap();
        }

        let sig = musig.partial_aggregate().unwrap();
        let agg_pk = musig.agg_pk();

        let sig = sig.verify(&secp, &agg_pk, &msg).unwrap();
        assert!(secp.verify_schnorr(&sig, &msg, &agg_pk).is_ok());
    }
}
