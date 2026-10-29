CREATE TABLE asset_categories (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE assets (
    id UUID PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL,
    category_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    serial_number VARCHAR(150) NULL,
    manufacturer VARCHAR(150) NULL,
    model VARCHAR(150) NULL,
    purchase_date DATE NULL,
    purchase_price NUMERIC(18,2) NULL,
    warranty_end_date DATE NULL,
    status VARCHAR(30) NOT NULL,
    location VARCHAR(255) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_assets_price CHECK (purchase_price >= 0 OR purchase_price IS NULL),
    CONSTRAINT fk_assets_category FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    assigned_to UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_return_at TIMESTAMP WITH TIME ZONE NULL,
    returned_at TIMESTAMP WITH TIME ZONE NULL,
    return_condition VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL,
    notes VARCHAR(1000) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_asset_assignments_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_asset_assignments_user FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE asset_repair_histories (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    service_request_id UUID NULL,
    repair_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    vendor_name VARCHAR(255) NULL,
    cost NUMERIC(18,2) NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    result VARCHAR(1000) NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_asset_repair_cost CHECK (cost >= 0 OR cost IS NULL),
    CONSTRAINT chk_asset_repair_dates CHECK (completed_at >= started_at OR completed_at IS NULL),
    CONSTRAINT fk_asset_repair_histories_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);
