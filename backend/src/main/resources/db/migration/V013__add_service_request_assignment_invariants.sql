CREATE UNIQUE INDEX uk_service_assignments_one_active
ON service_assignments(request_id)
WHERE is_active = TRUE;
