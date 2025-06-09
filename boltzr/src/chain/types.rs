use serde::{Deserialize, Serialize, Serializer};
use std::fmt::Display;

#[derive(PartialEq, Debug, Clone)]
pub enum Type {
    Bitcoin,
    Elements,
}

impl Display for Type {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum RpcParam {
    Str(String),
    Int(i64),
    Float(f64),
}

impl Serialize for RpcParam {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            RpcParam::Str(ref s) => serializer.serialize_str(s),
            RpcParam::Int(num) => serializer.serialize_i64(num),
            RpcParam::Float(num) => serializer.serialize_f64(num),
        }
    }
}

#[derive(Serialize)]
pub struct RpcRequest {
    pub method: String,
    pub params: Option<Vec<RpcParam>>,
}

#[derive(Deserialize)]
pub struct RpcError {
    pub message: String,
}

#[derive(Deserialize)]
pub struct RpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<RpcError>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NetworkInfo {
    pub subversion: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ZmqNotification {
    #[serde(rename = "type")]
    pub notification_type: String,
    pub address: String,
}

pub type RawMempool = Vec<String>;
