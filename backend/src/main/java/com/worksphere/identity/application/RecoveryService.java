package com.worksphere.identity.application;

import com.worksphere.shared.exception.BusinessRuleException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

import javax.crypto.*;
import javax.crypto.spec.*;

@Service
@Transactional
public class RecoveryService {
    @org.springframework.beans.factory.annotation.Autowired private IdentityRateLimiter rate;
    private final JdbcTemplate db;
    private final PasswordEncoder encoder;
    private final byte[] key;
    private final String publicUrl;
    private final SecureRandom random = new SecureRandom();

    public RecoveryService(
            JdbcTemplate db,
            PasswordEncoder encoder,
            @Value("${worksphere.jwt.secret}") String secret,
            @Value("${worksphere.public-url:http://127.0.0.1:18110}") String publicUrl) {
        this.db = db;
        this.encoder = encoder;
        this.key = digest(secret);
        this.publicUrl = publicUrl;
    }

    private byte[] digest(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public String hash(String s) {
        return HexFormat.of().formatHex(digest(s));
    }

    public String encrypt(String s) {
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            var cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(128, iv));
            byte[] data = cipher.doFinal(s.getBytes(StandardCharsets.UTF_8));
            byte[] result = new byte[iv.length + data.length];
            System.arraycopy(iv, 0, result, 0, 12);
            System.arraycopy(data, 0, result, 12, data.length);
            return Base64.getEncoder().encodeToString(result);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public String decrypt(String s) {
        try {
            byte[] all = Base64.getDecoder().decode(s);
            var c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(
                    Cipher.DECRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(128, Arrays.copyOf(all, 12)));
            return new String(
                    c.doFinal(Arrays.copyOfRange(all, 12, all.length)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Không đọc được thư mã hóa", e);
        }
    }

    public void mail(String email, String subject, String body, Instant expires) {
        db.update(
                "INSERT INTO mail_outbox(id,recipient,subject,encrypted_body,expires_at) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                email,
                subject,
                encrypt(body),
                java.sql.Timestamp.from(expires));
    }

    public void issue(UUID user, String purpose) {
        var u = db.queryForMap("SELECT * FROM users WHERE id=? FOR UPDATE", user);
        String expected = purpose.equals("ACTIVATE") ? "PENDING" : "ACTIVE";
        if (!expected.equals(u.get("status"))
                || Boolean.TRUE.equals(u.get("is_deleted"))
                || u.get("access_ends_at") != null
                        && !((java.sql.Timestamp) u.get("access_ends_at"))
                                .toInstant()
                                .isAfter(Instant.now())) return;
        if (purpose.equals("RESET") && u.get("email_verified_at") == null) return;
        db.update(
                "UPDATE account_recovery_tokens SET used_at=now() WHERE user_id=? AND used_at IS"
                        + " NULL",
                user);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant until = Instant.now().plusSeconds(purpose.equals("ACTIVATE") ? 86400 : 900);
        db.update(
                "INSERT INTO account_recovery_tokens(id,user_id,purpose,token_hash,expires_at)"
                        + " VALUES (?,?,?,?,?)",
                UUID.randomUUID(),
                user,
                purpose,
                hash(token),
                java.sql.Timestamp.from(until));
        mail(
                (String) u.get("email"),
                purpose.equals("ACTIVATE")
                        ? "WorkSphere · Kích hoạt tài khoản"
                        : "WorkSphere · Đặt lại mật khẩu",
                publicUrl
                        + "/#"
                        + (purpose.equals("ACTIVATE") ? "activate" : "reset")
                        + "/"
                        + token
                        + "\n"
                        + "Liên kết dùng một lần. Không chia sẻ liên kết. Nếu không yêu cầu, hãy bỏ"
                        + " qua thư này.",
                until);
    }

    public void forgot(String email) {
        if (!rate.allowed("forgot", Objects.toString(email, ""), 5)) return;
        var rows =
                db.queryForList(
                        "SELECT id FROM users WHERE lower(email)=lower(?) AND status='ACTIVE' AND"
                                + " NOT is_deleted",
                        email == null ? "" : email.trim());
        if (!rows.isEmpty()) issue((UUID) rows.getFirst().get("id"), "RESET");
    }

    public record Complete(
            String token,
            String password,
            String confirmPassword,
            String username,
            String fullName,
            String phoneNumber) {}

    public void complete(Complete input, String purpose) {
        if (input.token() == null
                || input.token().length() > 200
                || input.password() == null
                || input.password().length() < 12
                || input.password().length() > 128
                || input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
                || !input.password().equals(input.confirmPassword()))
            throw bad(
                    "Liên kết không hợp lệ hoặc mật khẩu cần từ 12 ký tự, tối đa 72 byte và trùng"
                            + " xác nhận");
        var tokens =
                db.queryForList(
                        "SELECT * FROM account_recovery_tokens WHERE token_hash=? AND purpose=? FOR"
                                + " UPDATE",
                        hash(input.token()),
                        purpose);
        if (tokens.isEmpty()) throw bad("Liên kết không hợp lệ");
        var t = tokens.getFirst();
        if (t.get("used_at") != null
                || !((java.sql.Timestamp) t.get("expires_at")).toInstant().isAfter(Instant.now()))
            throw bad("Liên kết đã dùng hoặc hết hạn");
        UUID user = (UUID) t.get("user_id");
        var u = db.queryForMap("SELECT * FROM users WHERE id=? FOR UPDATE", user);
        if (Boolean.TRUE.equals(u.get("is_deleted"))
                || !Objects.equals(
                        u.get("status"), purpose.equals("ACTIVATE") ? "PENDING" : "ACTIVE")
                || (u.get("access_ends_at") != null
                        && !((java.sql.Timestamp) u.get("access_ends_at"))
                                .toInstant()
                                .isAfter(Instant.now())))
            throw bad("Tài khoản không thể khôi phục, liên hệ đầu mối quản trị");
        if (purpose.equals("ACTIVATE")) {
            String username =
                    input.username() == null || input.username().isBlank()
                            ? (String) u.get("username")
                            : input.username().trim();
            String name = input.fullName() == null ? "" : input.fullName().trim();
            if (!username.matches("[A-Za-z0-9._-]{3,50}")
                    || name.isEmpty()
                    || name.length() > 150
                    || (input.phoneNumber() != null
                            && !input.phoneNumber().isBlank()
                            && !input.phoneNumber().matches("[+0-9 ()-]{7,20}")))
                throw bad("Tên đăng nhập, họ tên hoặc số liên hệ không hợp lệ");
            if (db.queryForObject(
                            "SELECT count(*) FROM users WHERE lower(username)=lower(?) AND id<>?",
                            Integer.class,
                            username,
                            user)
                    > 0) throw bad("Tên đăng nhập đã được sử dụng");
            db.update(
                    "UPDATE users SET"
                        + " username=?,full_name=?,phone_number=?,status='ACTIVE',activation_required=false,email_verified_at=now()"
                        + " WHERE id=?",
                    username,
                    name,
                    input.phoneNumber(),
                    user);
        }
        db.update(
                "UPDATE users SET"
                    + " password_hash=?,password_changed_at=now(),updated_at=now(),version=version+1"
                    + " WHERE id=?",
                encoder.encode(input.password()),
                user);
        db.update(
                "UPDATE account_recovery_tokens SET used_at=now() WHERE user_id=? AND used_at IS"
                        + " NULL",
                user);
        db.update(
                "UPDATE login_sessions SET status='REVOKED',updated_at=now() WHERE user_id=? AND"
                        + " status='ACTIVE'",
                user);
        db.update(
                "UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL",
                user);
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                user,
                user,
                "ACCOUNT_" + purpose,
                "Chủ tài khoản xác minh email và đặt mật khẩu; các phiên cũ đã thu hồi");
        mail(
                (String) u.get("email"),
                "WorkSphere · Bảo mật tài khoản",
                "Mật khẩu đã được đặt lại/kích hoạt. Nếu không phải bạn, hãy liên hệ đầu mối quản"
                        + " trị.",
                Instant.now().plusSeconds(86400));
    }

    private BusinessRuleException bad(String m) {
        return new BusinessRuleException("RECOVERY_INVALID", m);
    }
}
