use crate::api::ws::OfferSubscriptions;
use crate::db::models::Offer;
use crate::lightning::invoice::Invoice;
use crate::types;
use crate::wallet;
use crate::webhook::invoice_caller::{InvoiceCaller, InvoiceHook};
use anyhow::{Result, anyhow};
use lightning::offers::invoice::Bolt12Invoice;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::debug;

const INVOICE_FETCH_TIMEOUT_WEBSOCKET_SECONDS: u64 = 8;
const INVOICE_FETCH_TIMEOUT_WEBHOOK_SECONDS: u64 = 30;

#[derive(Debug, Deserialize)]
pub struct InvoiceRequestResponse {
    pub invoice: String,
}

#[derive(Debug, Deserialize)]
pub struct InvoiceRequestError {
    pub error: String,
}

#[derive(Clone)]
pub struct InvoiceFetcher {
    network: wallet::Network,
    offer_subscriptions: OfferSubscriptions,
    invoice_caller: Arc<InvoiceCaller>,
}

impl InvoiceFetcher {
    pub fn new(
        network: wallet::Network,
        offer_subscriptions: OfferSubscriptions,
        invoice_caller: Arc<InvoiceCaller>,
    ) -> Self {
        Self {
            network,
            offer_subscriptions,
            invoice_caller,
        }
    }

    pub async fn fetch_invoice(
        &self,
        offer: Offer,
        hook: InvoiceHook<types::False>,
    ) -> Result<(String, Box<Bolt12Invoice>)> {
        let receiver = self.offer_subscriptions.subscribe_invoice_responses();
        if self
            .offer_subscriptions
            .request_invoice(hook.clone())
            .await?
        {
            debug!("Sending BOLT12 invoice Websocket request");
            match Self::wait_for_response(
                hook.id(),
                // Use the longer timeout when there is no Webhook to fallback to
                if offer.url.is_some() {
                    INVOICE_FETCH_TIMEOUT_WEBSOCKET_SECONDS
                } else {
                    INVOICE_FETCH_TIMEOUT_WEBHOOK_SECONDS
                },
                receiver,
                |res| match res {
                    Ok(invoice) => {
                        let decoded = Self::decode_bolt12_invoice(self.network, &invoice)?;
                        Ok((invoice, decoded))
                    }
                    Err(err) => Err(anyhow!("{err}")),
                },
            )
            .await
            {
                (Ok(invoice), false) => Ok(invoice),
                (Err(err), false) => Err(err),
                // When the Websocket times out, try the Webhook
                (_, true) => {
                    debug!("BOLT12 invoice Websocket request timed out, trying Webhook");
                    self.fetch_invoice_webhook(offer, hook).await
                }
            }
        } else {
            self.fetch_invoice_webhook(offer, hook).await
        }
    }

    async fn fetch_invoice_webhook(
        &self,
        offer: Offer,
        hook: InvoiceHook<types::False>,
    ) -> Result<(String, Box<Bolt12Invoice>)> {
        if let Some(url) = offer.url {
            let receiver = self.invoice_caller.subscribe_successful_calls();

            let hook_id = hook.id();
            self.invoice_caller.call(hook.with_url(url)).await?;

            Self::wait_for_response(
                hook_id,
                INVOICE_FETCH_TIMEOUT_WEBHOOK_SECONDS,
                receiver,
                |data| match serde_json::from_slice::<InvoiceRequestResponse>(&data) {
                    Ok(invoice) => {
                        let decoded = Self::decode_bolt12_invoice(self.network, &invoice.invoice)?;
                        Ok((invoice.invoice, decoded))
                    }
                    Err(_) => Err(anyhow!(
                        "{}",
                        serde_json::from_slice::<InvoiceRequestError>(&data)?.error
                    )),
                },
            )
            .await
            .0
        } else {
            Err(anyhow!("no way to reach client"))
        }
    }

    fn decode_bolt12_invoice(
        network: wallet::Network,
        invoice: &str,
    ) -> Result<Box<Bolt12Invoice>> {
        Ok(match crate::lightning::invoice::decode(network, invoice)? {
            Invoice::Bolt12(invoice) => invoice,
            _ => return Err(anyhow!("invalid invoice")),
        })
    }

    async fn wait_for_response<T, R>(
        id: u64,
        timeout_seconds: u64,
        mut receiver: broadcast::Receiver<(InvoiceHook<T>, R)>,
        parse_response: impl Fn(R) -> Result<(String, Box<Bolt12Invoice>)>,
    ) -> (Result<(String, Box<Bolt12Invoice>)>, bool)
    where
        T: types::Bool + Clone,
        R: Clone,
    {
        let timeout = tokio::time::sleep(std::time::Duration::from_secs(timeout_seconds));
        tokio::pin!(timeout);

        loop {
            tokio::select! {
                response = receiver.recv() => {
                    match response {
                        Ok((hook, res)) => {
                            if hook.id() == id {
                                return (parse_response(res), false);
                            }
                        },
                        Err(err) => {
                            return (Err(anyhow!("failed to receive invoice response: {}", err)), false);
                        }
                    }
                },
                _ = &mut timeout => {
                    return (Err(anyhow!("timeout waiting for invoice response")), true);
                }
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    const BOLT12_INVOICE: &str = "lni1qqgw62tz5qvztlk28vs8n5j24pnkwyxvqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glc7qhc9e3ucxvazzkekc9pa7pkgzt280kj635srjn4g8q5vd74kyx4dqpqyy7vv662f44fr7acsfyq34xa9jx92asmpdllhvz2nltvr2mgylwjqqe7d9uahz5pv7r6ca4s8rvn84e8wyg2x4ge7rt8hkg7sn3dtc8upv7v9trl0h87dg2qjdkm04en5f4fpuxa2q6km7khgsy86knr0x8450l6qhs8dgkgyjy0603vp2m7zm2lm7e4t5qpqn5zsfdwdl6gfquphyjjz3n099zjqffqs4qqtqss9u93lmr9dp4x8s0vjshkzrunr2yr74xlkjhkhpv0yxhvc7saq0y45r7srxsrse80qf0aara4slvcjxrvu6j2rp5ftmjy4yntlsmsutpkvkt6878sxf3y5zetsud7mcnv5eunwe87z7dpxusnarx79nfr4av7rcqcpvl3qgpw2llam5panp6hkeckp9kc9jx2mc0u3pncy6cpt9mku3spqczwkrcqghj4jmp469fztr0e8kq5v67524e8shylwkevkn837kp3ew50np59tjecemyq0pz4cyvvrqxy69v7p3ll8dyuyyyunef4dwva7rje3cm0xgn6m8gyq2rfzl6j4uc2kyeauqkft4cl7td9ttd4vutf5znuh7ux4fpxy3zeqqxvgx60wvet9cfa5nxueqcj2u7ldnrg9y92lsun0q3e5fh406htn8tcfymfhz8a422frf75zy8gksmn8rdwfflpdehsjkxd8xrhs6dcxancup974zq9w20v08pw28p4fcaah895wwlayq6qccy22msev0t84wr4ujgywj8mrttw300vwnzcvs0y2ps2686f052rqx94e3lr9hglhdj65z9un2jwaz79s39xx50dzjex72kgqzv8t6s8lulcsvljwqn49dpqwlrc6apqgczudwj7p52eh2c048gyux8906wd7hhlwetphz796mrvuq0f0gg7sckeavdzrsqqqqlgqqqqqeqpyqqqqqqqqqqq86qqqqqqqqqq5sgqqq9yq35rwvp95cpsz5vq4qs979ggzmuf9kqdz4dxnzwnspwg54qfe0zfwmwrw88jw98nnxw08q92qffq3tsrqgqqpvppqdtdltt5gzratf3hnr668laqtcrk5tyzfz8a8ckq4dlpd40alv64muzqau7dext2per990g3fyhleghgechx6znahah9t6mgyccwe96esxalzug2lc6jhvmgpuquh7hwusthncl9rd7c2aevj98gmnstcczzkmq";

    #[test]
    fn test_decode_bolt12_invoice() {
        assert!(
            InvoiceFetcher::decode_bolt12_invoice(wallet::Network::Mainnet, BOLT12_INVOICE).is_ok()
        );
    }

    #[test]
    fn test_decode_bolt12_invoice_invalid() {
        assert!(
            InvoiceFetcher::decode_bolt12_invoice(wallet::Network::Mainnet, "invalid")
                .err()
                .unwrap()
                .to_string()
                .contains("invalid invoice")
        );
    }

    #[tokio::test]
    async fn test_wait_for_response_success() {
        let (tx, rx) = broadcast::channel::<(InvoiceHook<types::False>, String)>(1);
        let hook = InvoiceHook::new("".to_string(), &[0], None);

        tx.send((hook.clone(), BOLT12_INVOICE.to_string())).unwrap();

        let (res, timeout) = InvoiceFetcher::wait_for_response(hook.id(), 1, rx, |_: String| {
            Ok((
                BOLT12_INVOICE.to_string(),
                InvoiceFetcher::decode_bolt12_invoice(wallet::Network::Mainnet, BOLT12_INVOICE)
                    .unwrap(),
            ))
        })
        .await;

        assert!(!timeout);
        assert!(res.is_ok());
        assert_eq!(
            res.unwrap(),
            (
                BOLT12_INVOICE.to_string(),
                InvoiceFetcher::decode_bolt12_invoice(wallet::Network::Mainnet, BOLT12_INVOICE)
                    .unwrap()
            )
        );
    }

    #[tokio::test]
    async fn test_wait_for_response_error() {
        let (tx, rx) = broadcast::channel::<(InvoiceHook<types::False>, String)>(1);
        let hook = InvoiceHook::new("".to_string(), &[0], None);

        tx.send((hook.clone(), "".to_string())).unwrap();

        let msg = "error";
        let (res, timeout) =
            InvoiceFetcher::wait_for_response(hook.id(), 1, rx, |_: String| Err(anyhow!(msg)))
                .await;

        assert!(!timeout);
        assert!(res.is_err());
        assert_eq!(res.err().unwrap().to_string(), msg);
    }

    #[tokio::test]
    async fn test_wait_for_response_timeout() {
        let (tx, rx) = broadcast::channel::<(InvoiceHook<types::False>, String)>(1);
        let hook = InvoiceHook::new("".to_string(), &[0], None);

        let (res, timeout) =
            InvoiceFetcher::wait_for_response(hook.id(), 1, rx, |_: String| unreachable!()).await;

        drop(tx);

        assert!(timeout);
        assert!(res.is_err());
    }
}
