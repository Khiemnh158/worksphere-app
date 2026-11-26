package com.worksphere;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Run against a dedicated PostgreSQL database, never the demonstration database. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "WORKSPHERE_AUTHZ_TEST_JDBC_URL", matches = ".+")
class OpenApiPostgresTest {
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry p) {
        p.add("spring.datasource.url", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_JDBC_URL"));
        p.add("spring.datasource.username", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_USER"));
        p.add("spring.datasource.password", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_PASSWORD"));
        p.add("worksphere.jwt.secret", () -> "openapi-integration-test-key-not-for-production-use");
        p.add("worksphere.dev.e2e-user.enabled", () -> "false");
        p.add("worksphere.web-demo.enabled", () -> "false");
        p.add("worksphere.mail.local-enabled", () -> "false");
        p.add("worksphere.people.scheduling.enabled", () -> "false");
        p.add("worksphere.notification.scheduling.enabled", () -> "false");
    }

    @Autowired private WebApplicationContext context;

    @Test
    void generatesRealControllerSchemasWithGlobalExceptionAdviceAndJwtContract() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String json = mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode spec = new ObjectMapper().readTree(json);
        assertThat(spec.path("openapi").asText()).startsWith("3.");
        assertThat(spec.path("paths").has("/api/v1/workplace/work")).isTrue();
        assertThat(spec.path("paths").has("/api/v1/workplace/attendance/punches")).isTrue();
        assertThat(spec.path("components").path("schemas").has("LoginRequest")).isTrue();
        assertThat(spec.at("/components/securitySchemes/bearerAuth/type").asText()).isEqualTo("http");
        assertThat(spec.at("/components/securitySchemes/bearerAuth/scheme").asText()).isEqualTo("bearer");
        assertThat(spec.path("security").get(0).has("bearerAuth")).isTrue();
        for (String path : new String[]{"login", "refresh", "activate", "forgot-password", "reset-password"}) {
            assertThat(spec.path("paths").path("/api/v1/auth/" + path).path("post").path("security").isEmpty())
                    .as("Public authentication operation %s", path).isTrue();
        }
    }

    @Test
    void swaggerResourcesArePublicButBusinessApisStillRequireAuthentication() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/workplace/work")).andExpect(status().isUnauthorized());
    }
}
