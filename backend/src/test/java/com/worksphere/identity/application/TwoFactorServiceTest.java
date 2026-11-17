package com.worksphere.identity.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

class TwoFactorServiceTest {
    @Test
    void matchesPublishedRfc4226HmacSha1CounterVectors() {
        String secret =
                TwoFactorService.base32("12345678901234567890".getBytes(StandardCharsets.US_ASCII));
        assertThat(secret).isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        assertThat(TwoFactorService.totp(secret, 0)).isEqualTo("755224");
        assertThat(TwoFactorService.totp(secret, 1)).isEqualTo("287082");
        assertThat(TwoFactorService.totp(secret, 2)).isEqualTo("359152");
    }
}
