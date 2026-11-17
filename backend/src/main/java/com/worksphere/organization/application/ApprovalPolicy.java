package com.worksphere.organization.application;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/** Live authority; delegation never grants global or legal-signatory rights. */
@Service
public class ApprovalPolicy {
    private final JdbcTemplate db;

    public ApprovalPolicy(JdbcTemplate db) {
        this.db = db;
    }

    public boolean capability(UUID actor, String capability) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM staff_capabilities c JOIN users u ON"
                                + " u.id=c.user_id WHERE c.user_id=? AND c.capability=? AND"
                                + " u.status='ACTIVE' AND NOT u.is_deleted AND (u.access_ends_at IS"
                                + " NULL OR u.access_ends_at>now()))",
                        Boolean.class,
                        actor,
                        capability));
    }

    public boolean executive(UUID actor) {
        return capability(actor, "EXECUTIVE");
    }

    public boolean manager(UUID dept, UUID actor) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM departments d JOIN users u ON"
                            + " u.id=d.manager_id WHERE d.id=? AND d.manager_id=? AND d.is_active"
                            + " AND NOT d.is_deleted AND u.status='ACTIVE' AND NOT u.is_deleted AND"
                            + " (u.access_ends_at IS NULL OR u.access_ends_at>now()))",
                        Boolean.class,
                        dept,
                        actor));
    }

    public boolean delegated(UUID dept, UUID actor, String scope) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM approval_delegations a JOIN departments d ON"
                            + " d.id=a.department_id JOIN users u ON u.id=a.delegate_id JOIN users"
                            + " g ON g.id=a.granted_by WHERE a.department_id=? AND a.delegate_id=?"
                            + " AND a.scope=? AND a.revoked_at IS NULL AND a.starts_at<=now() AND"
                            + " a.ends_at>now() AND d.is_active AND NOT d.is_deleted AND"
                            + " u.status='ACTIVE' AND u.department_id=d.id AND NOT u.is_deleted AND"
                            + " (u.access_ends_at IS NULL OR u.access_ends_at>now()) AND"
                            + " g.status='ACTIVE' AND NOT g.is_deleted AND (g.access_ends_at IS"
                            + " NULL OR g.access_ends_at>now()) AND (g.id=d.manager_id OR"
                            + " EXISTS(SELECT 1 FROM staff_capabilities c WHERE c.user_id=g.id AND"
                            + " c.capability='EXECUTIVE')))",
                        Boolean.class,
                        dept,
                        actor,
                        scope));
    }

    public boolean operations(UUID dept, UUID actor) {
        return manager(dept, actor) || delegated(dept, actor, "OPERATIONS");
    }

    public boolean oversees(UUID dept, UUID actor) {
        return executive(actor)
                && Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM department_authority WHERE"
                                        + " department_id=? AND executive_id=?)",
                                Boolean.class,
                                dept,
                                actor));
    }

    public boolean time(UUID dept, UUID subject, UUID actor) {
        if (actor.equals(subject)) return false;
        // A manager's own request always goes up; a time specialist cannot bypass that chain.
        if (manager(dept, subject)) return oversees(dept, actor);
        return manager(dept, actor)
                || delegated(dept, actor, "TIME")
                || capability(actor, "TIME_REVIEW");
    }

    public List<UUID> managed(UUID actor, String scope, boolean executives) {
        return db
                .queryForList(
                        "SELECT id FROM departments WHERE is_active AND NOT is_deleted ORDER BY"
                                + " name",
                        UUID.class)
                .stream()
                .filter(
                        d ->
                                manager(d, actor)
                                        || delegated(d, actor, scope)
                                        || (executives && oversees(d, actor)))
                .toList();
    }
}
