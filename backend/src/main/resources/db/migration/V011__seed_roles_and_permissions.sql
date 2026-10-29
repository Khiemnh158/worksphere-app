-- Seed Permissions
INSERT INTO permissions (id, code, name, module, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'PROFILE_READ', 'Profile Read', 'IDENTITY', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROFILE_UPDATE', 'Profile Update', 'IDENTITY', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROJECT_READ', 'Project Read', 'PROJECT', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROJECT_CREATE', 'Project Create', 'PROJECT', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROJECT_UPDATE', 'Project Update', 'PROJECT', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROJECT_MEMBER_MANAGE', 'Project Member Manage', 'PROJECT', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_READ', 'Task Read', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_CREATE', 'Task Create', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_UPDATE', 'Task Update', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_DELETE', 'Task Delete', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_ASSIGN', 'Task Assign', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'TASK_UPDATE_STATUS', 'Task Update Status', 'TASK', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_REQUEST_READ', 'Service Request Read', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_REQUEST_CREATE', 'Service Request Create', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_REQUEST_UPDATE', 'Service Request Update', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_REQUEST_ASSIGN', 'Service Request Assign', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_REQUEST_UPDATE_STATUS', 'Service Request Update Status', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'SERVICE_CATEGORY_MANAGE', 'Service Category Manage', 'SERVICE_REQUEST', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'ASSET_READ', 'Asset Read', 'ASSET', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'ASSET_MANAGE', 'Asset Manage', 'ASSET', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'ASSET_CATEGORY_MANAGE', 'Asset Category Manage', 'ASSET', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'NOTIFICATION_READ', 'Notification Read', 'NOTIFICATION', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'NOTIFICATION_UPDATE', 'Notification Update', 'NOTIFICATION', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'USER_READ', 'User Read', 'IDENTITY', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'USER_MANAGE', 'User Manage', 'IDENTITY', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'ROLE_MANAGE', 'Role Manage', 'IDENTITY', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'DEPARTMENT_MANAGE', 'Department Manage', 'ORGANIZATION', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'AUDIT_READ', 'Audit Read', 'AUDIT', '', current_timestamp, current_timestamp),
(gen_random_uuid(), 'REPORT_READ', 'Report Read', 'REPORTING', '', current_timestamp, current_timestamp);

-- Seed Roles
INSERT INTO roles (id, code, name, description, is_system, is_active, created_at, updated_at) VALUES 
(gen_random_uuid(), 'EMPLOYEE', 'Employee', 'Default employee role', true, true, current_timestamp, current_timestamp),
(gen_random_uuid(), 'TEAM_LEADER', 'Team Leader', 'Team leader role', true, true, current_timestamp, current_timestamp),
(gen_random_uuid(), 'PROJECT_MANAGER', 'Project Manager', 'Project manager role', true, true, current_timestamp, current_timestamp),
(gen_random_uuid(), 'ADMIN', 'Admin', 'System administrator role', true, true, current_timestamp, current_timestamp);
