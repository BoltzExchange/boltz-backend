CREATE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE web_hooks (
    id VARCHAR(255) PRIMARY KEY,
    state TEXT NOT NULL,
    url TEXT NOT NULL,
    hash_swap_id BOOL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX web_hooks_state ON web_hooks (state);

CREATE TRIGGER update_web_hooks_modified_time
    BEFORE UPDATE ON web_hooks
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
