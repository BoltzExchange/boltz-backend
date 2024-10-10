use serde::{Deserialize, Serialize, Serializer};

#[derive(Debug, Clone)]
pub enum Type {
    Bitcoin,
    Elements,
}

#[derive(Debug, Clone)]
pub enum RpcParam {
    Str(String),
}

impl Serialize for RpcParam {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            RpcParam::Str(ref s) => serializer.serialize_str(s),
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

pub type RawMempool = Vec<String>;
