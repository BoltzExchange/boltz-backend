use std::fmt;

use serde::de::Visitor;
use serde::{de, Deserialize, Deserializer, Serialize, Serializer};

#[derive(Clone, Debug, PartialEq)]
pub enum WebHookEvent {
    SwapUpdate,
}

impl Serialize for WebHookEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            WebHookEvent::SwapUpdate => serializer.serialize_str("swap.update"),
        }
    }
}

impl<'de> Deserialize<'de> for WebHookEvent {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct StringVisitor;

        impl Visitor<'_> for StringVisitor {
            type Value = WebHookEvent;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string representing a WebHookEvent")
            }

            fn visit_str<E>(self, value: &str) -> Result<WebHookEvent, E>
            where
                E: de::Error,
            {
                match value {
                    "swap.update" => Ok(WebHookEvent::SwapUpdate),
                    _ => Err(de::Error::unknown_variant(value, &["swap.update"])),
                }
            }
        }

        deserializer.deserialize_str(StringVisitor)
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct WebHookCallData {
    pub id: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct WebHookCallParams {
    pub event: WebHookEvent,
    pub data: WebHookCallData,
}

#[cfg(test)]
mod web_hook_event_test {
    use crate::webhook::types::WebHookEvent;

    #[test]
    fn test_web_hook_event_serialize() {
        assert_eq!(
            serde_json::to_string(&WebHookEvent::SwapUpdate).unwrap(),
            "\"swap.update\""
        );
    }

    #[test]
    fn test_web_hook_event_deserialize() {
        assert_eq!(
            serde_json::from_str::<WebHookEvent>("\"swap.update\"").unwrap(),
            WebHookEvent::SwapUpdate
        );
    }

    #[test]
    fn test_web_hook_event_deserialize_invalid_invariant() {
        assert_eq!(
            serde_json::from_str::<WebHookEvent>("\"not.found\"")
                .err()
                .unwrap()
                .to_string(),
            "unknown variant `not.found`, expected `swap.update` at line 1 column 11"
        );
    }

    #[test]
    fn test_web_hook_event_deserialize_invalid_type() {
        assert_eq!(
            serde_json::from_str::<WebHookEvent>("{}")
                .err()
                .unwrap()
                .to_string(),
            "invalid type: map, expected a string representing a WebHookEvent at line 1 column 0"
        );
    }
}
