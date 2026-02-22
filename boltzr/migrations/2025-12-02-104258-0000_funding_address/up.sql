CREATE TABLE IF NOT EXISTS funding_addresses (
  id VARCHAR(255) PRIMARY KEY,
  symbol TEXT NOT NULL,
  status TEXT NOT NULL,
  key_index INTEGER NOT NULL,
  their_public_key BYTEA NOT NULL,
  tree TEXT NOT NULL,
  timeout_block_height INTEGER NOT NULL,
  lockup_transaction_id VARCHAR(255),
  lockup_transaction_vout INTEGER,
  lockup_amount BIGINT,
  swap_id VARCHAR(255) UNIQUE,
  presigned_tx BYTEA,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_funding_addresses_modified_time BEFORE
UPDATE ON funding_addresses FOR EACH ROW
EXECUTE FUNCTION update_modified_column ();

ALTER TABLE script_pubkeys
ADD COLUMN IF NOT EXISTS funding_address_id TEXT REFERENCES funding_addresses (id);

ALTER TABLE script_pubkeys
ALTER COLUMN swap_id
DROP NOT NULL;

ALTER TABLE script_pubkeys
ADD CONSTRAINT script_pubkeys_exclusive_id CHECK (
  (
    swap_id IS NOT NULL
    AND funding_address_id IS NULL
  )
  OR (
    swap_id IS NULL
    AND funding_address_id IS NOT NULL
  )
);

ALTER TABLE script_pubkeys
ALTER COLUMN "createdAt"
SET DEFAULT NOW();

ALTER TABLE script_pubkeys
ALTER COLUMN "updatedAt"
SET DEFAULT NOW();

CREATE TRIGGER update_script_pubkeys_modified_time BEFORE
UPDATE ON script_pubkeys FOR EACH ROW
EXECUTE FUNCTION update_modified_column ();
