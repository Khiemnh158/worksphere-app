package com.worksphere.workplace;

import com.worksphere.shared.exception.BusinessRuleException;

import java.net.InetAddress;
import java.time.*;
import java.util.*;

/** Pure calculations: server timestamps, literal IP networks, no client clock or DNS lookup. */
public final class AttendanceRules {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private AttendanceRules() {}

    private static BusinessRuleException bad(String message) {
        return new BusinessRuleException("ATTENDANCE_POLICY_INVALID", message);
    }

    public static byte[] literal(String value) {
        try {
            if (value == null || value.length() > 64) throw new IllegalArgumentException();
            if (value.contains(":")) {
                if (!value.matches("[0-9a-fA-F:]+")) throw new IllegalArgumentException();
            } else {
                String[] parts = value.split("\\.", -1);
                if (parts.length != 4) throw new IllegalArgumentException();
                for (String part : parts)
                    if (!part.matches("0|[1-9][0-9]{0,2}") || Integer.parseInt(part) > 255)
                        throw new IllegalArgumentException();
            }
            return InetAddress.getByName(value).getAddress();
        } catch (Exception e) {
            throw bad("Địa chỉ mạng cần là IPv4/IPv6 dạng số, không phải tên miền");
        }
    }

    public static String normalizeNetworks(String value) {
        if (value == null || value.isBlank()) return "";
        if (value.length() > 2048) throw bad("Danh sách mạng quá dài");
        List<String> result = new ArrayList<>();
        for (String item : value.split("[,\\s]+")) {
            String[] pair = item.split("/", -1);
            byte[] address = literal(pair[0]);
            int prefix = address.length * 8;
            try {
                if (pair.length == 2) prefix = Integer.parseInt(pair[1]);
                else if (pair.length != 1) throw new IllegalArgumentException();
            } catch (Exception e) {
                throw bad("CIDR chưa hợp lệ");
            }
            if (prefix < 1 || prefix > address.length * 8)
                throw bad("CIDR phải giới hạn một mạng cụ thể");
            result.add(pair[0] + "/" + prefix);
            if (result.size() > 32) throw bad("Tối đa 32 mạng cho một điểm");
        }
        return String.join(",", result);
    }

    public static String networkStatus(String peer, String networks) {
        if (networks == null || networks.isBlank()) return "UNCONFIGURED";
        byte[] candidate;
        try {
            candidate = literal(peer);
        } catch (BusinessRuleException e) {
            return "MISMATCH";
        }
        for (String entry : networks.split(",")) {
            String[] pair = entry.split("/");
            byte[] expected = literal(pair[0]);
            if (expected.length != candidate.length) continue;
            int bits = Integer.parseInt(pair[1]);
            boolean match = true;
            for (int i = 0; i < bits; i++)
                if (((expected[i / 8] ^ candidate[i / 8]) & (1 << (7 - i % 8))) != 0) {
                    match = false;
                    break;
                }
            if (match) return "MATCH";
        }
        return "MISMATCH";
    }

    public static long overlap(Instant from, Instant to, Instant windowStart, Instant windowEnd) {
        Instant left = from.isAfter(windowStart) ? from : windowStart,
                right = to.isBefore(windowEnd) ? to : windowEnd;
        return right.isAfter(left) ? Duration.between(left, right).toMinutes() : 0;
    }

    public static Instant at(LocalDate day, LocalTime time) {
        return day.atTime(time).atZone(ZONE).toInstant();
    }

    public static int regularMinutes(
            LocalDate day,
            Instant in,
            Instant out,
            LocalTime start,
            LocalTime end,
            int maximum,
            int breakMinutes,
            LocalTime breakStart,
            LocalTime breakEnd) {
        if (breakMinutes > 0 && (breakStart == null || breakEnd == null))
            throw bad(
                    "Lịch cũ chưa có khoảng nghỉ cụ thể; người phụ trách cần bổ sung trước khi tính"
                        + " công");
        long work = overlap(in, out, at(day, start), at(day, end));
        if (breakMinutes > 0) work -= overlap(in, out, at(day, breakStart), at(day, breakEnd));
        return (int) Math.max(0, Math.min(maximum, work));
    }

    public static int lateMinutes(LocalDate day, Instant in, LocalTime shiftStart, int grace) {
        return (int) Math.max(0, Duration.between(at(day, shiftStart), in).toMinutes() - grace);
    }

    public static int earlyMinutes(LocalDate day, Instant out, LocalTime shiftEnd) {
        return (int) Math.max(0, Duration.between(out, at(day, shiftEnd)).toMinutes());
    }
}
