-- ============================================================================
-- V016: Add Asset Assignment and Category Invariants and Indexes
-- Per docs/05_DATABASE_DESIGN.md Section 10 & reports/DECISIONS.md D-046
-- ============================================================================

-- 1. Partial Unique Index: Exactly one ACTIVE assignment per asset
CREATE UNIQUE INDEX uk_asset_assignments_one_active
ON asset_assignments(asset_id)
WHERE status = 'ACTIVE';

-- 2. Category code normalization check constraint
ALTER TABLE asset_categories
ADD CONSTRAINT chk_asset_categories_code_normalized
CHECK (
    code = UPPER(BTRIM(code))
    AND code ~ '^[A-Z0-9_]{2,50}$'
);

-- 3. Unique Index: Category code uniqueness
CREATE UNIQUE INDEX uk_asset_categories_code
ON asset_categories(code);

-- 4. Asset code normalization check constraint
ALTER TABLE assets
ADD CONSTRAINT chk_assets_asset_code_normalized
CHECK (
    asset_code = UPPER(BTRIM(asset_code))
    AND asset_code ~ '^[A-Z0-9][A-Z0-9_-]{1,49}$'
);

-- 5. Query Performance Indexes
CREATE INDEX idx_asset_assignments_assigned_to
ON asset_assignments(assigned_to);

CREATE INDEX idx_asset_assignments_asset_id
ON asset_assignments(asset_id);
