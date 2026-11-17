package com.worksphere.workplace;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.Test;

import java.time.*;

class AttendanceRulesTest {
    private final LocalDate day = LocalDate.of(2030, 5, 6);

    private Instant at(String time) {
        return AttendanceRules.at(day, LocalTime.parse(time));
    }

    private int minutes(String in, String out) {
        return AttendanceRules.regularMinutes(
                day,
                at(in),
                at(out),
                LocalTime.of(8, 0),
                LocalTime.of(17, 0),
                480,
                60,
                LocalTime.of(11, 30),
                LocalTime.of(12, 30));
    }

    @Test
    void halfDaysDeductOnlyBreakActuallyOverlappedAndNeverCreateOvertime() {
        assertThat(minutes("08:00", "11:00")).isEqualTo(180);
        assertThat(minutes("12:30", "17:00")).isEqualTo(270);
        assertThat(minutes("08:00", "12:00")).isEqualTo(210);
        assertThat(minutes("07:00", "20:00")).isEqualTo(480);
        assertThat(minutes("18:00", "20:00")).isZero();
    }

    @Test
    void missingLegacyBreakWindowRequiresConfigurationInsteadOfGuessing() {
        assertThatThrownBy(
                        () ->
                                AttendanceRules.regularMinutes(
                                        day,
                                        at("08:00"),
                                        at("11:00"),
                                        LocalTime.of(8, 0),
                                        LocalTime.of(17, 0),
                                        480,
                                        60,
                                        null,
                                        null))
                .hasMessageContaining("khoảng nghỉ");
    }

    @Test
    void graceAffectsLateFlagOnlyAndEarlyExitUsesServerTimestamp() {
        assertThat(AttendanceRules.lateMinutes(day, at("08:12"), LocalTime.of(8, 0), 5))
                .isEqualTo(7);
        assertThat(AttendanceRules.earlyMinutes(day, at("16:40"), LocalTime.of(17, 0)))
                .isEqualTo(20);
        assertThat(minutes("08:12", "17:00")).isEqualTo(468);
    }

    @Test
    void literalCidrMatchesIpv4Ipv6ButRejectsHostnamesAndAllInternet() {
        String ranges = AttendanceRules.normalizeNetworks("192.0.2.0/24,2001:db8::/32");
        assertThat(AttendanceRules.networkStatus("192.0.2.42", ranges)).isEqualTo("MATCH");
        assertThat(AttendanceRules.networkStatus("192.0.3.42", ranges)).isEqualTo("MISMATCH");
        assertThat(AttendanceRules.networkStatus("2001:db8::5", ranges)).isEqualTo("MATCH");
        assertThat(AttendanceRules.networkStatus("127.0.0.1", "")).isEqualTo("UNCONFIGURED");
        assertThatThrownBy(() -> AttendanceRules.normalizeNetworks("example.com/24"))
                .hasMessageContaining("dạng số");
        assertThatThrownBy(() -> AttendanceRules.normalizeNetworks("0.0.0.0/0"))
                .hasMessageContaining("giới hạn");
    }
}
