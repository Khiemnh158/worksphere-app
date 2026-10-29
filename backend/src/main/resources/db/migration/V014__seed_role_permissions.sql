-- ============================================================================
-- V014: Seed Canonical Role-Permission Mappings
-- Per docs/02_USER_ROLES_AND_WORKFLOWS.md Section 2.6 (Canonical Role-Permission Matrix)
-- ============================================================================

-- 1. ADMIN (All 29 canonical permissions)
INSERT INTO role_permissions (role_id, permission_id, assigned_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2. PROJECT_MANAGER (19 canonical permissions)
INSERT INTO role_permissions (role_id, permission_id, assigned_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
JOIN permissions p ON p.code IN (
    'PROFILE_READ',
    'PROFILE_UPDATE',
    'PROJECT_READ',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_MEMBER_MANAGE',
    'TASK_READ',
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_DELETE',
    'TASK_ASSIGN',
    'TASK_UPDATE_STATUS',
    'SERVICE_REQUEST_READ',
    'SERVICE_REQUEST_CREATE',
    'SERVICE_REQUEST_UPDATE',
    'SERVICE_REQUEST_UPDATE_STATUS',
    'ASSET_READ',
    'NOTIFICATION_READ',
    'NOTIFICATION_UPDATE'
)
WHERE r.code = 'PROJECT_MANAGER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. TEAM_LEADER (14 canonical permissions)
INSERT INTO role_permissions (role_id, permission_id, assigned_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
JOIN permissions p ON p.code IN (
    'PROFILE_READ',
    'PROFILE_UPDATE',
    'TASK_READ',
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_ASSIGN',
    'TASK_UPDATE_STATUS',
    'SERVICE_REQUEST_READ',
    'SERVICE_REQUEST_CREATE',
    'SERVICE_REQUEST_UPDATE',
    'SERVICE_REQUEST_UPDATE_STATUS',
    'ASSET_READ',
    'NOTIFICATION_READ',
    'NOTIFICATION_UPDATE'
)
WHERE r.code = 'TEAM_LEADER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. EMPLOYEE (12 canonical permissions)
INSERT INTO role_permissions (role_id, permission_id, assigned_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
JOIN permissions p ON p.code IN (
    'PROFILE_READ',
    'PROFILE_UPDATE',
    'TASK_READ',
    'TASK_UPDATE',
    'TASK_UPDATE_STATUS',
    'SERVICE_REQUEST_READ',
    'SERVICE_REQUEST_CREATE',
    'SERVICE_REQUEST_UPDATE',
    'SERVICE_REQUEST_UPDATE_STATUS',
    'ASSET_READ',
    'NOTIFICATION_READ',
    'NOTIFICATION_UPDATE'
)
WHERE r.code = 'EMPLOYEE'
ON CONFLICT (role_id, permission_id) DO NOTHING;
