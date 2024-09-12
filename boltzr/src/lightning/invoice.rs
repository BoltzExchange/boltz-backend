use bech32::FromBase32;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::str::FromStr;

const BECH32_BOLT12_INVOICE_HRP: &str = "lni";

#[derive(Debug, PartialEq)]
pub enum InvoiceError {
    InvalidInvariant,
    DecodeError(String),
}

impl Display for InvoiceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            InvoiceError::InvalidInvariant => write!(f, "invalid invariant"),
            InvoiceError::DecodeError(data) => write!(f, "could not parse invoice: {}", data),
        }
    }
}

impl Error for InvoiceError {}

#[derive(Debug, Clone, PartialEq)]
pub enum Invoice {
    Bolt11(Box<lightning_invoice::Bolt11Invoice>),
    Offer(Box<lightning::offers::offer::Offer>),
    Bolt12(Box<lightning::offers::invoice::Bolt12Invoice>),
}

pub fn decode(invoice_or_offer: &str) -> Result<Invoice, InvoiceError> {
    if let Ok(invoice) = decode_bolt11(invoice_or_offer) {
        return Ok(invoice);
    }

    if let Ok(invoice) = decode_bolt12_offer(invoice_or_offer) {
        return Ok(invoice);
    }

    if let Ok(invoice) = decode_bolt12_invoice(invoice_or_offer) {
        return Ok(invoice);
    }

    Err(InvoiceError::InvalidInvariant)
}

fn decode_bolt12_offer(offer: &str) -> anyhow::Result<Invoice> {
    match lightning::offers::offer::Offer::from_str(offer) {
        Ok(offer) => Ok(Invoice::Offer(Box::new(offer))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err)).into()),
    }
}

fn decode_bolt12_invoice(invoice: &str) -> anyhow::Result<Invoice> {
    let (hrp, data) = bech32::decode_without_checksum(invoice)?;
    if hrp != BECH32_BOLT12_INVOICE_HRP {
        return Err(InvoiceError::DecodeError("invalid HRP".to_string()).into());
    }

    let data = Vec::<u8>::from_base32(&data)?;
    match lightning::offers::invoice::Bolt12Invoice::try_from(data) {
        Ok(invoice) => Ok(Invoice::Bolt12(Box::new(invoice))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err)).into()),
    }
}

fn decode_bolt11(invoice: &str) -> anyhow::Result<Invoice> {
    match lightning_invoice::Bolt11Invoice::from_str(invoice) {
        Ok(invoice) => Ok(Invoice::Bolt11(Box::new(invoice))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err)).into()),
    }
}

#[cfg(test)]
mod test {
    use crate::lightning::invoice::{
        decode, decode_bolt11, decode_bolt12_invoice, decode_bolt12_offer, Invoice, InvoiceError,
    };
    use bech32::FromBase32;
    use std::str::FromStr;

    const BOLT12_OFFER: &str = "lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrc2q3skgumxzcssyeyreggqmet8r4k6krvd3knppsx6c8v5g7tj8hcuq8lleta9ve5n";
    const BOLT12_INVOICE: &str = "lni1qqgth299fq4pg07a2jnjjxg6apy37q3qqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy8s5prpwdjxv93pqfjg8jssphjkw8td4vxcmrdxzrqd4sweg3uhy003cq0lljh62enfx5pqqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy84yqucj6q9sggzymg62fj8dfjzz3uvmft8xeufw62x0a5znkc38f0jk04wqrkvwsy6pxqzvjpu5yqdu4n36mdtpkxcmfsscrdvrk2y09ermuwqrllu47jkv6fs9tuwsyhaydearc5eyax2lmlc8apwhp8n5yynlpr4lm058y9a8f50qypsd4f70enu0x03ecscycu5d350e42x02fmtkzskzc6a453h5adh3gqx25k2jgjzxh6rdxhlmhtvm3f89wpxms2hm3cff7mkx63y7s3vp7f5xzya6lw9sc9v5hlr69pcxcvx3emt23pcqqqqqqqqqqqqqqq5qqqqqqqqqqqqqwjfvkl43fqqqqqqzjqgehz6n86sg9hp98lphy7x4rrxejy48yzs5srcfmzdqeuwzglfym8r7fmtvce7x4q8xykszczzqnys09pqr09vuwkm2cd3kx6vyxqmtqaj3rewg7lrsqlll9054nxj0cyqg5ltjmfnrm8nerkvj0uz4wfn9annnm9r3fyx4w08hj463nmya8vmutf8fmufgzvfgkyea03tltjyn2qynt8ufenhxkh5nrl5usa2f8q";
    const BOLT11_INVOICE: &str = "lnbcrt1230p1pnwzkshsp584p434kjslfl030shwps75nvy4leq5k6psvdxn4kzsxjnptlmr3spp5nxqauehzqkx3xswjtrgx9lh5pqjxkyx0kszj0nc4m4jn7uk9gc5qdq8v9ekgesxqyjw5qcqp29qxpqysgqu6ft6p8c36khp082xng2xzmta25nlg803qjncal3fhzw8eshrsdyevhlgs970a09n95r3gtvqvvyk24vyv4506cu6cxl8ytaywrjkhcp468qnl";

    #[test]
    fn test_decode() {
        assert_eq!(
            decode(BOLT12_OFFER).unwrap(),
            decode_bolt12_offer(BOLT12_OFFER).unwrap()
        );
        assert_eq!(
            decode(BOLT12_INVOICE).unwrap(),
            decode_bolt12_invoice(BOLT12_INVOICE).unwrap()
        );
        assert_eq!(
            decode(BOLT11_INVOICE).unwrap(),
            decode_bolt11(BOLT11_INVOICE).unwrap()
        );

        assert_eq!(
            decode("invalid").err().unwrap(),
            InvoiceError::InvalidInvariant
        );
    }

    #[test]
    fn test_decode_bolt12_offer() {
        let res = decode_bolt12_offer(BOLT12_OFFER).unwrap();
        assert_eq!(
            res,
            Invoice::Offer(
                lightning::offers::offer::Offer::from_str(BOLT12_OFFER)
                    .unwrap()
                    .into()
            )
        );
    }

    #[test]
    fn test_decode_bolt12_offer_phoenix() {
        let offer = "lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqsespexwyy4tcadvgg89l9aljus6709kx235hhqrk6n8dey98uyuftzdqrsj8mjdjf2rex0ycj80tdh8lrtnchzs0t2w5rzs3jsrfqenc20jesyqlsxuqy57zq257vh8dcc0nvhpetfafdp7hgd98p8kgygnharaqgkqqr89tcmrw5d6cx887yyej24t3d0ey5qjkkquqann2h55p8lf6xctnp40h4nuslpgvvv7y0ke68dup3tpvcqtqr2gv5wnvr8grra89rgurlnng69vzxy8uyy86gs3cfhad2xmzgfzkqqy8j8e9fz6qc54cmylqnvf8rhzlg";

        let res = decode_bolt12_offer(offer).unwrap();
        assert_eq!(
            res,
            Invoice::Offer(
                lightning::offers::offer::Offer::from_str(offer)
                    .unwrap()
                    .into()
            )
        );
    }

    #[test]
    fn test_decode_bolt12_invoice() {
        let res = decode_bolt12_invoice(BOLT12_INVOICE).unwrap();

        let data =
            Vec::<u8>::from_base32(&bech32::decode_without_checksum(BOLT12_INVOICE).unwrap().1)
                .unwrap();
        assert_eq!(
            res,
            Invoice::Bolt12(
                lightning::offers::invoice::Bolt12Invoice::try_from(data)
                    .unwrap()
                    .into()
            )
        );
    }

    #[test]
    fn test_decode_bolt11_invoice() {
        let res = decode_bolt11(BOLT11_INVOICE).unwrap();
        assert_eq!(
            res,
            Invoice::Bolt11(
                lightning_invoice::Bolt11Invoice::from_str(BOLT11_INVOICE)
                    .unwrap()
                    .into()
            )
        );
    }
}
