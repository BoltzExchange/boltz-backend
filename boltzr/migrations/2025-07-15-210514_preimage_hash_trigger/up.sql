-- Minimum viable tables for preimage hash uniqueness check. Currently, the real swap tables are created and managed by typescript code
CREATE TABLE IF NOT EXISTS swaps (
  id VARCHAR(255) PRIMARY KEY,
  "preimageHash" VARCHAR(64) NOT NULL,
  invoice TEXT,
  status VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "reverseSwaps" (
  id VARCHAR(255) PRIMARY KEY,
  "preimageHash" VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS "chainSwaps" (
  id VARCHAR(255) PRIMARY KEY,
  "preimageHash" VARCHAR(64) NOT NULL
);

-- Preimage hash uniqueness trigger functions and triggers
CREATE OR REPLACE FUNCTION check_submarine_swap_preimage_uniqueness () RETURNS TRIGGER AS $$
DECLARE
    _preimage_hash TEXT := NEW."preimageHash";
BEGIN
    IF
        EXISTS(SELECT 1 FROM swaps WHERE "preimageHash" = _preimage_hash) OR
        EXISTS(SELECT 1 FROM "chainSwaps" WHERE "preimageHash" = _preimage_hash)
    THEN
        RAISE EXCEPTION 'SWAP_WITH_PREIMAGE_EXISTS';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_reverse_chain_swap_preimage_uniqueness () RETURNS TRIGGER AS $$
DECLARE
    _preimage_hash TEXT := NEW."preimageHash";
BEGIN
    IF
        EXISTS(SELECT 1 FROM swaps WHERE "preimageHash" = _preimage_hash) OR
        EXISTS(SELECT 1 FROM "reverseSwaps" WHERE "preimageHash" = _preimage_hash) OR
        EXISTS(SELECT 1 FROM "chainSwaps" WHERE "preimageHash" = _preimage_hash)
    THEN
        RAISE EXCEPTION 'SWAP_WITH_PREIMAGE_EXISTS';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_preimage_on_swaps BEFORE INSERT ON swaps FOR EACH ROW
EXECUTE FUNCTION check_submarine_swap_preimage_uniqueness ();

CREATE TRIGGER trigger_check_preimage_on_reverse_swaps BEFORE INSERT ON "reverseSwaps" FOR EACH ROW
EXECUTE FUNCTION check_reverse_chain_swap_preimage_uniqueness ();

CREATE TRIGGER trigger_check_preimage_on_chain_swaps BEFORE INSERT ON "chainSwaps" FOR EACH ROW
EXECUTE FUNCTION check_reverse_chain_swap_preimage_uniqueness ();
