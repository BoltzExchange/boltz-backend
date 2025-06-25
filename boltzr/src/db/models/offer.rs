use crate::utils::serde::hex;
use diesel::{AsChangeset, Insertable, Queryable, Selectable};
use serde::Serialize;

#[derive(
    Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Default, Debug, Serialize,
)]
#[diesel(table_name = crate::db::schema::offers)]
pub struct Offer {
    #[serde(serialize_with = "hex::serialize")]
    pub signer: Vec<u8>,
    pub offer: String,
    pub url: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_offer_serialization_hex_signer() {
        let offer = Offer {
            signer: vec![0x01, 0x02, 0x0A, 0xFF],
            offer: "dummy offer".to_string(),
            url: Some("http://example.com".to_string()),
        };
        let json = serde_json::to_string(&offer).expect("serialization should work");
        assert!(json.contains("\"signer\":\"01020aff\""));
    }
}
