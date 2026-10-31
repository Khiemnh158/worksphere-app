ALTER TABLE work_calendar ADD COLUMN break_start TIME, ADD COLUMN break_end TIME,
 ADD COLUMN late_grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK(late_grace_minutes BETWEEN 0 AND 120);
ALTER TABLE work_calendar ADD CONSTRAINT ck_calendar_break_window CHECK(
 (break_start IS NULL AND break_end IS NULL) OR
 (break_start IS NOT NULL AND break_end IS NOT NULL AND break_start>=shift_start AND break_end<=shift_end AND break_end>break_start
 AND extract(epoch FROM (break_end-break_start))/60=break_minutes));
ALTER TABLE attendance_stations ADD COLUMN allowed_cidrs TEXT NOT NULL DEFAULT '',
 ADD COLUMN opens_at TIME NOT NULL DEFAULT '06:00', ADD COLUMN closes_at TIME NOT NULL DEFAULT '22:00',
 ADD CONSTRAINT ck_station_hours CHECK(closes_at>opens_at);
ALTER TABLE attendance_punches DROP CONSTRAINT attendance_punches_punch_type_check;
ALTER TABLE attendance_punches ALTER COLUMN punch_type TYPE VARCHAR(6);
ALTER TABLE attendance_punches ADD CONSTRAINT ck_punch_type CHECK(punch_type IN ('IN','OUT','OT_IN','OT_OUT'));
ALTER TABLE attendance_punches ADD COLUMN peer_ip VARCHAR(64),
 ADD COLUMN network_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED' CHECK(network_status IN ('UNVERIFIED','UNCONFIGURED','MISMATCH','MATCH')),
 ADD COLUMN overtime_request_id UUID REFERENCES staff_time_requests(id);
ALTER TABLE attendance_records ADD COLUMN late_minutes INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN early_minutes INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN network_review_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE staff_time_requests ADD COLUMN exception_reason TEXT,
 ADD COLUMN approval_mode VARCHAR(20) CHECK(approval_mode IN ('PRIOR','EXCEPTION'));
CREATE INDEX ix_attendance_punch_scope ON attendance_punches(work_date,user_id);
