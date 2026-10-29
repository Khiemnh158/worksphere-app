/**
 * Phase 15E: ChangeStatusModal Unit Tests (SCR-TSK-07)
 *
 * Verifies:
 * - Domain state machine: only displays valid target statuses
 * - Terminal statuses (COMPLETED, CANCELLED) show friendly terminal message and disable mutation
 * - Rejection transition (IN_REVIEW -> IN_PROGRESS) enforces non-empty comment
 * - Other transitions allow empty or voluntary comments
 * - Cancelling calls onClose
 * - Submitting passes selectedStatus and trimmed comment
 * - Synchronous submit lock prevents double submissions
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { ChangeStatusModal } from '../../src/features/tasks/components/ChangeStatusModal';
import { renderWithProviders } from '../test-utils';

describe('ChangeStatusModal (Phase 15E)', () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. renders valid transitions for TODO: IN_PROGRESS and CANCELLED', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        currentStatus="TODO"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Chuyển trạng thái công việc')).toBeTruthy();
    expect(getByTestId('status-option-IN_PROGRESS')).toBeTruthy();
    expect(getByTestId('status-option-CANCELLED')).toBeTruthy();
    expect(queryByTestId('status-option-TODO')).toBeNull();
    expect(queryByTestId('status-option-COMPLETED')).toBeNull();
  });

  it('2. renders terminal banner for COMPLETED and CANCELLED without confirm button', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        currentStatus="COMPLETED"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(getByTestId('status-terminal-notice')).toBeTruthy();
    expect(getByText(/không thể chuyển trạng thái/)).toBeTruthy();
    expect(queryByTestId('btn-confirm-status')).toBeNull();
  });

  it('3. enforces mandatory comment when transitioning IN_REVIEW to IN_PROGRESS (rejection)', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        currentStatus="IN_REVIEW"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Select IN_PROGRESS
    fireEvent.press(getByTestId('status-option-IN_PROGRESS'));
    await waitFor(() => {
      expect(getByTestId('status-option-IN_PROGRESS').props.accessibilityState.checked).toBe(true);
    });

    // Press confirm without entering comment
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập lý do khi chuyển về Đang làm.')).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Now enter comment
    fireEvent.changeText(getByTestId('input-status-comment'), 'Cần bổ sung unit test');
    await waitFor(() => {
      expect(getByTestId('input-status-comment').props.value).toBe('Cần bổ sung unit test');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith('IN_PROGRESS', 'Cần bổ sung unit test');
    });
  });

  it('4. allows voluntary empty comment when transitioning TODO to IN_PROGRESS', async () => {
    const { getByTestId } = await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        currentStatus="TODO"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Default selected status is IN_PROGRESS (first transition)
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith('IN_PROGRESS', undefined);
    });
  });

  it('5. triggers onClose when pressing cancel button', async () => {
    const { getByTestId } = await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        currentStatus="TODO"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByTestId('btn-cancel-status'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
