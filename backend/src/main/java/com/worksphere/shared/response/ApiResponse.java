package com.worksphere.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Standard API response wrapper for all WorkSphere API responses.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String code,
        String message,
        Object fieldErrors,
        Instant timestamp,
        String traceId
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null, null, Instant.now(), null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, null, message, null, Instant.now(), null);
    }

    public static <T> ApiResponse<T> successNoContent(String message) {
        return new ApiResponse<>(true, null, null, message, null, Instant.now(), null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, code, message, null, Instant.now(), null);
    }

    public static <T> ApiResponse<T> error(String code, String message, Object fieldErrors) {
        return new ApiResponse<>(false, null, code, message, fieldErrors, Instant.now(), null);
    }
}
