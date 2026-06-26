CREATE OR REPLACE FUNCTION check_invoice_update () RETURNS TRIGGER AS $$
BEGIN
    IF OLD.invoice IS NOT NULL AND OLD.invoice != NEW.invoice THEN
        RAISE EXCEPTION 'INVOICE_ALREADY_SET';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_invoice_update BEFORE
UPDATE ON swaps FOR EACH ROW
EXECUTE FUNCTION check_invoice_update ();
