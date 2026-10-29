package com.worksphere.shared.security;

/**
 * Exception for JWT authentication failures.
 * Carries a machine-readable code for API response.
 */
public class JwtAuthenticationException extends RuntimeException {

    private final String code;

    public JwtAuthenticationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
