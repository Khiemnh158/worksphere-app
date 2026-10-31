package com.worksphere.workplace;

import com.worksphere.identity.domain.*;
import com.worksphere.identity.infrastructure.persistence.*;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.service_request.domain.*;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

/** Opt-in sample company in a dedicated practice database. No production bootstrap. */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "worksphere.web-demo.enabled", havingValue = "true")
public class WebDemoProvisioner implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final DepartmentRepository departments;
    private final ServiceCategoryRepository categories;
    private final PasswordEncoder encoder;
    private final JdbcTemplate db;
    private final String password, url;

    public WebDemoProvisioner(
            UserRepository users,
            RoleRepository roles,
            UserRoleRepository userRoles,
            DepartmentRepository departments,
            ServiceCategoryRepository categories,
            PasswordEncoder encoder,
            JdbcTemplate db,
            @Value("${WORKSPHERE_WEB_DEMO_PASSWORD:}") String password,
            @Value("${spring.datasource.url}") String url) {
        this.users = users;
        this.roles = roles;
        this.userRoles = userRoles;
        this.departments = departments;
        this.categories = categories;
        this.encoder = encoder;
        this.db = db;
        this.password = password;
        this.url = url;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!url.matches(
                        "jdbc:postgresql://(?:localhost|127\\.0\\.0\\.1):[0-9]+/worksphere_web[a-zA-Z0-9_]*")
                || password.length() < 12)
            throw new IllegalStateException(
                    "Web demo requires dedicated local worksphere_web database and external"
                            + " password (12+ chars)");
        if (users.existsByUsernameAndDeletedFalse("admin.web")) {
            provisionLeadership();
            return;
        }
        if (db.queryForObject("SELECT count(*) FROM users", Integer.class) != 0)
            throw new IllegalStateException("Web demo only initializes an empty practice database");
        String hash = encoder.encode(password);
        User admin = user("admin.web", "Quản trị hệ thống", null, "ADMIN", hash);
        String[][] names = {
            {
                "KD",
                "Kinh doanh",
                "ngoc.kd",
                "Ngọc · Trưởng phòng",
                "minh.kd",
                "Minh",
                "linh.kd",
                "Linh",
                "Hỗ trợ báo giá"
            },
            {
                "IT",
                "Công nghệ thông tin",
                "hung.it",
                "Hùng · Trưởng phòng",
                "lan.it",
                "Lan",
                "hai.it",
                "Hải",
                "Hỗ trợ máy tính và phần mềm"
            },
            {
                "HCNS",
                "Hành chính – Nhân sự",
                "thao.hc",
                "Thảo · Trưởng phòng",
                "mai.hc",
                "Mai",
                "an.hc",
                "An",
                "Phòng họp và văn phòng phẩm"
            }
        };
        for (String[] n : names) {
            Department dept =
                    departments.saveAndFlush(
                            Department.create(
                                    UUID.randomUUID(),
                                    n[0],
                                    n[1],
                                    "Dữ liệu thực hành của công ty An Phát",
                                    null,
                                    null));
            User manager = user(n[2], n[3], dept.getId(), "EMPLOYEE", hash),
                    a = user(n[4], n[5], dept.getId(), "EMPLOYEE", hash),
                    b = user(n[6], n[7], dept.getId(), "EMPLOYEE", hash);
            dept.update(n[1], dept.getDescription(), null, manager.getId());
            departments.saveAndFlush(dept);
            ServiceCategory cat =
                    ServiceCategory.create(
                            UUID.randomUUID(),
                            null,
                            n[0] + "_SUPPORT",
                            n[8],
                            null,
                            ServicePriority.MEDIUM,
                            true,
                            Instant.now());
            cat.routeTo(dept.getId());
            categories.saveAndFlush(cat);
            if ("HCNS".equals(n[0]))
                db.update(
                        "INSERT INTO staff_capabilities(user_id,capability,granted_by) VALUES"
                                + " (?,'HR_MANAGE',?),(?,'TIME_REVIEW',?),(?,'PAYROLL_MANAGE',?)",
                        manager.getId(),
                        admin.getId(),
                        manager.getId(),
                        admin.getId(),
                        manager.getId(),
                        admin.getId());
            UUID work = UUID.randomUUID();
            db.update(
                    "INSERT INTO"
                        + " department_work(id,department_id,title,description,priority,assignee_id,reviewer_id,due_at,created_by,status,progress)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,'IN_PROGRESS',?)",
                    work,
                    dept.getId(),
                    "IT".equals(n[0])
                            ? "Chuẩn bị thiết bị cho nhân viên mới"
                            : "KD".equals(n[0])
                                    ? "Chuẩn bị tài liệu cho buổi gặp khách hàng"
                                    : "Kiểm tra phòng họp tuần tới",
                    "Công việc thực hành. Kiểm tra các hạng mục đã có và ghi nhận kết quả trước khi"
                            + " gửi nghiệm thu.",
                    "HIGH",
                    a.getId(),
                    manager.getId(),
                    java.sql.Timestamp.from(Instant.now().plusSeconds(86400 * 2)),
                    manager.getId(),
                    "IT".equals(n[0]) ? 65 : 30);
            db.update(
                    "INSERT INTO work_events(id,work_id,actor_id,event_type,content) VALUES"
                            + " (?,?,?,?,?)",
                    UUID.randomUUID(),
                    work,
                    a.getId(),
                    "PROGRESS",
                    "IT".equals(n[0])
                            ? "Đã chuẩn bị 65%. Còn kiểm tra phần mềm và cấu hình tài khoản."
                            : "Đã rà soát các hạng mục ban đầu.");
        }
        provisionLeadership();
    }

    private void provisionLeadership() {
        if (users.existsByUsernameAndDeletedFalse("giamdoc.web")) return;
        UUID admin =
                db.queryForObject("SELECT id FROM users WHERE username='admin.web'", UUID.class);
        User leader =
                user(
                        "giamdoc.web",
                        "Lãnh đạo · dữ liệu thực hành",
                        null,
                        "EMPLOYEE",
                        encoder.encode(password));
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability,granted_by) VALUES"
                        + " (?,'EXECUTIVE',?),(?,'PAYROLL_APPROVE',?)",
                leader.getId(),
                admin,
                leader.getId(),
                admin);
        for (UUID dept :
                db.queryForList(
                        "SELECT id FROM departments WHERE is_active AND NOT is_deleted",
                        UUID.class))
            db.update(
                    "INSERT INTO department_authority(department_id,executive_id,reason,changed_by)"
                            + " VALUES (?,?,?,?) ON CONFLICT(department_id) DO NOTHING",
                    dept,
                    leader.getId(),
                    "Cấu hình công ty thực hành; không phải dữ liệu doanh nghiệp thật",
                    admin);
        db.update(
                "UPDATE users SET email_verified_at=now() WHERE email LIKE '%@anphat.example' AND"
                        + " email_verified_at IS NULL");
    }

    private User user(String username, String name, UUID department, String role, String hash) {
        User u = User.create(UUID.randomUUID(), username, username + "@anphat.example", hash, name);
        u.updateDepartmentId(department);
        u.lock();
        u.unlock();
        users.saveAndFlush(u);
        userRoles.saveAndFlush(
                new UserRole(
                        u.getId(),
                        roles.findByCode(role).orElseThrow().getId(),
                        Instant.now(),
                        null));
        return u;
    }
}
