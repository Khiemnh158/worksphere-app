CREATE TABLE attendance_stations(id UUID PRIMARY KEY,name VARCHAR(100) NOT NULL,is_active BOOLEAN NOT NULL DEFAULT TRUE,created_by UUID NOT NULL REFERENCES users(id),created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE attendance_qr_challenges(id UUID PRIMARY KEY,station_id UUID NOT NULL REFERENCES attendance_stations(id),token_hash VARCHAR(64) NOT NULL UNIQUE,issued_by UUID NOT NULL REFERENCES users(id),expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE attendance_punches(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id),work_date DATE NOT NULL,punch_type VARCHAR(3) NOT NULL CHECK(punch_type IN ('IN','OUT')),recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),challenge_id UUID NOT NULL REFERENCES attendance_qr_challenges(id),UNIQUE(user_id,work_date,punch_type));
ALTER TABLE work_handovers ADD COLUMN cancelled_at TIMESTAMPTZ;
DROP INDEX ix_one_pending_handover;
CREATE UNIQUE INDEX ix_one_pending_handover ON work_handovers(work_id) WHERE accepted_at IS NULL AND cancelled_at IS NULL;
ALTER TABLE access_requests ADD COLUMN executed_note TEXT;
