package com.worksphere.identity.application;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class IdentityRateLimiter {
    private final JdbcTemplate db;

    public IdentityRateLimiter(JdbcTemplate db) {
        this.db = db;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean allowed(String scope, String value, int limit) {
        String bucket;
        try {
            bucket =
                    scope
                            + ":"
                            + HexFormat.of()
                                    .formatHex(
                                            MessageDigest.getInstance("SHA-256")
                                                    .digest(
                                                            value.toLowerCase(java.util.Locale.ROOT)
                                                                    .trim()
                                                                    .getBytes(
                                                                            StandardCharsets
                                                                                    .UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        Integer n =
                db.queryForObject(
                        "INSERT INTO recovery_rate_windows(bucket,window_at,attempts) VALUES"
                            + " (?,now(),1) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN"
                            + " recovery_rate_windows.window_at<now()-interval '15 minutes' THEN 1"
                            + " ELSE recovery_rate_windows.attempts+1 END,window_at=CASE WHEN"
                            + " recovery_rate_windows.window_at<now()-interval '15 minutes' THEN"
                            + " now() ELSE recovery_rate_windows.window_at END RETURNING attempts",
                        Integer.class,
                        bucket);
        return n != null && n <= limit;
    }
}
