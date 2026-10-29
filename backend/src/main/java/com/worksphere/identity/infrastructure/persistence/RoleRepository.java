package com.worksphere.identity.infrastructure.persistence;

import com.worksphere.identity.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;
import java.util.UUID;

/**
 * Spring Data JPA repository for Role entity.
 */
public interface RoleRepository extends JpaRepository<Role, UUID> {

    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE r IN " +
           "(SELECT ur FROM User u JOIN u.roles ur WHERE u.id = :userId) AND r.active = true")
    Set<Role> findActiveRolesByUserId(@Param("userId") UUID userId);

    Set<Role> findByCodeIn(java.util.Collection<String> codes);

    java.util.Optional<Role> findByCode(String code);
}
