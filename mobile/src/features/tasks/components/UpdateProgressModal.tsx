/**
 * Phase 15E: Update Progress Modal (SCR-TSK-08)
 * Modal enabling task progress percentage update.
 *
 * Invariants & Correctness Guarantees:
 * - Bounds: 0.0 <= progressPercent <= 100.0 (enforced client-side, matching Task.java).
 * - Decimal precision: supports floating point percentages (e.g. 75.5%) without forced truncation.
 * - Quick-presets: 0%, 25%, 50%, 75%, 100% for rapid mobile touch interaction.
 * - Synchronous submit lock prevents duplicate requests.
 * - Accessibility: touch targets >= 48dp.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { AppButton } from '../../../shared/components/AppButton';

export interface UpdateProgressModalProps {
  visible: boolean;
  currentProgress: number;
  onConfirm: (progressPercent: number) => Promise<void> | void;
  onClose: () => void;
  submitting?: boolean;
  testID?: string;
}

const PRESET_PERCENTAGES = [0, 25, 50, 75, 100];

export function UpdateProgressModal({
  visible,
  currentProgress,
  onConfirm,
  onClose,
  submitting = false,
  testID = 'update-progress-modal',
}: UpdateProgressModalProps) {
  const theme = useAppTheme();

  const [progressInput, setProgressInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (visible) {
      setProgressInput(String(currentProgress ?? 0));
      setErrorMessage(null);
      submittingRef.current = false;
    }
  }, [visible, currentProgress]);

  const validateProgress = (valStr: string): number | null => {
    const trimmed = valStr.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập phần trăm tiến độ.');
      return null;
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      setErrorMessage('Tiến độ phải là một con số hợp lệ.');
      return null;
    }

    if (num < 0 || num > 100) {
      setErrorMessage('Tiến độ phải nằm trong khoảng từ 0 đến 100%.');
      return null;
    }

    setErrorMessage(null);
    return num;
  };

  const handleSubmit = async () => {
    if (submittingRef.current || submitting) {
      return;
    }

    const validNum = validateProgress(progressInput);
    if (validNum === null) {
      return;
    }

    submittingRef.current = true;

    try {
      await onConfirm(validNum);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleSelectPreset = (preset: number) => {
    setProgressInput(String(preset));
    setErrorMessage(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text
              style={[
                theme.typography.heading3,
                styles.headerTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Cập nhật tiến độ công việc
            </Text>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="btn-close-progress-modal"
              accessibilityRole="button"
              accessibilityLabel="Đóng modal"
            >
              <Text style={[styles.closeIcon, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Input Label */}
            <Text
              style={[
                theme.typography.caption,
                styles.sectionLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Phần trăm hoàn thành (0 - 100%):
            </Text>

            {/* Numeric Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={progressInput}
                onChangeText={text => {
                  setProgressInput(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="numeric"
                placeholder="Nhập tiến độ (0 - 100)"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                style={[
                  styles.progressInput,
                  {
                    borderColor: errorMessage ? theme.colors.error : theme.colors.border,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                testID="input-task-progress"
                accessibilityLabel="Tiến độ công việc theo phần trăm"
              />
              <Text style={[styles.percentSign, { color: theme.colors.textPrimary }]}>%</Text>
            </View>

            {/* Preset Buttons */}
            <Text
              style={[
                theme.typography.caption,
                styles.presetLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Chọn nhanh:
            </Text>
            <View style={styles.presetsRow}>
              {PRESET_PERCENTAGES.map(preset => {
                const isSelected = progressInput.trim() === String(preset);
                return (
                  <Pressable
                    key={preset}
                    onPress={() => handleSelectPreset(preset)}
                    disabled={submitting}
                    style={({ pressed }) => [
                      styles.presetButton,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : pressed
                          ? theme.colors.surfaceVariant
                          : theme.colors.background,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${preset} phần trăm`}
                    testID={`preset-progress-${preset}`}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        styles.presetButtonText,
                        isSelected ? styles.presetTextBold : styles.presetTextMedium,
                        {
                          color: isSelected
                            ? theme.colors.onPrimary
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      {preset}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
                testID="update-progress-error"
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.error },
                  ]}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <AppButton
              title="Hủy"
              onPress={onClose}
              variant="outline"
              disabled={submitting}
              testID="btn-cancel-progress"
              style={styles.footerButton}
            />
            <AppButton
              title={submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              testID="btn-confirm-progress"
              style={styles.footerButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    marginTop: 12,
  },
  bodyContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    minHeight: 48,
  },
  percentSign: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  presetLabel: {
    marginBottom: 8,
    fontSize: 13,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 13,
  },
  presetTextBold: {
    fontWeight: '700',
  },
  presetTextMedium: {
    fontWeight: '500',
  },
  errorBanner: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerButton: {
    minWidth: 100,
  },
});
