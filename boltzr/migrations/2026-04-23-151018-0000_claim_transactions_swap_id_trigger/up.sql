-- Enforce that swap_id references an existing reverse or chain swap
CREATE OR REPLACE FUNCTION claim_transactions_check_swap_exists () RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "reverseSwaps" WHERE id = NEW.swap_id
        UNION ALL
        SELECT 1 FROM "chainSwaps" WHERE id = NEW.swap_id
    ) THEN
        RAISE EXCEPTION 'swap_id % not found in "reverseSwaps" or "chainSwaps"', NEW.swap_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF to_regclass('claim_transactions') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS trigger_claim_transactions_check_swap_exists ON claim_transactions;

        CREATE TRIGGER trigger_claim_transactions_check_swap_exists BEFORE INSERT
        OR
        UPDATE OF swap_id ON claim_transactions FOR EACH ROW
        EXECUTE FUNCTION claim_transactions_check_swap_exists ();
    END IF;
END;
$$;
