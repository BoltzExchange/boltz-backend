mod drop_guard;

pub use drop_guard::{DropGuard, defer};

pub const fn mb_to_bytes(mb: usize) -> usize {
    mb * 1024 * 1024
}

#[cfg(test)]
mod tests {
    use super::mb_to_bytes;

    #[test]
    fn test_mb_to_bytes() {
        assert_eq!(mb_to_bytes(0), 0);
        assert_eq!(mb_to_bytes(1), 1_048_576);
        assert_eq!(mb_to_bytes(2), 2_097_152);
        assert_eq!(mb_to_bytes(10), 10_485_760);
        assert_eq!(mb_to_bytes(100), 104_857_600);
        assert_eq!(mb_to_bytes(1024), 1_073_741_824);
    }
}
