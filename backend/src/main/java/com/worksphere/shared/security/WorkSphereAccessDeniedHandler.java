package com.worksphere.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a proper JSON 403 response instead of the default redirect.
 */
@Component
public class WorkSphereAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public WorkSphereAccessDeniedHandler() {
        this.objectMapper = createDefaultObjectMapper();
    }

    public WorkSphereAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : createDefaultObjectMapper();
    }

    private static ObjectMapper createDefaultObjectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.error("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này")
        );
    }
}
