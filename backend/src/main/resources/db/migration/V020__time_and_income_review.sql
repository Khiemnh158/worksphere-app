CREATE TABLE work_calendar (
 work_date DATE PRIMARY KEY, day_kind VARCHAR(20) NOT NULL CHECK(day_kind IN ('NORMAL','WEEKLY_OFF','HOLIDAY')),
 normal_minutes INTEGER NOT NULL CHECK(normal_minutes BETWEEN 0 AND 480),
 shift_start TIME NOT NULL,shift_end TIME NOT NULL,break_minutes INTEGER NOT NULL CHECK(break_minutes>=0),
 configured_by UUID NOT NULL REFERENCES users(id), configured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE attendance_records (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), work_date DATE NOT NULL,
 clock_in TIMESTAMPTZ NOT NULL, clock_out TIMESTAMPTZ NOT NULL,
 source_reference VARCHAR(255) NOT NULL, imported_by UUID NOT NULL REFERENCES users(id),
 regular_minutes INTEGER NOT NULL CHECK(regular_minutes BETWEEN 0 AND 480),
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
 reviewed_by UUID REFERENCES users(id), review_note TEXT, reviewed_at TIMESTAMPTZ,
 version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,work_date),CHECK(clock_out>clock_in)
);
CREATE TABLE staff_time_requests (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), department_id UUID NOT NULL REFERENCES departments(id),
 request_type VARCHAR(30) NOT NULL CHECK(request_type IN ('LEAVE_PAID','LEAVE_UNPAID','OVERTIME','TIME_CORRECTION')),
 work_date DATE NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, requested_minutes INTEGER NOT NULL CHECK(requested_minutes>0),
 reason TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CONFIRMED')),
 reviewed_by UUID REFERENCES users(id), review_note TEXT, actual_minutes INTEGER,
 reviewed_at TIMESTAMPTZ, version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),CHECK(ends_at>starts_at)
);
CREATE INDEX ix_staff_time_requests_scope ON staff_time_requests(department_id,work_date,status);
CREATE TABLE paid_leave_balances (
 user_id UUID NOT NULL REFERENCES users(id), leave_year INTEGER NOT NULL,
 allowance_minutes INTEGER NOT NULL CHECK(allowance_minutes>=0), configured_by UUID NOT NULL REFERENCES users(id),
 PRIMARY KEY(user_id,leave_year)
);
CREATE TABLE income_periods (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), period VARCHAR(7) NOT NULL,
 monthly_work_pay NUMERIC(18,2) NOT NULL CHECK(monthly_work_pay>0), employment_from DATE NOT NULL,employment_to DATE NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','LOCKED')),
 snapshot TEXT, version BIGINT NOT NULL DEFAULT 0, configured_by UUID NOT NULL REFERENCES users(id),
 locked_by UUID REFERENCES users(id),locked_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,period),CHECK(employment_to>=employment_from)
);
CREATE TABLE attendance_absences (
 user_id UUID NOT NULL REFERENCES users(id),work_date DATE NOT NULL,
 absent_minutes INTEGER NOT NULL CHECK(absent_minutes BETWEEN 1 AND 480),
 confirmed_by UUID NOT NULL REFERENCES users(id),reason TEXT NOT NULL,
 confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),revoked_at TIMESTAMPTZ,
 PRIMARY KEY(user_id,work_date)
);
