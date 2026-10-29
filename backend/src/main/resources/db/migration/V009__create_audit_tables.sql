CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id UUID NULL,
    description VARCHAR(2000) NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(500) NULL,
    trace_id VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
