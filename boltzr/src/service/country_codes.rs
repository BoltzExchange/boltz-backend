use anyhow::Result;
use dashmap::DashMap;
use futures::future::try_join_all;
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use tracing::{debug, info, instrument, trace};

fn ipv4_ranges_default() -> String {
    "https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv4.csv".to_string()
}

fn ipv6_ranges_default() -> String {
    "https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv6.csv".to_string()
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct MarkingsConfig {
    pub countries: Option<Vec<String>>,

    #[serde(rename = "ipV4Ranges", default = "ipv4_ranges_default")]
    pub ip_v4_ranges: String,
    #[serde(rename = "ipV6Ranges", default = "ipv6_ranges_default")]
    pub ip_v6_ranges: String,
}

#[derive(Deserialize, Debug)]
struct CsvRow {
    start: IpAddr,
    end: IpAddr,
    country: String,
}

#[derive(Debug, Clone)]
struct Range {
    start: IpAddr,
    end: IpAddr,
}

#[derive(Debug, Clone)]
pub struct CountryCodes {
    config: Option<MarkingsConfig>,
    countries: DashMap<String, Vec<Range>>,
}

impl CountryCodes {
    pub fn new(config: Option<MarkingsConfig>) -> Self {
        Self {
            config,
            countries: DashMap::new(),
        }
    }

    #[instrument(name = "CountryCodes::update", skip_all)]
    pub async fn update(&self) -> Result<()> {
        let config = match &self.config {
            Some(config) => config,
            None => return Ok(()),
        };

        let countries = match &config.countries {
            Some(countries) if !countries.is_empty() => countries,
            _ => {
                trace!("Not fetching country codes because no countries were specified");
                return Ok(());
            }
        };
        debug!("Marking swaps from countries: {}", countries.join(", "));

        let csvs = try_join_all(
            [&config.ip_v4_ranges, &config.ip_v6_ranges].map(|url| Self::get_ranges(url)),
        )
        .await?;
        info!("Fetched country codes for IP ranges");

        for csv in csvs {
            let mut reader = csv::ReaderBuilder::new()
                .delimiter(b',')
                .has_headers(false)
                .from_reader(&*csv);

            for row in reader.deserialize() {
                let row: CsvRow = row?;
                if !countries.contains(&row.country) {
                    continue;
                }

                let mut ranges = self.countries.entry(row.country).or_default();
                ranges.push(Range {
                    start: row.start,
                    end: row.end,
                });
            }
        }
        Ok(())
    }

    pub fn is_relevant(&self, address: &IpAddr) -> bool {
        for entry in self.countries.iter() {
            if entry
                .value()
                .iter()
                .any(|range| address >= &range.start && address <= &range.end)
            {
                return true;
            }
        }

        false
    }

    async fn get_ranges(url_or_path: &str) -> Result<Vec<u8>> {
        if url_or_path.starts_with("http://") || url_or_path.starts_with("https://") {
            Ok(reqwest::Client::new()
                .get(url_or_path)
                .send()
                .await?
                .bytes()
                .await?
                .to_vec())
        } else {
            Ok(tokio::fs::read(url_or_path).await?)
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::*;
    use tokio::sync::OnceCell;

    async fn setup() -> &'static CountryCodes {
        static ONCE: OnceCell<CountryCodes> = OnceCell::const_new();
        ONCE.get_or_init(|| async {
            let codes = CountryCodes::new(Some(MarkingsConfig {
                countries: Some(vec!["AT".to_string(), "SV".to_string()]),
                ip_v4_ranges:
                    "https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv4.csv"
                        .to_string(),
                ip_v6_ranges:
                    "https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv6.csv"
                        .to_string(),
            }));
            codes.update().await.unwrap();

            codes
        })
        .await
    }

    #[rstest]
    #[case("45.5.12.0", true)]
    #[case("45.5.12.1", true)]
    #[case("45.5.12.254", true)]
    #[case("45.5.12.255", true)]
    #[case("213.142.96.21", true)]
    #[case("217.76.96.0", false)]
    #[case("2801:1e:e000::", true)]
    #[case("2801:1e:e000:ffff:ffff:ffff:ffff:fffe", true)]
    #[case("2801:1e:e000:ffff:ffff:ffff:ffff:ffff", true)]
    #[case("2a10:5e00:ffff:ffff:ffff:ffff:ffff:ffff", true)]
    #[case("2a14:30c7:ffff:ffff:ffff:ffff:feff:ffff", false)]
    #[tokio::test]
    async fn test_is_relevant(#[case] ip: IpAddr, #[case] relevant: bool) {
        let codes = setup().await;
        assert_eq!(codes.is_relevant(&ip), relevant);
    }
}
