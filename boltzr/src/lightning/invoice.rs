use crate::wallet;
use bech32::FromBase32;
use bitcoin::constants::ChainHash;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::str::FromStr;

type DecodeFunction = fn(&str) -> Result<Invoice, InvoiceError>;

const BECH32_BOLT12_INVOICE_HRP: &str = "lni";

const DECODE_FUNCS: &[DecodeFunction] =
    &[decode_bolt11, decode_bolt12_offer, decode_bolt12_invoice];

#[derive(Debug, PartialEq)]
pub enum InvoiceError {
    InvalidNetwork,
    DecodeError(String),
}

impl Display for InvoiceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            InvoiceError::InvalidNetwork => write!(f, "invalid network"),
            InvoiceError::DecodeError(data) => write!(f, "invalid invoice: {}", data),
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

impl Invoice {
    pub fn is_expired(&self) -> bool {
        match self {
            Invoice::Bolt11(invoice) => invoice.is_expired(),
            Invoice::Offer(offer) => offer.is_expired(),
            Invoice::Bolt12(invoice) => invoice.is_expired(),
        }
    }

    pub fn is_for_network(&self, network: wallet::Network) -> bool {
        let chain_hash = Self::network_to_chain_hash(network);

        match self {
            Invoice::Bolt11(invoice) => invoice.network().chain_hash() == chain_hash,
            Invoice::Offer(offer) => offer.supports_chain(chain_hash),
            Invoice::Bolt12(invoice) => invoice.chain() == chain_hash,
        }
    }

    fn network_to_chain_hash(network: wallet::Network) -> ChainHash {
        match network {
            wallet::Network::Mainnet => ChainHash::BITCOIN,
            wallet::Network::Testnet => ChainHash::TESTNET3,
            wallet::Network::Regtest => ChainHash::REGTEST,
        }
    }
}

pub fn decode(network: wallet::Network, invoice_or_offer: &str) -> Result<Invoice, InvoiceError> {
    let invoice = parse(invoice_or_offer)?;
    if !invoice.is_for_network(network) {
        return Err(InvoiceError::InvalidNetwork);
    }

    Ok(invoice)
}

fn parse(invoice_or_offer: &str) -> Result<Invoice, InvoiceError> {
    let mut first_error: Option<InvoiceError> = None;

    for func in DECODE_FUNCS {
        match func(invoice_or_offer) {
            Ok(res) => return Ok(res),
            Err(err) => {
                if first_error.is_none() {
                    first_error.replace(err);
                }
            }
        }
    }

    Err(first_error.unwrap_or(InvoiceError::DecodeError("could not decode".to_string())))
}

fn decode_bolt12_offer(offer: &str) -> Result<Invoice, InvoiceError> {
    match lightning::offers::offer::Offer::from_str(offer) {
        Ok(offer) => Ok(Invoice::Offer(Box::new(offer))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err))),
    }
}

fn decode_bolt12_invoice(invoice: &str) -> Result<Invoice, InvoiceError> {
    let (hrp, data) = match bech32::decode_without_checksum(invoice) {
        Ok(dec) => dec,
        Err(err) => return Err(InvoiceError::DecodeError(format!("{:?}", err))),
    };
    if hrp != BECH32_BOLT12_INVOICE_HRP {
        return Err(InvoiceError::DecodeError("invalid HRP".to_string()));
    }

    let data = match Vec::<u8>::from_base32(&data) {
        Ok(dec) => dec,
        Err(err) => return Err(InvoiceError::DecodeError(format!("{:?}", err))),
    };

    match lightning::offers::invoice::Bolt12Invoice::try_from(data) {
        Ok(invoice) => Ok(Invoice::Bolt12(Box::new(invoice))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err))),
    }
}

fn decode_bolt11(invoice: &str) -> Result<Invoice, InvoiceError> {
    match lightning_invoice::Bolt11Invoice::from_str(invoice) {
        Ok(invoice) => Ok(Invoice::Bolt11(Box::new(invoice))),
        Err(err) => Err(InvoiceError::DecodeError(format!("{:?}", err))),
    }
}

#[cfg(test)]
mod test {
    use crate::lightning::invoice::{
        decode, decode_bolt11, decode_bolt12_invoice, decode_bolt12_offer, Invoice, InvoiceError,
    };
    use crate::wallet;
    use bech32::FromBase32;
    use rstest::*;
    use std::str::FromStr;

    const BOLT12_OFFER: &str = "lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrc2q3skgumxzcssyeyreggqmet8r4k6krvd3knppsx6c8v5g7tj8hcuq8lleta9ve5n";
    const BOLT12_INVOICE: &str = "lni1qqgth299fq4pg07a2jnjjxg6apy37q3qqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy8s5prpwdjxv93pqfjg8jssphjkw8td4vxcmrdxzrqd4sweg3uhy003cq0lljh62enfx5pqqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy84yqucj6q9sggzymg62fj8dfjzz3uvmft8xeufw62x0a5znkc38f0jk04wqrkvwsy6pxqzvjpu5yqdu4n36mdtpkxcmfsscrdvrk2y09ermuwqrllu47jkv6fs9tuwsyhaydearc5eyax2lmlc8apwhp8n5yynlpr4lm058y9a8f50qypsd4f70enu0x03ecscycu5d350e42x02fmtkzskzc6a453h5adh3gqx25k2jgjzxh6rdxhlmhtvm3f89wpxms2hm3cff7mkx63y7s3vp7f5xzya6lw9sc9v5hlr69pcxcvx3emt23pcqqqqqqqqqqqqqqq5qqqqqqqqqqqqqwjfvkl43fqqqqqqzjqgehz6n86sg9hp98lphy7x4rrxejy48yzs5srcfmzdqeuwzglfym8r7fmtvce7x4q8xykszczzqnys09pqr09vuwkm2cd3kx6vyxqmtqaj3rewg7lrsqlll9054nxj0cyqg5ltjmfnrm8nerkvj0uz4wfn9annnm9r3fyx4w08hj463nmya8vmutf8fmufgzvfgkyea03tltjyn2qynt8ufenhxkh5nrl5usa2f8q";
    const BOLT11_INVOICE: &str = "lnbcrt1230p1pnwzkshsp584p434kjslfl030shwps75nvy4leq5k6psvdxn4kzsxjnptlmr3spp5nxqauehzqkx3xswjtrgx9lh5pqjxkyx0kszj0nc4m4jn7uk9gc5qdq8v9ekgesxqyjw5qcqp29qxpqysgqu6ft6p8c36khp082xng2xzmta25nlg803qjncal3fhzw8eshrsdyevhlgs970a09n95r3gtvqvvyk24vyv4506cu6cxl8ytaywrjkhcp468qnl";

    #[test]
    fn test_decode() {
        assert_eq!(
            decode(wallet::Network::Regtest, BOLT12_OFFER).unwrap(),
            decode_bolt12_offer(BOLT12_OFFER).unwrap()
        );
        assert_eq!(
            decode(wallet::Network::Regtest, BOLT12_INVOICE).unwrap(),
            decode_bolt12_invoice(BOLT12_INVOICE).unwrap()
        );
        assert_eq!(
            decode(wallet::Network::Regtest, BOLT11_INVOICE).unwrap(),
            decode_bolt11(BOLT11_INVOICE).unwrap()
        );

        assert_eq!(
            decode(wallet::Network::Regtest, "invalid").err().unwrap(),
            InvoiceError::DecodeError("ParseError(Bech32Error(MissingSeparator))".to_string())
        );
    }

    #[test]
    fn test_decode_amp_invoice() {
        let invoice = "lnbc10n1pnhs4wjpp5w09tfff6a4l4dqvy40rr284l3uxccadgnzkep4fh2v4cs9yracmsdqqcqzzsxq9z0rgqsp52vckh4k525a2vlkdy77w7c5940t9lfj34ythh8s9ckmdx3q2zfpq9q8pqqqsgqv07zpwlccsq23ry8ptzqjy5vwcatgg0y6490y5udkzcpgjhmr449hqpdxapjnsu3vucnav040sqg5a9rg5cxp5y4e50mhh8keluhf2spwyry73";
        assert_eq!(
            decode(wallet::Network::Mainnet, invoice).unwrap_err(),
            InvoiceError::DecodeError("SemanticError(InvalidFeatures)".to_string())
        );
    }

    #[test]
    fn test_decode_invalid_network() {
        assert_eq!(
            decode(wallet::Network::Regtest, "lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqsespexwyy4tcadvgg89l9aljus6709kx235hhqrk6n8dey98uyuftzdqrvfp0pxcmv8l8txqssq8cm7hrd8ja0ucz0cexwg22l305307pxp3qyq7heen7fpurds7kqhm0h8pk5hghv84wz53rh3yfgmahp7ddlyv4gyqrx55lhnfh5ld0pf8gatyf9x4m50mg3zex4hkq4ehysrs7ptnh4j4mwc5qqrt9rlu78elnkly3qw4g0my8mtcz08jhsdk0a7vz2mx52hu6qxw7q86nhggm335n8ef39e5vrm9gd4xqqy8tm2ptwy2xw8scz3jl9djen0t6").err().unwrap(),
            InvoiceError::InvalidNetwork,
        );
        assert_eq!(
            decode(wallet::Network::Regtest, "lni1qqgzm8segjwvfcwp2a22ah30heyn6q3qgdyhl4lcy62hzz855v8annkr46a8n9eqsn5satgpagesjqqqqqqppnqrjvugf2h366csswt7tml9ep4u7tvv4rf0wq8d4xwmjg20cfcjky6qxcjz7zd3kc07wkvppqq03hawx6096lesyl3jvus54lzlfzluzvrzqgpa0nn8ujrcxmpavp0klwwrdfw3wc02u9fz80zgj3hmwru6m7ge2sgqxdffl0xn0f767zjw36kgj2dthglk3z9jdt0vptnwfq8puzh80t9tka3gqqxk28leu0nl8d7fzqa2slkg0khsy7090qmvlmucy4kdg40e5qvauq048ws3hrrfx0jnztngc8k2sm2vqqgwhk5zkug5vu0ps9r972m9nx7h55pqgdyhl4lcy62hzz855v8annkr46a8n9eqsn5satgpagesjqqqqqq9yqc0gfq9sggrhyqf72htl64lc7kr5g8zwuq4elrkr96zvtllvathlnxfvl86vjs6plgpngpexwyy4tcadvgg89l9aljus6709kx235hhqrk6n8dey98uyuftzdqz79jnp0yxdj3kqcajj9w0ept5m002j3lqkjszg2hc3qakcaafc6wsyqhfll8m4yx5l3nemd2taaslyuzvnjkqaw895yzllt0wpv5wg5z3msqy24sutfy7nvkg6rwqsxwgj60e3sa9vqa9lw8ffgnu8wwfdd2rxatgynm5xgy2zrs9l8wezyu3raenejlu453ln8xztjydnk8c7x0s4dgweq0gvmkq8hqgnt2w0jljkzq7x5nhcdju9zlg2xqgh3n8uz4t04syrm27dhlyqrxd3qeyetuvfkjhklsn64r2tc4ze3eswywvnr43g39mk0ayy9ldz6zwndlmgws0e5wfmfr2mzm0cqa4xwlyz7eqmfekykzka3fz3n5y9tyj5x33xalqn7hpl5k4y0u8fm64sfrdfzxtst4e9yxcrrexg5cfxmadc2jc2q36dqvl5896zj2le55ffyhva6jgm57wqh6nwua0fzhapjvy2r9zdn35qcfsj33tnl393ajzhp6q7mx3ck2wd3k5jkg82gru4v6ls9l9wkhtf5r24lj9pnk3c99zk7a5xncc870pcr6zm2uszk4d5avp97et68uvlv4ev73pcqqqq05qqqqqvsqjqqqqqqqqqqqraqqqqqqqqq0gfqqqqzjqgeexfx72vqcp2xq2sgzv7n8srl73msjm7zcp8sn6xx9fcgq7w3jk0fgehqct0s7cdm4u0j4qxr6zgzhqxqsqqzczzqneu4urdnl0nqjke4z4lxspnhsp75a6zxuvdye72vfwdrq7e2rdfncypw3kr7xnqf8xynne80kkz2sczhzm8gwq49r8e92h4jfpkzlwxcfaessde00f5k5c4z69pjqm0nq6rh70ru8kc4gm9tfrhj4zr7t7egms").err().unwrap(),
            InvoiceError::InvalidNetwork,
        );
        assert_eq!(
            decode(wallet::Network::Regtest, "lntb1101010n1pnjvjnzsp5ad9y769h0y6vge68cegs8ft62mh858228accp0zq0pqgjzw7756spp5snujw7nydyxu44sf6c79n0tzmd2g79nkfl5uwc53zrf9satrcplqdp6tddjyar90p6z7urvv95kug3vyfwzysn0d3685gr5v4ehgmn9w3wzygjat5xqyjw5qcqp2rzjqgjmhs48xsve8n2e94ascxzmhrrrt8xpm5fn096ud4qn2nj8qwlkgtzq7vqqppcqqqqqqqw0qqqqrncqqc9qxpqysgqfc9a554d2mg6ljxyg8axfwunejtfhglrw9m67e90pec6520jjukxpjnx8m8484fenusg2697w42ec4ypk7wk86z62rms5uym6l5vh0gq7t50m6").err().unwrap(),
            InvoiceError::InvalidNetwork,
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

    #[rstest]
    #[case(BOLT11_INVOICE, true)]
    #[case(BOLT12_INVOICE, true)]
    #[case(BOLT12_OFFER, false)]
    fn test_invoice_is_expired(#[case] invoice: &str, #[case] expected: bool) {
        let res = decode(wallet::Network::Regtest, invoice).unwrap();
        assert_eq!(res.is_expired(), expected);
    }
}
