ALTER TABLE staff_time_requests ADD COLUMN submitted_by UUID REFERENCES users(id);
UPDATE staff_time_requests SET submitted_by=user_id;
ALTER TABLE staff_time_requests ALTER COLUMN submitted_by SET NOT NULL;
