package com.worksphere.identity.application;

import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.security.*;
import java.time.Instant;
import java.util.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
@Transactional
public class TwoFactorService {
    private final JdbcTemplate db;
    private final RecoveryService secrets;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    public TwoFactorService(JdbcTemplate db, RecoveryService secrets, PasswordEncoder encoder) {
        this.db = db;
        this.secrets = secrets;
        this.encoder = encoder;
    }

    public record Input(String password, String code) {}

    private void password(UUID user, String raw) {
        if (raw == null
                || !encoder.matches(
                        raw,
                        db.queryForObject(
                                "SELECT password_hash FROM users WHERE id=? AND status='ACTIVE' AND"
                                        + " NOT is_deleted FOR UPDATE",
                                String.class,
                                user)))
            throw new BusinessRuleException(
                    "CURRENT_PASSWORD_INCORRECT", "Mật khẩu hiện tại chưa đúng");
    }

    public Map<String, Object> status(UUID user) {
        return Map.of(
                "enabled",
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM identity_totp WHERE user_id=? AND enabled)",
                        Boolean.class,
                        user));
    }

    public Map<String, Object> setup(WorkSphereUserPrincipal p, Input input) {
        UUID user = p.userId();
        password(user, input.password());
        if (Boolean.TRUE.equals(status(user).get("enabled")))
            throw new BusinessRuleException("MFA_ENABLED", "Đã bật xác thực hai bước");
        byte[] key = new byte[20];
        random.nextBytes(key);
        String secret = base32(key);
        db.update(
                "INSERT INTO identity_totp(user_id,secret_cipher,setup_expires_at) VALUES"
                    + " (?,?,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET"
                    + " secret_cipher=excluded.secret_cipher,setup_expires_at=excluded.setup_expires_at,last_step=-1,recovery_hashes=''",
                user,
                secrets.encrypt(secret));
        return Map.of("secret", secret, "issuer", "WorkSphere", "expiresMinutes", 10);
    }

    public Map<String, Object> enable(WorkSphereUserPrincipal p, Input input) {
        UUID user = p.userId();
        password(user, input.password());
        var row = db.queryForMap("SELECT * FROM identity_totp WHERE user_id=? FOR UPDATE", user);
        if (Boolean.TRUE.equals(row.get("enabled"))
                || row.get("setup_expires_at") == null
                || !((java.sql.Timestamp) row.get("setup_expires_at"))
                        .toInstant()
                        .isAfter(Instant.now()))
            throw new BusinessRuleException("MFA_SETUP_EXPIRED", "Hãy tạo thiết lập mới");
        long step = validStep(secrets.decrypt((String) row.get("secret_cipher")), input.code());
        if (step < 0) throw new BusinessRuleException("MFA_INVALID", "Mã xác thực chưa đúng");
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            byte[] b = new byte[12];
            random.nextBytes(b);
            codes.add(HexFormat.of().formatHex(b));
        }
        String hashes =
                codes.stream().map(secrets::hash).collect(java.util.stream.Collectors.joining(","));
        db.update(
                "UPDATE identity_totp SET"
                        + " enabled=true,setup_expires_at=NULL,last_step=?,recovery_hashes=? WHERE"
                        + " user_id=?",
                step,
                hashes,
                user);
        audit(user, "MFA_ENABLED");
        return Map.of("recoveryCodes", codes);
    }

    public void verify(UUID user, String code) {
        db.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", user);
        var rows = db.queryForList("SELECT * FROM identity_totp WHERE user_id=? FOR UPDATE", user);
        if (rows.isEmpty() || !Boolean.TRUE.equals(rows.getFirst().get("enabled"))) return;
        var row = rows.getFirst();
        if (code == null || code.isBlank())
            throw new BusinessRuleException(
                    "MFA_REQUIRED", "Nhập mã ứng dụng xác thực hoặc mã dự phòng");
        String hash = secrets.hash(code.trim());
        List<String> hashes =
                new ArrayList<>(Arrays.asList(((String) row.get("recovery_hashes")).split(",")));
        if (hashes.remove(hash)) {
            db.update(
                    "UPDATE identity_totp SET recovery_hashes=? WHERE user_id=?",
                    String.join(",", hashes),
                    user);
            audit(user, "MFA_RECOVERY_USED");
            return;
        }
        long step = validStep(secrets.decrypt((String) row.get("secret_cipher")), code);
        if (step < 0 || step <= ((Number) row.get("last_step")).longValue())
            throw new BusinessRuleException("MFA_INVALID", "Mã sai, hết hạn hoặc đã sử dụng");
        db.update("UPDATE identity_totp SET last_step=? WHERE user_id=?", step, user);
    }

    public void disable(WorkSphereUserPrincipal p, Input input) {
        password(p.userId(), input.password());
        verify(p.userId(), input.code());
        db.update("DELETE FROM identity_totp WHERE user_id=?", p.userId());
        db.update(
                "UPDATE login_sessions SET status='REVOKED',updated_at=now() WHERE user_id=? AND"
                        + " status='ACTIVE'",
                p.userId());
        db.update(
                "UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL",
                p.userId());
        audit(p.userId(), "MFA_DISABLED");
    }

    private void audit(UUID user, String type) {
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                user,
                user,
                type,
                "Thay đổi xác thực hai bước của chủ tài khoản");
    }

    static String base32(byte[] bytes) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder out = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : bytes) {
            buffer = (buffer << 8) | (b & 255);
            bits += 8;
            while (bits >= 5) {
                out.append(chars.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) out.append(chars.charAt((buffer << (5 - bits)) & 31));
        return out.toString();
    }

    static String totp(String secret, long step) {
        try {
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            var out = new java.io.ByteArrayOutputStream();
            int buffer = 0, bits = 0;
            for (char c : secret.toCharArray()) {
                int x = chars.indexOf(c);
                if (x < 0) throw new IllegalArgumentException();
                buffer = (buffer << 5) | x;
                bits += 5;
                if (bits >= 8) {
                    out.write((buffer >> (bits - 8)) & 255);
                    bits -= 8;
                }
            }
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(out.toByteArray(), "HmacSHA1"));
            byte[] h = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int at = h[h.length - 1] & 15;
            int n =
                    ((h[at] & 127) << 24)
                            | ((h[at + 1] & 255) << 16)
                            | ((h[at + 2] & 255) << 8)
                            | (h[at + 3] & 255);
            return String.format(Locale.ROOT, "%06d", n % 1000000);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private long validStep(String secret, String code) {
        if (code == null || !code.matches("[0-9]{6}")) return -1;
        long now = Instant.now().getEpochSecond() / 30;
        for (long n = now - 1; n <= now + 1; n++)
            if (MessageDigest.isEqual(
                    totp(secret, n).getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                    code.getBytes(java.nio.charset.StandardCharsets.US_ASCII))) return n;
        return -1;
    }
}
