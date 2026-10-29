package com.worksphere.identity.infrastructure.persistence;

import com.worksphere.identity.domain.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for User entity.
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE (u.username = :login OR u.email = :login) AND u.deleted = false")
    Optional<User> findActiveByUsernameOrEmail(@Param("login") String login);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.deleted = false")
    Optional<User> findActiveByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deleted = false")
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findActiveById(@Param("id") UUID id);

    boolean existsByUsernameAndDeletedFalse(String username);

    boolean existsByEmailAndDeletedFalse(String email);

    @Query("SELECT u FROM User u WHERE u.deleted = false " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "AND (:departmentId IS NULL OR u.departmentId = :departmentId) " +
           "AND (:status IS NULL OR u.status = :status)")
    org.springframework.data.domain.Page<User> searchUsers(
            @Param("search") String search,
            @Param("departmentId") UUID departmentId,
            @Param("status") com.worksphere.identity.domain.UserStatus status,
            org.springframework.data.domain.Pageable pageable
    );
}
