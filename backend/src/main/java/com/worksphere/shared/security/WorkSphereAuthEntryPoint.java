package com.worksphere.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a proper JSON 401 response instead of the default redirect.
 */
@Component
public class WorkSphereAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public WorkSphereAuthEntryPoint() {
        this.objectMapper = createDefaultObjectMapper();
    }

    public WorkSphereAuthEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : createDefaultObjectMapper();
    }

    private static ObjectMapper createDefaultObjectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.error("UNAUTHORIZED", "Yêu cầu xác thực")
        );
    }
}
