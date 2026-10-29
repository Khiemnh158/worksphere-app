import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { AppButton } from './AppButton';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  loading?: boolean;
  testID?: string;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  isDanger = false,
  loading = false,
  testID,
}: ConfirmationDialogProps) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID ?? 'confirmation-dialog'}
    >
      <View style={styles.scrim}>
        <View
          accessible={true}
          accessibilityRole="alert"
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.large,
              padding: theme.spacing.lg,
              borderColor: theme.colors.border,
              ...theme.shadows.level4,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading2,
              { color: theme.colors.textPrimary },
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>

          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.sm,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            {message}
          </Text>

          <View style={[styles.actionsRow, { gap: theme.spacing.sm }]}>
            <View style={styles.actionButtonWrapper}>
              <AppButton
                title={cancelText}
                onPress={onCancel}
                variant="secondary"
                disabled={loading}
                testID={testID ? `${testID}-cancel-btn` : 'dialog-cancel-btn'}
              />
            </View>
            <View style={styles.actionButtonWrapper}>
              <AppButton
                title={confirmText}
                onPress={onConfirm}
                variant={isDanger ? 'danger' : 'primary'}
                loading={loading}
                testID={testID ? `${testID}-confirm-btn` : 'dialog-confirm-btn'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButtonWrapper: {
    flex: 1,
  },
});
