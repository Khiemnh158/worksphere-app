
ALTER TABLE service_categories ADD COLUMN receiving_department_id UUID REFERENCES departments(id);
ALTER TABLE service_requests ADD COLUMN receiving_department_id UUID REFERENCES departments(id);
CREATE INDEX ix_service_requests_department ON service_requests(receiving_department_id, status) WHERE NOT is_deleted;
CREATE TABLE staff_capabilities (
 user_id UUID NOT NULL REFERENCES users(id), capability VARCHAR(40) NOT NULL,
 granted_by UUID REFERENCES users(id), granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,capability), CHECK(capability IN ('HR_MANAGE','TIME_REVIEW','PAYROLL_MANAGE'))
);
-- Department work is independent from the inherited project/task module.
CREATE TABLE department_work (
 id UUID PRIMARY KEY, department_id UUID NOT NULL REFERENCES departments(id),
 title VARCHAR(255) NOT NULL, description TEXT NOT NULL, priority VARCHAR(20) NOT NULL,
 assignee_id UUID REFERENCES users(id), reviewer_id UUID NOT NULL REFERENCES users(id),
 status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED', progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 due_at TIMESTAMPTZ NOT NULL, created_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), version BIGINT NOT NULL DEFAULT 0,
 CHECK(status IN ('ASSIGNED','IN_PROGRESS','REVIEW','COMPLETED','HANDOVER'))
);
CREATE INDEX ix_department_work_scope ON department_work(department_id, assignee_id, status);
CREATE TABLE work_events (
 id UUID PRIMARY KEY, work_id UUID NOT NULL REFERENCES department_work(id), actor_id UUID NOT NULL REFERENCES users(id),
 event_type VARCHAR(40) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE work_handovers (
 id UUID PRIMARY KEY, work_id UUID NOT NULL REFERENCES department_work(id), from_user_id UUID REFERENCES users(id),
 to_user_id UUID NOT NULL REFERENCES users(id), assigned_by UUID NOT NULL REFERENCES users(id),
 progress_snapshot INTEGER NOT NULL, review_note TEXT, accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ix_one_pending_handover ON work_handovers(work_id) WHERE accepted_at IS NULL;
CREATE TABLE workplace_events (
 id UUID PRIMARY KEY, actor_id UUID NOT NULL REFERENCES users(id), subject_id UUID,
 event_type VARCHAR(50) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE workplace_notices (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), title VARCHAR(255) NOT NULL,
 reference_type VARCHAR(30) NOT NULL, reference_id UUID, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_workplace_notices_user ON workplace_notices(user_id,created_at DESC);
