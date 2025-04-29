use serde::{Deserialize, Serialize, Serializer, ser::SerializeSeq};

#[derive(PartialEq, Debug, Clone)]
pub enum Type {
    Bitcoin,
    Elements,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum RpcParam {
    Str(String),
    Int(i64),
    Float(f64),
    Seq(Vec<String>),
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
            RpcParam::Seq(ref seq) => {
                let mut seq_ser = serializer.serialize_seq(Some(seq.len()))?;
                for item in seq {
                    seq_ser.serialize_element(item)?;
                }
                seq_ser.end()
            }
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
pub struct AddressInfo {
    #[serde(rename = "ismine")]
    pub is_mine: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TestMempoolAccept {
    pub allowed: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListUnspent {
    pub txid: bitcoin::Txid,
    pub vout: u32,
    pub redeem_script: Option<bitcoin::ScriptBuf>,
    pub witness_script: Option<bitcoin::ScriptBuf>,
    pub script_pub_key: bitcoin::ScriptBuf,
    #[serde(with = "bitcoin::amount::serde::as_btc")]
    pub amount: bitcoin::Amount,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProcessPsbt {
    pub psbt: String,
}

pub type RawMempool = Vec<String>;
