use bitcoin::bip32::Xpub;
use serde::de::Visitor;
use serde::{Deserialize, Deserializer};
use std::fmt;
use std::str::FromStr;

pub struct XpubDeserialize(pub Xpub);

impl<'de> Deserialize<'de> for XpubDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct XpubDeserializeVisitor;

        impl Visitor<'_> for XpubDeserializeVisitor {
            type Value = XpubDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid xpub")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match Xpub::from_str(value) {
                    Ok(xpub) => Ok(XpubDeserialize(xpub)),
                    Err(err) => Err(E::custom(format!("invalid xpub: {err}"))),
                }
            }
        }

        deserializer.deserialize_string(XpubDeserializeVisitor)
    }
}
