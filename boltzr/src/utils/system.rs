use std::num::NonZeroUsize;

pub fn available_parallelism() -> usize {
    // Returns an error on unsupported platforms, but we don't support those
    // platforms anyway, so we fall back to 1 instead of crashing
    std::thread::available_parallelism().map_or(1, NonZeroUsize::get)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_available_parallelism() {
        let parallelism = available_parallelism();

        assert!(parallelism >= 1);
        assert!(parallelism <= 1024);
    }
}
