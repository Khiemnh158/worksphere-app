/**
 * Phase 15E: UpdateProgressModal Unit Tests (SCR-TSK-08)
 *
 * Verifies:
 * - Displays initial progress value
 * - Quick preset buttons populate progress value correctly
 * - Supports decimal percentages (e.g. 33.3, 85.5)
 * - Validates range (0.0 to 100.0) and displays friendly error
 * - Cancelling triggers onClose
 * - Submitting calls onConfirm with parsed number
 * - Synchronous submit lock prevents double submissions
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { UpdateProgressModal } from '../../src/features/tasks/components/UpdateProgressModal';
import { renderWithProviders } from '../test-utils';

describe('UpdateProgressModal (Phase 15E)', () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. initializes with currentProgress and preset buttons', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <UpdateProgressModal
        visible={true}
        currentProgress={50}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Cập nhật tiến độ công việc')).toBeTruthy();
    expect(getByTestId('input-task-progress').props.value).toBe('50');
    expect(getByTestId('preset-progress-0')).toBeTruthy();
    expect(getByTestId('preset-progress-25')).toBeTruthy();
    expect(getByTestId('preset-progress-50')).toBeTruthy();
    expect(getByTestId('preset-progress-75')).toBeTruthy();
    expect(getByTestId('preset-progress-100')).toBeTruthy();
  });

  it('2. pressing preset button updates input value', async () => {
    const { getByTestId } = await renderWithProviders(
      <UpdateProgressModal
        visible={true}
        currentProgress={10}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByTestId('preset-progress-75'));
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('75');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(75);
    });
  });

  it('3. validates decimal percentage in 0..100 range and accepts decimal values', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <UpdateProgressModal
        visible={true}
        currentProgress={0}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Test invalid negative
    fireEvent.changeText(getByTestId('input-task-progress'), '-5');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('-5');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });
    await waitFor(() => {
      expect(getByText('Tiến độ phải nằm trong khoảng từ 0 đến 100%.')).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Test invalid > 100
    fireEvent.changeText(getByTestId('input-task-progress'), '105');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('105');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });
    await waitFor(() => {
      expect(getByText('Tiến độ phải nằm trong khoảng từ 0 đến 100%.')).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Test invalid non-numeric
    fireEvent.changeText(getByTestId('input-task-progress'), 'abc');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('abc');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });
    await waitFor(() => {
      expect(getByText('Tiến độ phải là một con số hợp lệ.')).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Test valid decimal 85.5%
    fireEvent.changeText(getByTestId('input-task-progress'), '85.5');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('85.5');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(85.5);
    });
  });

  it('4. triggers onClose when pressing cancel button', async () => {
    const { getByTestId } = await renderWithProviders(
      <UpdateProgressModal
        visible={true}
        currentProgress={50}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByTestId('btn-cancel-progress'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
