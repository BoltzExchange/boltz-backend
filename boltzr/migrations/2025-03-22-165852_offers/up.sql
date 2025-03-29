CREATE TABLE offers
(
    signer     BYTEA PRIMARY KEY,
    offer      TEXT                     NOT NULL,
    url        TEXT                     NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_offers_modified_time
    BEFORE UPDATE
    ON offers
    FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
