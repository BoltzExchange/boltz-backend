CREATE TABLE IF NOT EXISTS funding_addresses
(
    id                      VARCHAR(255) PRIMARY KEY,
    symbol                  TEXT                     NOT NULL,
    status                  TEXT                     NOT NULL,
    key_index               INTEGER                  NOT NULL,
    their_public_key        TEXT                     NOT NULL,
    timeout_block_height    INTEGER                  NOT NULL,
    lockup_transaction_id   VARCHAR(255),
    lockup_amount           BIGINT,
    lockup_transaction_vout INTEGER,
    swap_id                 VARCHAR(255),
    presigned_tx            BYTEA,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX funding_addresses_swap_id_idx ON funding_addresses (swap_id);

CREATE TRIGGER update_funding_addresses_modified_time
    BEFORE UPDATE
    ON funding_addresses
    FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
