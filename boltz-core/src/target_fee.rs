use crate::utils::Transaction;
use anyhow::Result;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum FeeTarget {
    Absolute(u64),
    Relative(f64),
}

impl From<u64> for FeeTarget {
    fn from(value: u64) -> Self {
        Self::Absolute(value)
    }
}

impl From<f64> for FeeTarget {
    fn from(value: f64) -> Self {
        Self::Relative(value)
    }
}

pub fn target_fee<T: Transaction, C: Fn(u64) -> Result<T>>(
    fee_target: FeeTarget,
    construct_tx: C,
) -> Result<T> {
    match fee_target {
        FeeTarget::Absolute(fee) => construct_tx(fee),
        FeeTarget::Relative(fee_rate) => {
            if !fee_rate.is_finite() || fee_rate < 0.0 {
                anyhow::bail!("invalid fee rate");
            }

            let tx = construct_tx(1)?;
            // Add an extra vbyte per input to account for potential variance
            construct_tx(((tx.vsize() + tx.input_len()) as f64 * fee_rate).ceil() as u64)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::anyhow;

    #[derive(Debug, Clone, PartialEq)]
    struct MockTransaction {
        fee: u64,
        vsize: usize,
        input_count: usize,
    }

    impl MockTransaction {
        fn new(fee: u64, vsize: usize, input_count: usize) -> Self {
            Self {
                fee,
                vsize,
                input_count,
            }
        }
    }

    impl Transaction for MockTransaction {
        fn input_len(&self) -> usize {
            self.input_count
        }

        fn vsize(&self) -> usize {
            self.vsize
        }
    }

    #[test]
    fn test_from() {
        let absolute = 21;
        assert_eq!(FeeTarget::from(absolute), FeeTarget::Absolute(absolute));

        let relative = 21.21;
        assert_eq!(FeeTarget::from(relative), FeeTarget::Relative(relative));
    }

    #[test]
    fn test_absolute_fee_target() {
        let target_fee_value = 1000u64;
        let mock_vsize = 250;
        let mock_input_count = 2;

        let result = target_fee(FeeTarget::Absolute(target_fee_value), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, target_fee_value);
        assert_eq!(tx.vsize(), mock_vsize);
        assert_eq!(tx.input_len(), mock_input_count);
    }

    #[test]
    fn test_relative_fee_target() {
        let fee_rate = 10.0;
        let mock_vsize = 250;
        let mock_input_count = 2;

        let expected_fee = ((mock_vsize + mock_input_count) as f64 * fee_rate).ceil() as u64;

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, expected_fee);
        assert_eq!(tx.vsize(), mock_vsize);
        assert_eq!(tx.input_len(), mock_input_count);
    }

    #[test]
    fn test_relative_fee_target_with_fractional_result() {
        let fee_rate = 1.5;
        let mock_vsize = 100;
        let mock_input_count = 1;

        let expected_fee = ((mock_vsize + mock_input_count) as f64 * fee_rate).ceil() as u64;
        assert_eq!(expected_fee, 152);

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, expected_fee);
    }

    #[test]
    fn test_relative_fee_target_sub_zero() {
        let fee_rate = 0.1;
        let mock_vsize = 123;
        let mock_input_count = 1;

        let expected_fee = ((mock_vsize + mock_input_count) as f64 * fee_rate).ceil() as u64;
        assert_eq!(expected_fee, 13);

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, expected_fee);
    }

    #[test]
    fn test_relative_fee_target_zero_fee_rate() {
        let fee_rate = 0.0;
        let mock_vsize = 250;
        let mock_input_count = 2;

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, 0);
    }

    #[test]
    fn test_constructor_error_propagation() {
        let result = target_fee::<MockTransaction, _>(FeeTarget::Absolute(1000), |_fee| {
            Err(anyhow!("Construction failed"))
        });

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "Construction failed");
    }

    #[test]
    fn test_edge_case_very_small_transaction() {
        let fee_rate = 1.0;
        let mock_vsize = 1;
        let mock_input_count = 1;

        let expected_fee = ((mock_vsize + mock_input_count) as f64 * fee_rate).ceil() as u64;
        assert_eq!(expected_fee, 2);

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, expected_fee);
    }

    #[test]
    fn test_edge_case_large_transaction() {
        let fee_rate = 50.0;
        let mock_vsize = 10000;
        let mock_input_count = 1000;

        let expected_fee = ((mock_vsize + mock_input_count) as f64 * fee_rate).ceil() as u64;
        assert_eq!(expected_fee, 550000);

        let result = target_fee(FeeTarget::Relative(fee_rate), |fee| {
            Ok(MockTransaction::new(fee, mock_vsize, mock_input_count))
        });

        assert!(result.is_ok());
        let tx = result.unwrap();
        assert_eq!(tx.fee, expected_fee);
    }

    #[test]
    fn test_invalid_fee_rate() {
        assert_eq!(
            target_fee(FeeTarget::Relative(f64::INFINITY), |_fee| {
                Ok(MockTransaction::new(0, 0, 0))
            })
            .err()
            .unwrap()
            .to_string(),
            "invalid fee rate"
        );
        assert_eq!(
            target_fee(FeeTarget::Relative(-2.1), |_fee| {
                Ok(MockTransaction::new(0, 0, 0))
            })
            .err()
            .unwrap()
            .to_string(),
            "invalid fee rate"
        );
    }
}
