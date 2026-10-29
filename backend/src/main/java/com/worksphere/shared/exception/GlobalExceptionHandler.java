package com.worksphere.shared.exception;

import com.worksphere.shared.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler that converts exceptions to standard API error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (first, second) -> first
                ));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", "Dữ liệu không hợp lệ", fieldErrors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang."));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleException ex) {
        HttpStatus status = switch (ex.getCode()) {
            case "FILE_TOO_LARGE" -> HttpStatus.PAYLOAD_TOO_LARGE;
            case "FILE_TYPE_NOT_ALLOWED" -> HttpStatus.UNSUPPORTED_MEDIA_TYPE;
            case "FILE_ACCESS_DENIED", "SERVICE_RESOLUTION_REJECTION_FORBIDDEN",
                 "SERVICE_RATING_FORBIDDEN", "SERVICE_REQUEST_ACCESS_DENIED",
                 "ASSET_ACCESS_DENIED" -> HttpStatus.FORBIDDEN;
            case "FILE_EMPTY", "FILE_EXTENSION_NOT_ALLOWED", "BAD_REQUEST",
                 "SERVICE_CATEGORY_PARENT_INVALID", "SERVICE_CATEGORY_CYCLE_DETECTED",
                 "SERVICE_CATEGORY_ALREADY_INACTIVE", "SERVICE_CATEGORY_ALREADY_ACTIVE",
                 "SERVICE_CATEGORY_IN_USE", "SERVICE_STATUS_TRANSITION_INVALID",
                 "SERVICE_ASSIGNEE_REQUIRED", "SERVICE_RESOLUTION_REQUIRED",
                 "SERVICE_ALREADY_CLOSED", "SERVICE_ALREADY_CANCELLED",
                 "SERVICE_NOT_RESOLVED", "SERVICE_NOT_CLOSED", "USER_INACTIVE", "USER_NOT_ACTIVE",
                 "INVALID_REQUEST_STATE",
                 "ASSET_NOT_AVAILABLE", "ASSET_ALREADY_ASSIGNED",
                 "ASSET_ASSIGNMENT_NOT_ACTIVE", "ASSET_STATUS_TRANSITION_INVALID",
                 "ASSET_RETIRED", "ASSET_IN_MAINTENANCE", "ASSET_BROKEN",
                 "ASSET_CATEGORY_IN_USE", "ASSET_CATEGORY_ALREADY_ACTIVE",
                 "ASSET_CATEGORY_ALREADY_INACTIVE",
                 "NOTIFICATION_TYPE_INVALID", "NOTIFICATION_PREFERENCE_DUPLICATE_TYPE" -> HttpStatus.BAD_REQUEST;
            case "FILE_NOT_FOUND", "SERVICE_REQUEST_NOT_FOUND", "SERVICE_CATEGORY_NOT_FOUND",
                 "USER_NOT_FOUND", "ASSET_NOT_FOUND", "ASSET_CATEGORY_NOT_FOUND",
                 "ASSET_ASSIGNMENT_NOT_FOUND", "ASSET_REPAIR_HISTORY_NOT_FOUND",
                 "NOTIFICATION_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "SERVICE_CATEGORY_CODE_ALREADY_EXISTS", "SERVICE_ASSIGNMENT_CONFLICT",
                 "SERVICE_RATING_ALREADY_EXISTS", "OPTIMISTIC_LOCK_CONFLICT",
                 "ASSET_CODE_ALREADY_EXISTS", "ASSET_SERIAL_ALREADY_EXISTS",
                 "ASSET_ASSIGNMENT_CONFLICT", "ASSET_CATEGORY_CODE_ALREADY_EXISTS" -> HttpStatus.CONFLICT;
            default -> HttpStatus.UNPROCESSABLE_ENTITY;
        };
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ex.getCode(), ex.getMessage()));
    }


    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error("METHOD_NOT_ALLOWED", "Phương thức HTTP không được hỗ trợ"));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("RESOURCE_NOT_FOUND", "Không tìm thấy tài nguyên yêu cầu"));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSizeExceeded(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("FILE_TOO_LARGE", "Dung lượng tệp vượt quá giới hạn cho phép"));
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaTypeNotSupported(org.springframework.web.HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(ApiResponse.error("FILE_TYPE_NOT_ALLOWED", "Loại nội dung không được hỗ trợ"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("INVALID_CREDENTIALS", "Thông tin đăng nhập không chính xác"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống"));
    }
}
