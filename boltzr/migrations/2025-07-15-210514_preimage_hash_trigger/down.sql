DROP TRIGGER IF EXISTS trigger_check_preimage_on_chain_swaps ON "chainSwaps";

DROP TRIGGER IF EXISTS trigger_check_preimage_on_reverse_swaps ON "reverseSwaps";

DROP TRIGGER IF EXISTS trigger_check_preimage_on_swaps ON swaps;

DROP FUNCTION IF EXISTS check_reverse_chain_swap_preimage_uniqueness ();

DROP FUNCTION IF EXISTS check_submarine_swap_preimage_uniqueness ();

DROP TABLE IF EXISTS "chainSwaps";

DROP TABLE IF EXISTS "reverseSwaps";

DROP TABLE IF EXISTS swaps;
