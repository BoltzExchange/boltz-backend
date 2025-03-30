#[allow(dead_code)]
#[derive(PartialEq, Clone, Debug)]
pub enum OrderSide {
    Buy = 0,
    Sell = 1,
}

#[derive(PartialEq, Clone, Debug)]
pub struct Pair {
    pub base: String,
    pub quote: String,
}

pub fn split_pair(pair: &str) -> anyhow::Result<Pair> {
    let parts: Vec<&str> = pair.split('/').collect();
    if parts.len() != 2 {
        return Err(anyhow::anyhow!("invalid pair: {}", pair));
    }

    Ok(Pair {
        base: parts[0].to_string(),
        quote: parts[1].to_string(),
    })
}

pub fn concat_pair(base: &str, quote: &str) -> String {
    format!("{}/{}", base, quote)
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::*;

    #[rstest]
    #[case("BTC/BTC", Pair { base: "BTC".to_string(), quote: "BTC".to_string()})]
    #[case("L-BTC/BTC", Pair { base: "L-BTC".to_string(), quote: "BTC".to_string()})]
    #[case("L-BTC/RBTC", Pair { base: "L-BTC".to_string(), quote: "RBTC".to_string()})]
    fn test_split_pair(#[case] pair: &str, #[case] expected: Pair) {
        assert_eq!(split_pair(pair).unwrap(), expected);
    }

    #[rstest]
    #[case("BTC")]
    #[case("BTC/L-BTC/BTC")]
    fn test_split_pair_invalid(#[case] pair: &str) {
        assert_eq!(
            split_pair(pair).unwrap_err().to_string(),
            format!("invalid pair: {}", pair)
        );
    }

    #[rstest]
    #[case("BTC", "BTC", "BTC/BTC")]
    #[case("L-BTC", "BTC", "L-BTC/BTC")]
    #[case("L-BTC", "RBTC", "L-BTC/RBTC")]
    fn test_concat_pair(#[case] base: &str, #[case] quote: &str, #[case] expected: &str) {
        assert_eq!(concat_pair(base, quote), expected);
    }
}
