import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export type StatusCategory = 'project' | 'task' | 'serviceRequest' | 'generic';

/**
 * StatusBadge is a cross-domain presentational display component.
 * Boundary notice:
 * - Do NOT use StatusBadge status types as API request/response DTO enums.
 * - API feature types MUST use exact backend enums (e.g. ProjectStatus, TaskStatus, ServiceStatus).
 * - Unknown status fallback is for presentation safety only and does not canonicalize backend values.
 */
export interface StatusBadgeProps {
  status: string;
  label?: string;
  type?: StatusCategory;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const CANONICAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PLANNED: 'Kế hoạch',
  OPEN: 'Mở',
  ASSIGNED: 'Đã phân công',
  ACTIVE: 'Đang thực hiện',
  IN_PROGRESS: 'Đang xử lý',
  IN_REVIEW: 'Đang kiểm tra',
  DONE: 'Đã hoàn thành',
  RESOLVED: 'Đã giải quyết',
  ON_HOLD: 'Tạm dừng',
  WAITING: 'Đang chờ',
  WAITING_FOR_USER: 'Chờ phản hồi',
  PENDING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

const SERVICE_REQUEST_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Mở',
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_FOR_USER: 'Chờ phản hồi',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Đang kiểm tra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function StatusBadge({
  status,
  label,
  type,
  testID,
  style,
}: StatusBadgeProps) {
  const theme = useAppTheme();
  const normalized = status.toUpperCase().trim();

  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    switch (normalized) {
      case 'DRAFT':
      case 'PLANNED':
      case 'OPEN':
        return {
          bg: theme.colors.infoContainer,
          text: theme.colors.info,
          border: theme.colors.info,
        };
      case 'ASSIGNED':
        return {
          bg: theme.colors.primaryContainer,
          text: '#2563EB',
          border: '#2563EB',
        };
      case 'ACTIVE':
      case 'IN_PROGRESS':
      case 'DONE':
      case 'RESOLVED':
        return {
          bg: theme.colors.successContainer,
          text: theme.colors.success,
          border: theme.colors.success,
        };
      case 'ON_HOLD':
      case 'WAITING':
      case 'WAITING_FOR_USER':
      case 'PENDING':
      case 'IN_REVIEW':
        return {
          bg: theme.colors.warningContainer,
          text: theme.colors.warning,
          border: theme.colors.warning,
        };
      case 'COMPLETED':
      case 'CLOSED':
        return {
          bg: theme.colors.successContainer,
          text: '#047857',
          border: '#047857',
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          bg: theme.colors.errorContainer,
          text: theme.colors.error,
          border: theme.colors.error,
        };
      case 'TODO':
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.textSecondary,
          border: theme.colors.border,
        };
      default:
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.textSecondary,
          border: theme.colors.border,
        };
    }
  };

  const colors = getBadgeColors();
  const taskLabel = type === 'task' ? TASK_STATUS_LABELS[normalized] : undefined;
  const srvLabel = type === 'serviceRequest' ? SERVICE_REQUEST_STATUS_LABELS[normalized] : undefined;
  const displayLabel = label ?? taskLabel ?? srvLabel ?? CANONICAL_STATUS_LABELS[normalized] ?? status;

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: theme.radii.small,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        },
        style,
      ]}
      testID={testID ?? `status-badge-${normalized.toLowerCase()}`}
      accessibilityLabel={`Trạng thái: ${displayLabel}`}
    >
      <Text
        style={[
          theme.typography.caption,
          styles.badgeText,
          { color: colors.text },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '500',
  },
});
