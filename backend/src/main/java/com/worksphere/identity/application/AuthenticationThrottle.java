package com.worksphere.identity.application;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Server-side IP rate windows; does not trust client forwarded headers. */
@Component
public class AuthenticationThrottle extends OncePerRequestFilter {
    private final JdbcTemplate db;
    private final RecoveryService recovery;

    public AuthenticationThrottle(JdbcTemplate db, RecoveryService recovery) {
        this.db = db;
        this.recovery = recovery;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (req.getMethod().equals("POST")
                && req.getRequestURI().startsWith("/api/v1/auth/")
                && !req.getRequestURI().endsWith("logout")
                && !req.getRequestURI().endsWith("logout-all")
                && !req.getRequestURI().endsWith("refresh")) {
            String bucket = recovery.hash(req.getRemoteAddr() + ":" + req.getRequestURI());
            Integer attempts =
                    db.queryForObject(
                            "INSERT INTO recovery_rate_windows(bucket,window_at,attempts) VALUES"
                                + " (?,now(),1) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE"
                                + " WHEN recovery_rate_windows.window_at<now()-interval '15"
                                + " minutes' THEN 1 ELSE recovery_rate_windows.attempts+1"
                                + " END,window_at=CASE WHEN"
                                + " recovery_rate_windows.window_at<now()-interval '15 minutes'"
                                + " THEN now() ELSE recovery_rate_windows.window_at END RETURNING"
                                + " attempts",
                            Integer.class,
                            bucket);
            if (attempts != null && attempts > 100) {
                res.setStatus(429);
                res.setHeader("Retry-After", "900");
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter()
                        .write(
                                "{\"success\":false,\"message\":\"Quá nhiều lần thử. Vui lòng thử"
                                        + " lại sau.\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
