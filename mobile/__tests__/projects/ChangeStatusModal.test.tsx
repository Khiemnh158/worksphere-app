import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { ChangeStatusModal } from '../../src/features/projects/components/ChangeStatusModal';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { renderWithProviders } from '../test-utils';
import { ProjectDetail } from '../../src/features/projects/api/projectTypes';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/projects/api/projectApi');

describe('ChangeStatusModal (SCR-PRJ-05)', () => {
  const mockOnSuccess = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnConflictReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = async (currentStatus = 'ACTIVE' as any) => {
    return await renderWithProviders(
      <ChangeStatusModal
        visible={true}
        projectId="proj-1"
        currentStatus={currentStatus}
        version={5}
        onSuccess={mockOnSuccess}
        onClose={mockOnClose}
        onConflictReload={mockOnConflictReload}
        testID="test-status-modal"
      />
    );
  };

  it('1. renders current status and allowed target status options for ACTIVE', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderModal('ACTIVE');

    expect(getByTestId('test-status-modal')).toBeTruthy();
    expect(getByText('Đổi trạng thái dự án')).toBeTruthy();
    expect(getByTestId('test-status-modal-current-status')).toBeTruthy();

    // Allowed targets for ACTIVE: ON_HOLD, COMPLETED, CANCELLED
    expect(getByTestId('test-status-modal-target-on_hold')).toBeTruthy();
    expect(getByTestId('test-status-modal-target-completed')).toBeTruthy();
    expect(getByTestId('test-status-modal-target-cancelled')).toBeTruthy();

    // DRAFT must NOT be allowed from ACTIVE
    expect(queryByTestId('test-status-modal-target-draft')).toBeNull();
  });

  it('2. shows terminal explanation and no target options when currentStatus is COMPLETED', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderModal('COMPLETED');

    expect(getByTestId('test-status-modal-terminal-notice')).toBeTruthy();
    expect(getByText('Dự án đã ở trạng thái kết thúc (Hoàn thành), không thể chuyển sang trạng thái khác.')).toBeTruthy();

    expect(queryByTestId('test-status-modal-targets-group')).toBeNull();
    expect(queryByTestId('test-status-modal-confirm-btn')).toBeNull();
  });

  it('3. requires selecting a target status before submitting', async () => {
    const { getByTestId } = await renderModal('ACTIVE');

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-confirm-btn'));
    });

    expect(projectApi.changeProjectStatus).not.toHaveBeenCalled();
  });

  it('4. submits status change successfully with version and calls onSuccess', async () => {
    const mockUpdatedProject: ProjectDetail = {
      id: 'proj-1',
      code: 'PRJ-1',
      name: 'Project One',
      description: null,
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      manager: { id: 'u1', fullName: 'User One', avatarUrl: null },
      department: null,
      startDate: '2026-01-01',
      plannedEndDate: '2026-12-31',
      actualEndDate: null,
      progressPercent: 10,
      memberCount: 2,
      milestones: [],
      recentTasks: [],
      allowedActions: ['UPDATE', 'CHANGE_STATUS'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      version: 6,
    };
    (projectApi.changeProjectStatus as jest.Mock).mockResolvedValueOnce(mockUpdatedProject);

    const { getByTestId } = await renderModal('ACTIVE');

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-target-on_hold'));
      fireEvent.changeText(getByTestId('test-status-modal-reason-input'), 'Tạm dừng chờ ngân sách');
    });

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-confirm-btn'));
    });

    await waitFor(() => {
      expect(projectApi.changeProjectStatus).toHaveBeenCalledWith('proj-1', {
        status: 'ON_HOLD',
        reason: 'Tạm dừng chờ ngân sách',
        version: 5,
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUpdatedProject);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('5. handles 409 OPTIMISTIC_LOCK_CONFLICT error with reload action', async () => {
    (projectApi.changeProjectStatus as jest.Mock).mockRejectedValueOnce({
      status: 409,
      code: 'OPTIMISTIC_LOCK_CONFLICT',
      message: 'Conflict',
    });

    const { getByTestId, getByText } = await renderModal('ACTIVE');

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-target-cancelled'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-confirm-btn'));
    });

    await waitFor(() => {
      expect(getByTestId('test-status-modal-error-banner')).toBeTruthy();
      expect(getByText('Trạng thái dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu.')).toBeTruthy();
      expect(getByTestId('test-status-modal-reload-btn')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('test-status-modal-reload-btn'));
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConflictReload).toHaveBeenCalled();
  });
});
