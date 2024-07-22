pub mod built_info {
    include!(concat!(env!("OUT_DIR"), "/built.rs"));
}

pub fn get_version() -> String {
    format!(
        "{}-{}{}",
        built_info::PKG_VERSION,
        built_info::GIT_COMMIT_HASH
            .unwrap_or("")
            .to_string()
            .chars()
            .take(8)
            .collect::<String>(),
        if built_info::GIT_DIRTY.unwrap_or(false) {
            "-dirty"
        } else {
            ""
        }
    )
}

#[cfg(test)]
mod utils_test {
    use crate::utils::get_version;

    #[test]
    fn test_get_version() {
        let version = get_version();
        let split: Vec<&str> = version.split('-').collect();
        // For compatibility with the backend
        assert_eq!(split[1].to_string().len(), 8);
    }
}
