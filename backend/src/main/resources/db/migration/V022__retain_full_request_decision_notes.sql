-- New review operations retain the full explanation instead of truncating audit evidence.
ALTER TABLE service_status_histories ALTER COLUMN comment TYPE TEXT;
