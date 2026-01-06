pub const fn mb_to_bytes(mb: usize) -> usize {
    mb * 1024 * 1024
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case(0, 0)]
    #[case(1, 1_048_576)]
    #[case(2, 2_097_152)]
    #[case(10, 10_485_760)]
    #[case(100, 104_857_600)]
    #[case(1024, 1_073_741_824)]
    fn test_mb_to_bytes(#[case] mb: usize, #[case] expected_bytes: usize) {
        assert_eq!(mb_to_bytes(mb), expected_bytes);
    }
}
