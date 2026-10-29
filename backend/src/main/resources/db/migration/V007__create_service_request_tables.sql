CREATE TABLE service_categories (
    id UUID PRIMARY KEY,
    parent_id UUID NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    default_priority VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_service_categories_parent FOREIGN KEY (parent_id) REFERENCES service_categories(id)
);

CREATE TABLE service_requests (
    id UUID PRIMARY KEY,
    request_number VARCHAR(30) NOT NULL,
    category_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    asset_id UUID NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    closed_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_service_requests_category FOREIGN KEY (category_id) REFERENCES service_categories(id),
    CONSTRAINT fk_service_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_service_requests_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE TABLE service_assignments (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unassigned_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_service_assignments_request FOREIGN KEY (request_id) REFERENCES service_requests(id),
    CONSTRAINT fk_service_assignments_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE service_comments (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_service_comments_request FOREIGN KEY (request_id) REFERENCES service_requests(id),
    CONSTRAINT fk_service_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE service_attachments (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL,
    file_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_service_attachments_request FOREIGN KEY (request_id) REFERENCES service_requests(id),
    CONSTRAINT fk_service_attachments_file FOREIGN KEY (file_id) REFERENCES stored_files(id),
    CONSTRAINT fk_service_attachments_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE service_status_histories (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    comment VARCHAR(1000) NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_service_status_histories_request FOREIGN KEY (request_id) REFERENCES service_requests(id)
);

CREATE TABLE service_ratings (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL UNIQUE,
    rated_by UUID NOT NULL,
    score SMALLINT NOT NULL,
    comment VARCHAR(2000) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_service_ratings_score CHECK (score >= 1 AND score <= 5),
    CONSTRAINT fk_service_ratings_request FOREIGN KEY (request_id) REFERENCES service_requests(id),
    CONSTRAINT fk_service_ratings_user FOREIGN KEY (rated_by) REFERENCES users(id)
);
