package com.worksphere.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * JWT service for signing and parsing access tokens.
 * Uses HMAC-SHA256 (HS256) signing algorithm.
 * Secret must be at least 256 bits (32 chars). Configured via environment variable.
 * Never logs token content.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey secretKey;
    private final long accessTokenExpirySeconds;

    public JwtService(
            @Value("${worksphere.jwt.secret}") String secret,
            @Value("${worksphere.jwt.access-token-expiry-seconds:900}") long accessTokenExpirySeconds
    ) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirySeconds = accessTokenExpirySeconds;
    }

    /**
     * Generates a signed JWT access token.
     * Embeds userId and sessionId as claims.
     */
    public String generateAccessToken(UUID userId, UUID sessionId) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpirySeconds);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("sessionId", sessionId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validates and parses an access token.
     * Returns the Claims if valid.
     * Throws JwtAuthenticationException if invalid or expired.
     */
    public Claims validateAndParseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            throw new JwtAuthenticationException("ACCESS_TOKEN_EXPIRED", "Access token đã hết hạn");
        } catch (JwtException ex) {
            log.debug("JWT validation failed: {}", ex.getClass().getSimpleName());
            throw new JwtAuthenticationException("ACCESS_TOKEN_INVALID", "Access token không hợp lệ");
        }
    }

    public long getAccessTokenExpirySeconds() {
        return accessTokenExpirySeconds;
    }
}
