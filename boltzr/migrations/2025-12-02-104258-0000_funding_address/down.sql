-- This file should undo anything in `up.sql`
DROP TRIGGER IF EXISTS update_script_pubkeys_modified_time ON script_pubkeys;
ALTER TABLE script_pubkeys ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE script_pubkeys ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE script_pubkeys ALTER COLUMN swap_id SET NOT NULL;
ALTER TABLE script_pubkeys DROP COLUMN IF EXISTS funding_address_id;
ALTER TABLE script_pubkeys DROP CONSTRAINT IF EXISTS script_pubkeys_exclusive_id;

DROP TABLE IF EXISTS funding_addresses;
