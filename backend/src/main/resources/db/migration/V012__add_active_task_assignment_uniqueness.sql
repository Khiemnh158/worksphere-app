CREATE UNIQUE INDEX uk_task_assignments_active
ON task_assignments(task_id, assignee_id)
WHERE is_active = TRUE;
