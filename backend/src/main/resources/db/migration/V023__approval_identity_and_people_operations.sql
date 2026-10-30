ALTER TABLE users ADD COLUMN employee_code VARCHAR(50), ADD COLUMN job_title VARCHAR(100) NOT NULL DEFAULT 'Nhân viên', ADD COLUMN email_verified_at TIMESTAMPTZ, ADD COLUMN activation_required BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN access_ends_at TIMESTAMPTZ;
UPDATE users SET employee_code='WS-'||upper(substr(replace(id::text,'-',''),1,16));
ALTER TABLE users ALTER COLUMN employee_code SET NOT NULL;
ALTER TABLE users ALTER COLUMN employee_code SET DEFAULT ('WS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)));
CREATE UNIQUE INDEX ux_users_employee_code ON users(employee_code);
ALTER TABLE staff_capabilities DROP CONSTRAINT staff_capabilities_capability_check;
ALTER TABLE staff_capabilities ADD CONSTRAINT staff_capabilities_capability_check CHECK(capability IN ('HR_MANAGE','TIME_REVIEW','PAYROLL_MANAGE','PAYROLL_APPROVE','EXECUTIVE'));
CREATE TABLE department_authority (
 department_id UUID PRIMARY KEY REFERENCES departments(id), executive_id UUID NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, changed_by UUID NOT NULL REFERENCES users(id), changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE approval_delegations (
 id UUID PRIMARY KEY, department_id UUID NOT NULL REFERENCES departments(id), delegate_id UUID NOT NULL REFERENCES users(id),
 scope VARCHAR(20) NOT NULL CHECK(scope IN ('OPERATIONS','TIME')), starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 granted_by UUID NOT NULL REFERENCES users(id), reason TEXT NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(ends_at>starts_at)
);
CREATE INDEX ix_approval_delegations_live ON approval_delegations(department_id,delegate_id,scope,ends_at) WHERE revoked_at IS NULL;
CREATE TABLE account_recovery_tokens (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), purpose VARCHAR(20) NOT NULL CHECK(purpose IN ('ACTIVATE','RESET')),
 token_hash VARCHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE recovery_rate_windows (bucket VARCHAR(100) PRIMARY KEY, window_at TIMESTAMPTZ NOT NULL, attempts INTEGER NOT NULL);
CREATE TABLE identity_totp (user_id UUID PRIMARY KEY REFERENCES users(id),secret_cipher TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT FALSE,setup_expires_at TIMESTAMPTZ,last_step BIGINT NOT NULL DEFAULT -1,recovery_hashes TEXT NOT NULL DEFAULT '');
CREATE TABLE mail_outbox (
 id UUID PRIMARY KEY, recipient VARCHAR(255) NOT NULL, subject VARCHAR(200) NOT NULL, encrypted_body TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, sent_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE personnel_cases (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), created_by UUID NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, effective_at TIMESTAMPTZ NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CLOSED')),
 decision_reference TEXT, checked_by UUID REFERENCES users(id), approved_by UUID REFERENCES users(id), approved_at TIMESTAMPTZ,
 handover_done BOOLEAN NOT NULL DEFAULT FALSE, access_done BOOLEAN NOT NULL DEFAULT FALSE, payroll_done BOOLEAN NOT NULL DEFAULT FALSE,
 closed_by UUID REFERENCES users(id), version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_personnel_case_open ON personnel_cases(user_id) WHERE status NOT IN ('REJECTED','CLOSED');
CREATE TABLE access_requests (
 id UUID PRIMARY KEY, created_by UUID NOT NULL REFERENCES users(id), user_id UUID NOT NULL REFERENCES users(id),
 request_type VARCHAR(30) NOT NULL CHECK(request_type IN ('LOCK','UNLOCK','CHANGE_ACCESS','OFFBOARD')),
 reason TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','DONE')),
 approved_by UUID REFERENCES users(id), processed_by UUID REFERENCES users(id), personnel_case_id UUID REFERENCES personnel_cases(id),
 version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE income_periods ADD COLUMN approval_state VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK(approval_state IN ('DRAFT','SUBMITTED','APPROVED','PUBLISHED')), ADD COLUMN submitted_by UUID REFERENCES users(id), ADD COLUMN approved_by UUID REFERENCES users(id), ADD COLUMN approval_reason TEXT;
UPDATE income_periods SET approval_state='PUBLISHED' WHERE status='LOCKED';
CREATE TABLE income_adjustments (
 id UUID PRIMARY KEY, income_id UUID NOT NULL REFERENCES income_periods(id), created_by UUID NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, amount NUMERIC(18,2) NOT NULL, approved_by UUID REFERENCES users(id), approval_note TEXT,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), version BIGINT NOT NULL DEFAULT 0
);
