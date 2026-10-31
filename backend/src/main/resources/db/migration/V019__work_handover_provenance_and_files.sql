ALTER TABLE department_work ADD COLUMN previous_assignee_id UUID REFERENCES users(id);
CREATE TABLE department_work_files (
 work_id UUID NOT NULL REFERENCES department_work(id), file_id UUID NOT NULL UNIQUE REFERENCES stored_files(id),
 uploaded_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(work_id,file_id)
);
