use payjoin::receive::v2::*;


pub async fn receive_payjoin(address: bitcoin::Address, amount: u64) -> Result<(), anyhow::Error> {
    let directory = "https://payjo.in";

    let ohttp_keys = payjoin::io::fetch_ohttp_keys("https://pj.bobspacebkk.com","https://payjo.in").await?;

    let receiver = NewReceiver::new(
        address,
        directory,
        ohttp_keys,
        None,
    );

    Ok(())
}
