package com.worksphere.project.domain;

/**
 * Role of a Member within a specific Project.
 * Per 05_DATABASE_DESIGN.md section 7.2.
 */
public enum ProjectRole {
    PROJECT_MANAGER,
    TEAM_LEADER,
    MEMBER,
    OBSERVER
}
