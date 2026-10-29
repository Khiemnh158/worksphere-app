-- ============================================================================
-- V015: Correct PROJECT_READ Permissions for Project Members & Validate Matrix
-- Per docs/02_USER_ROLES_AND_WORKFLOWS.md Section 2.6 (Canonical Role-Permission Matrix)
-- ============================================================================

-- 1. Grant PROJECT_READ to TEAM_LEADER and EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id, assigned_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('TEAM_LEADER', 'EMPLOYEE')
  AND p.code = 'PROJECT_READ'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2. Strict Validation Guard (Fail-fast verification)
DO $$
DECLARE
    v_roles_count INTEGER;
    v_permissions_count INTEGER;
    v_total_mappings INTEGER;
    v_admin_mappings INTEGER;
    v_pm_mappings INTEGER;
    v_leader_mappings INTEGER;
    v_emp_mappings INTEGER;
    v_project_read_roles INTEGER;
    v_invalid_assign_roles INTEGER;
    v_invalid_category_roles INTEGER;
BEGIN
    -- Verify roles count = 4
    SELECT COUNT(*) INTO v_roles_count FROM roles;
    IF v_roles_count != 4 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 4 roles, found %', v_roles_count;
    END IF;

    -- Verify permissions count = 29
    SELECT COUNT(*) INTO v_permissions_count FROM permissions;
    IF v_permissions_count != 29 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 29 permissions, found %', v_permissions_count;
    END IF;

    -- Verify ADMIN mapping count = 29
    SELECT COUNT(*) INTO v_admin_mappings
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'ADMIN';
    IF v_admin_mappings != 29 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 29 ADMIN mappings, found %', v_admin_mappings;
    END IF;

    -- Verify PROJECT_MANAGER mapping count = 19
    SELECT COUNT(*) INTO v_pm_mappings
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'PROJECT_MANAGER';
    IF v_pm_mappings != 19 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 19 PROJECT_MANAGER mappings, found %', v_pm_mappings;
    END IF;

    -- Verify TEAM_LEADER mapping count = 15
    SELECT COUNT(*) INTO v_leader_mappings
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'TEAM_LEADER';
    IF v_leader_mappings != 15 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 15 TEAM_LEADER mappings, found %', v_leader_mappings;
    END IF;

    -- Verify EMPLOYEE mapping count = 13
    SELECT COUNT(*) INTO v_emp_mappings
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'EMPLOYEE';
    IF v_emp_mappings != 13 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 13 EMPLOYEE mappings, found %', v_emp_mappings;
    END IF;

    -- Verify Total mapping count = 76
    SELECT COUNT(*) INTO v_total_mappings FROM role_permissions;
    IF v_total_mappings != 76 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected 76 total mappings, found %', v_total_mappings;
    END IF;

    -- Verify PROJECT_READ is present on all 4 roles
    SELECT COUNT(DISTINCT r.code) INTO v_project_read_roles
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE p.code = 'PROJECT_READ';
    IF v_project_read_roles != 4 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: Expected PROJECT_READ on 4 roles, found %', v_project_read_roles;
    END IF;

    -- Verify SERVICE_REQUEST_ASSIGN only on ADMIN
    SELECT COUNT(*) INTO v_invalid_assign_roles
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE p.code = 'SERVICE_REQUEST_ASSIGN' AND r.code != 'ADMIN';
    IF v_invalid_assign_roles > 0 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: SERVICE_REQUEST_ASSIGN granted to non-admin roles: %', v_invalid_assign_roles;
    END IF;

    -- Verify SERVICE_CATEGORY_MANAGE only on ADMIN
    SELECT COUNT(*) INTO v_invalid_category_roles
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE p.code = 'SERVICE_CATEGORY_MANAGE' AND r.code != 'ADMIN';
    IF v_invalid_category_roles > 0 THEN
        RAISE EXCEPTION 'V015 VALIDATION FAILED: SERVICE_CATEGORY_MANAGE granted to non-admin roles: %', v_invalid_category_roles;
    END IF;
END $$;
