CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    parent_task_id UUID NULL,
    milestone_id UUID NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    reporter_id UUID NOT NULL,
    start_date DATE NULL,
    due_date TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NULL,
    actual_minutes INTEGER NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_tasks_progress CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_tasks_est_minutes CHECK (estimated_minutes >= 0 OR estimated_minutes IS NULL),
    CONSTRAINT chk_tasks_act_minutes CHECK (actual_minutes >= 0 OR actual_minutes IS NULL),
    CONSTRAINT chk_tasks_parent CHECK (parent_task_id <> id),
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    CONSTRAINT fk_tasks_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_tasks_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
);

CREATE TABLE task_assignments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unassigned_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_task_assignments_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_assignments_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE task_comments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_comments_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT fk_task_comments_parent FOREIGN KEY (parent_id) REFERENCES task_comments(id)
);

CREATE TABLE task_attachments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    file_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_task_attachments UNIQUE (task_id, file_id),
    CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_attachments_file FOREIGN KEY (file_id) REFERENCES stored_files(id),
    CONSTRAINT fk_task_attachments_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE task_status_histories (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    comment VARCHAR(1000) NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_task_status_histories_task FOREIGN KEY (task_id) REFERENCES tasks(id)
);
