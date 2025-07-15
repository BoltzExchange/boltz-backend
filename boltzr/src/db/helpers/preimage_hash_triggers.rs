#[cfg(test)]
mod tests {
    use crate::db::helpers::web_hook::test::get_pool;
    use alloy::hex;
    use diesel::RunQueryDsl;
    use diesel::result::Error as DieselError;
    use diesel::sql_query;
    use rand::RngCore;

    fn generate_random_preimage_hash() -> String {
        let mut entropy_bytes = [0u8; 32];
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut entropy_bytes);
        hex::encode(entropy_bytes)
    }

    fn insert_swap<Conn>(conn: &mut Conn, preimage_hash: &str) -> Result<usize, DieselError>
    where
        Conn: diesel::Connection<Backend = diesel::pg::Pg>,
    {
        let sql = format!(
            r#"INSERT INTO swaps (
                id, "preimageHash"
            ) VALUES (
                'test_swap_{preimage_hash}', '{preimage_hash}'
            )"#
        );
        sql_query(&sql).execute(conn)
    }

    fn insert_reverse_swap<Conn>(conn: &mut Conn, preimage_hash: &str) -> Result<usize, DieselError>
    where
        Conn: diesel::Connection<Backend = diesel::pg::Pg>,
    {
        let sql = format!(
            r#"INSERT INTO "reverseSwaps" (
                id, "preimageHash"
            ) VALUES (
                'test_reverse_{preimage_hash}', '{preimage_hash}'
            )"#
        );
        sql_query(&sql).execute(conn)
    }

    fn insert_chain_swap<Conn>(conn: &mut Conn, preimage_hash: &str) -> Result<usize, DieselError>
    where
        Conn: diesel::Connection<Backend = diesel::pg::Pg>,
    {
        let sql = format!(
            r#"INSERT INTO "chainSwaps" (
                id, "preimageHash"
            ) VALUES (
                'test_chain_{preimage_hash}', '{preimage_hash}'
            )"#
        );
        sql_query(&sql).execute(conn)
    }

    fn assert_duplicate_preimage_error(result: Result<usize, DieselError>) {
        assert!(
            result.is_err(),
            "Expected error due to duplicate preimageHash, but operation succeeded"
        );

        let error = result.unwrap_err();
        if let DieselError::DatabaseError(_, info) = error {
            let error_msg = info.message();
            assert!(
                error_msg.contains("SWAP_WITH_PREIMAGE_EXISTS"),
                "Error should contain SWAP_WITH_PREIMAGE_EXISTS, got: {error_msg}"
            );
        } else {
            panic!("Expected DatabaseError, but got: {error:?}");
        }
    }

    #[test]
    fn test_submarine_swap_prevents_duplicates_in_other_tables() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let test_preimage_hash = generate_random_preimage_hash();

        insert_swap(&mut conn, &test_preimage_hash).expect("Should insert first swap successfully");

        let result = insert_reverse_swap(&mut conn, &test_preimage_hash);
        assert_duplicate_preimage_error(result);

        let result = insert_chain_swap(&mut conn, &test_preimage_hash);
        assert_duplicate_preimage_error(result);
    }

    #[test]
    fn test_reverse_then_swap_succeeds() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let preimage_hash = generate_random_preimage_hash();

        insert_reverse_swap(&mut conn, &preimage_hash).expect("Should insert reverse swap first");

        insert_swap(&mut conn, &preimage_hash)
            .expect("Should succeed - submarine swaps don't check against reverse swaps");
    }

    #[test]
    fn test_chain_swap_prevents_submarine_swap_duplicate() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let test_preimage_hash = generate_random_preimage_hash();

        insert_chain_swap(&mut conn, &test_preimage_hash)
            .expect("Should insert chain swap successfully");

        let result = insert_swap(&mut conn, &test_preimage_hash);
        assert_duplicate_preimage_error(result);
    }

    #[test]
    fn test_chain_swap_prevents_reverse_swap_duplicate() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let test_preimage_hash = generate_random_preimage_hash();

        insert_chain_swap(&mut conn, &test_preimage_hash)
            .expect("Should insert chain swap successfully");

        let result = insert_reverse_swap(&mut conn, &test_preimage_hash);
        assert_duplicate_preimage_error(result);
    }

    #[test]
    fn test_reverse_swap_prevents_chain_swap_duplicate() {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();
        let test_preimage_hash = generate_random_preimage_hash();

        insert_reverse_swap(&mut conn, &test_preimage_hash)
            .expect("Should insert reverse swap successfully");

        let result = insert_chain_swap(&mut conn, &test_preimage_hash);
        assert_duplicate_preimage_error(result);
    }
}
