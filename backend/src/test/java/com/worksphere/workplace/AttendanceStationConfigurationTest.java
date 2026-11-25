package com.worksphere.workplace;

import com.worksphere.identity.application.RecoveryService;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Date;
import java.sql.Time;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceStationConfigurationTest {
    @Mock private JdbcTemplate db;
    @Mock private WorkplaceService access;
    @Mock private RecoveryService recovery;
    private final UUID actor = UUID.randomUUID();
    private final UUID station = UUID.randomUUID();
    @Mock private WorkSphereUserPrincipal principal;
    private AttendanceStationService service;

    @BeforeEach
    void setUp() {
        service = new AttendanceStationService(db, access, recovery);
        ReflectionTestUtils.setField(service, "clock",
                Clock.fixed(Instant.parse("2026-11-25T02:00:00Z"), ZoneOffset.UTC));
        when(access.actor(principal)).thenReturn(actor);
    }

    @Test
    void stationUpdateRejectsMissingOpeningTimeBeforeWriting() {
        when(db.queryForMap(anyString(), eq(station))).thenReturn(Map.of(
                "closes_at", Time.valueOf("17:00:00")));
        var input = new AttendanceStationService.StationInput("Office", true);
        assertThatThrownBy(() -> service.state(station, input, principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Giờ mở điểm");
        verify(db, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void stationUpdateRejectsMissingClosingTimeBeforeWriting() {
        when(db.queryForMap(anyString(), eq(station))).thenReturn(Map.of(
                "opens_at", Time.valueOf("08:00:00")));
        var input = new AttendanceStationService.StationInput("Office", true);
        assertThatThrownBy(() -> service.state(station, input, principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Giờ mở điểm");
        verify(db, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void todayRejectsPunchWithoutServerTimestamp() {
        when(db.queryForList(startsWith("SELECT * FROM attendance_punches"), eq(actor), any(Date.class)))
                .thenReturn(List.of(Map.of("punch_type", "IN")));
        when(db.queryForList(startsWith("SELECT * FROM work_calendar"), any(Date.class)))
                .thenReturn(List.of(Map.of("day_kind", "NORMAL", "shift_start", Time.valueOf("08:00:00"),
                        "shift_end", Time.valueOf("17:00:00"), "late_grace_minutes", 0)));
        assertThatThrownBy(() -> service.today(principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Dữ liệu thời gian chấm công");
    }
}
