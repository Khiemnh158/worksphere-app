CREATE TABLE projects (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    manager_id UUID NOT NULL,
    department_id UUID NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    start_date DATE NULL,
    planned_end_date DATE NULL,
    actual_end_date DATE NULL,
    progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_projects_progress CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_projects_dates CHECK (planned_end_date >= start_date),
    CONSTRAINT fk_projects_manager FOREIGN KEY (manager_id) REFERENCES users(id),
    CONSTRAINT fk_projects_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_project_members UNIQUE (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    status VARCHAR(30) NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE project_status_histories (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    reason VARCHAR(1000) NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_project_status_histories_project FOREIGN KEY (project_id) REFERENCES projects(id)
);
