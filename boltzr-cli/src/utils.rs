use anyhow::Result;
use inquire::Password;
use std::path::PathBuf;

pub fn resolve_home(path: PathBuf) -> Result<PathBuf> {
    Ok(match path.starts_with("~") {
        true => {
            let home = dirs::home_dir()
                .ok_or_else(|| anyhow::anyhow!("could not determine home directory"))?;
            home.join(
                path.strip_prefix("~")
                    .map_err(|e| anyhow::anyhow!("failed to strip prefix: {}", e))?,
            )
        }
        false => path,
    })
}

pub fn prompt_secret(prompt: &str) -> Result<String> {
    Ok(Password::new(prompt).without_confirmation().prompt()?)
}
