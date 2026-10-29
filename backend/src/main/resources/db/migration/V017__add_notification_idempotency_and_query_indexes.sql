-- ============================================================================
-- V017: Add Notification Idempotency and Query Indexes
-- Per docs/05_DATABASE_DESIGN.md Section 8.8 & reports/DECISIONS.md D-049, D-050
-- ============================================================================

-- 1. Add nullable event_key column
ALTER TABLE notifications
ADD COLUMN event_key VARCHAR(255);

-- 2. Controlled deterministic data backfill for legacy rows
UPDATE notifications
SET event_key = 'LEGACY_MIGRATION:' || id::text
WHERE event_key IS NULL;

-- 3. Validate no null values exist after backfill
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM notifications WHERE event_key IS NULL) THEN
        RAISE EXCEPTION 'event_key contains NULL values after backfill';
    END IF;
END $$;

-- 4. Set NOT NULL on event_key
ALTER TABLE notifications
ALTER COLUMN event_key SET NOT NULL;

-- 5. Unique index for idempotent recipient notification delivery
CREATE UNIQUE INDEX uk_notifications_recipient_event
ON notifications(recipient_id, event_key);

-- 6. Query index for paginated recipient notification history
CREATE INDEX idx_notifications_recipient_created_at
ON notifications(recipient_id, created_at DESC);
