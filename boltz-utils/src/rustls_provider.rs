use std::sync::Once;

pub fn ensure_rustls_crypto_provider() {
    static INSTALL_PROVIDER: Once = Once::new();

    INSTALL_PROVIDER.call_once(|| {
        if rustls::crypto::CryptoProvider::get_default().is_none() {
            let _ = rustls::crypto::aws_lc_rs::default_provider().install_default();
        }
    });
}
