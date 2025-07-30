#[cfg(test)]
mod tests {
    use crate::db::helpers::preimage_hash_triggers::tests::{
        generate_random_preimage_hash, insert_swap,
    };
    use crate::db::helpers::web_hook::test::get_pool;
    use diesel::RunQueryDsl;
    use diesel::result::Error as DieselError;
    use diesel::sql_query;

    fn update_swap_invoice<Conn>(
        conn: &mut Conn,
        preimage_hash: &str,
        invoice: &str,
    ) -> Result<usize, DieselError>
    where
        Conn: diesel::Connection<Backend = diesel::pg::Pg>,
    {
        let sql = format!(
            r#"UPDATE swaps SET invoice = '{invoice}' WHERE id = 'test_swap_{preimage_hash}'"#
        );
        sql_query(&sql).execute(conn)
    }

    fn update_swap_status<Conn>(
        conn: &mut Conn,
        preimage_hash: &str,
        status: &str,
    ) -> Result<usize, DieselError>
    where
        Conn: diesel::Connection<Backend = diesel::pg::Pg>,
    {
        let sql = format!(
            r#"UPDATE swaps SET status = '{status}' WHERE id = 'test_swap_{preimage_hash}'"#
        );
        sql_query(&sql).execute(conn)
    }

    fn assert_invoice_already_set_error(result: Result<usize, DieselError>) {
        assert!(
            result.is_err(),
            "Expected error due to invoice already set, but operation succeeded"
        );

        let error = result.unwrap_err();
        if let DieselError::DatabaseError(_, info) = error {
            let error_msg = info.message();
            assert!(
                error_msg.contains("INVOICE_ALREADY_SET"),
                "Error should contain INVOICE_ALREADY_SET, got: {error_msg}"
            );
        } else {
            panic!("Expected DatabaseError, but got: {error:?}");
        }
    }

    #[test]
    fn test_setting_invoice_first_time_succeeds() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let preimage_hash = generate_random_preimage_hash();

        insert_swap(&mut conn, &preimage_hash).expect("Should insert swap successfully");

        let result = update_swap_invoice(&mut conn, &preimage_hash, "lnbc1000n1test_invoice");
        assert!(result.is_ok(), "Setting invoice first time should succeed");
    }

    #[test]
    fn test_updating_same_invoice_succeeds() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let preimage_hash = generate_random_preimage_hash();
        let invoice = "lnbc1000n1test_invoice";

        insert_swap(&mut conn, &preimage_hash).expect("Should insert swap successfully");

        update_swap_invoice(&mut conn, &preimage_hash, invoice)
            .expect("Should set invoice first time");

        let result = update_swap_invoice(&mut conn, &preimage_hash, invoice);
        assert!(result.is_ok(), "Updating with same invoice should succeed");
    }

    #[test]
    fn test_updating_other_fields_with_existing_invoice_succeeds() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let preimage_hash = generate_random_preimage_hash();

        insert_swap(&mut conn, &preimage_hash).expect("Should insert swap successfully");

        update_swap_invoice(&mut conn, &preimage_hash, "lnbc1000n1test_invoice")
            .expect("Should set invoice first time");

        let result = update_swap_status(&mut conn, &preimage_hash, "transaction.mempool");
        assert!(
            result.is_ok(),
            "Updating other fields should succeed when invoice exists"
        );
    }

    #[test]
    fn test_changing_existing_invoice_fails() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let preimage_hash = generate_random_preimage_hash();

        insert_swap(&mut conn, &preimage_hash).expect("Should insert swap successfully");

        update_swap_invoice(&mut conn, &preimage_hash, "lnbc1000n1first_invoice")
            .expect("Should set invoice first time");

        let result = update_swap_invoice(&mut conn, &preimage_hash, "lnbc1000n1different_invoice");
        assert_invoice_already_set_error(result);
    }

    #[test]
    fn test_multiple_swaps_can_have_different_invoices() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();

        let preimage_hash_1 = generate_random_preimage_hash();
        let preimage_hash_2 = generate_random_preimage_hash();

        insert_swap(&mut conn, &preimage_hash_1).expect("Should insert first swap successfully");
        insert_swap(&mut conn, &preimage_hash_2).expect("Should insert second swap successfully");

        update_swap_invoice(&mut conn, &preimage_hash_1, "lnbc1000n1first_invoice")
            .expect("Should set first invoice");

        let result = update_swap_invoice(&mut conn, &preimage_hash_2, "lnbc1000n1second_invoice");
        assert!(
            result.is_ok(),
            "Different swaps should be able to have different invoices"
        );
    }
}
