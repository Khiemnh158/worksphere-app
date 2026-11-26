package com.worksphere.identity;

import com.worksphere.identity.api.request.LoginRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRequestValidationTest {
    @Test
    void existingShortPasswordReachesAuthenticationInsteadOfApplyingCreationPolicy() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(new LoginRequest("fixture", "x", "JUnit")))
                    .isEmpty();
        }
    }

    @Test
    void blankAndOversizedPasswordsAreRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String password : List.of("", " ", "x".repeat(129))) {
                assertThat(validator.validate(new LoginRequest("fixture", password, "JUnit")))
                        .anyMatch(violation -> violation.getPropertyPath().toString().equals("password"));
            }
        }
    }

    @Test
    void missingOrOversizedLoginIdentifierIsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String login : List.of("", " ", "x".repeat(256))) {
                assertThat(validator.validate(new LoginRequest(login, "fixture-password", "JUnit")))
                        .anyMatch(violation -> violation.getPropertyPath().toString().equals("login"));
            }
        }
    }
}
