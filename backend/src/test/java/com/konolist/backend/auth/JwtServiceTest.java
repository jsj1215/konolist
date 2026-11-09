package com.konolist.backend.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final long EXPIRATION_MS = 60_000;

    @Test
    void 시크릿이_비어있으면_시작_실패() {
        assertThatThrownBy(() -> new JwtService("", EXPIRATION_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
        assertThatThrownBy(() -> new JwtService(null, EXPIRATION_MS))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void 시크릿이_32바이트_미만이면_시작_실패() {
        assertThatThrownBy(() -> new JwtService("short-secret-1234567890", EXPIRATION_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32바이트");
    }

    @Test
    void 예시_시크릿이면_시작_실패() {
        assertThatThrownBy(() -> new JwtService("change-me-in-production-must-be-at-least-256-bits", EXPIRATION_MS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("change-me");
    }

    @Test
    void 충분히_긴_시크릿이면_토큰_발급과_검증() {
        JwtService jwtService = new JwtService("a-strong-secret-for-tests-0123456789abcdef", EXPIRATION_MS);
        String token = jwtService.generateToken(1L, "user@test.com");

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.getEmail(token)).isEqualTo("user@test.com");
    }
}
