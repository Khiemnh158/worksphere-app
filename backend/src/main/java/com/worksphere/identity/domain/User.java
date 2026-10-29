package com.worksphere.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * JPA Entity for the users table.
 * Includes soft delete fields, optimistic locking (version), and status enum.
 * Per 05_DATABASE_DESIGN.md section 5.1.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "avatar_file_id")
    private UUID avatarFileId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @jakarta.persistence.Version
    @Column(name = "version", nullable = false)
    private Long version;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id", insertable = false, updatable = false),
            inverseJoinColumns = @JoinColumn(name = "role_id", insertable = false, updatable = false)
    )
    private Set<Role> roles = new HashSet<>();

    protected User() {
    }

    /**
     * Factory method to create a new user.
     */
    public static User create(
            UUID id,
            String username,
            String email,
            String passwordHash,
            String fullName
    ) {
        User user = new User();
        user.id = id;
        user.username = username;
        user.email = email.toLowerCase();
        user.passwordHash = passwordHash;
        user.fullName = fullName;
        user.status = UserStatus.PENDING;
        user.deleted = false;
        user.createdAt = Instant.now();
        user.updatedAt = Instant.now();
        return user;
    }

    /**
     * Validates that this user is allowed to log in based on account status.
     * Per 02_USER_ROLES_AND_WORKFLOWS.md section 3.5.
     */
    public void validateCanLogin() {
        switch (status) {
            case PENDING -> throw new com.worksphere.shared.exception.BusinessRuleException(
                    "ACCOUNT_PENDING", "Tài khoản chưa được kích hoạt");
            case LOCKED -> throw new com.worksphere.shared.exception.BusinessRuleException(
                    "ACCOUNT_LOCKED", "Tài khoản đã bị khóa");
            case DISABLED -> throw new com.worksphere.shared.exception.BusinessRuleException(
                    "ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa");
            case ACTIVE -> { /* allowed */ }
        }
    }

    public void recordLogin() {
        this.lastLoginAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void updatePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.passwordChangedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void updateProfile(String fullName, String phoneNumber) {
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.updatedAt = Instant.now();
    }

    public void updateAvatarFileId(UUID avatarFileId) {
        this.avatarFileId = avatarFileId;
        this.updatedAt = Instant.now();
    }

    public void updateDepartmentId(UUID departmentId) {
        this.departmentId = departmentId;
        this.updatedAt = Instant.now();
    }

    public void adminUpdate(String fullName, String phoneNumber, UUID departmentId) {
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.departmentId = departmentId;
        this.updatedAt = Instant.now();
    }

    public void lock() {
        if (this.status == UserStatus.DISABLED) {
            throw new com.worksphere.shared.exception.BusinessRuleException(
                    "CANNOT_LOCK_DISABLED_USER", "Không thể khóa tài khoản đã bị vô hiệu hóa");
        }
        this.status = UserStatus.LOCKED;
        this.updatedAt = Instant.now();
    }

    public void unlock() {
        if (this.status != UserStatus.LOCKED) {
            throw new com.worksphere.shared.exception.BusinessRuleException(
                    "USER_NOT_LOCKED", "Chỉ có thể mở khóa tài khoản đang bị khóa");
        }
        this.status = UserStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles != null ? roles : new HashSet<>();
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getDepartmentId() {
        return departmentId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public UUID getAvatarFileId() {
        return avatarFileId;
    }

    public UserStatus getStatus() {
        return status;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Instant getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public Set<Role> getRoles() {
        return roles;
    }
}
