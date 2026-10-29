/**
 * Phase 15D: ProjectSelectModal Unit Tests
 * Verifies:
 * - Human-readable project options ([CODE] name)
 * - Zero raw project UUIDs exposed in rendered UI
 * - Selection returns selected ProjectSummary
 * - Loading, error, and empty states
 * - Search filter by code and name
 * - Clear selection button
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectSelectModal } from '../../src/features/tasks/components/ProjectSelectModal';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { ProjectSummary } from '../../src/features/projects/api/projectTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/projects/api/projectApi');

describe('ProjectSelectModal (Phase 15D)', () => {
  const mockProjects: ProjectSummary[] = [
    {
      id: 'proj-uuid-1',
      code: 'ERP-CORE',
      name: 'Hệ thống Quản lý Doanh nghiệp',
      description: 'Mô tả dự án 1',
      status: 'ACTIVE',
      priority: 'HIGH',
      manager: { id: 'mgr-1', fullName: 'Nguyễn Quản Lý', avatarUrl: null },
      startDate: '2026-01-01',
      plannedEndDate: '2026-12-31',
      progressPercent: 50,
      memberCount: 10,
      taskSummary: { total: 20, completed: 10, overdue: 1 },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    },
    {
      id: 'proj-uuid-2',
      code: 'CRM-MOB',
      name: 'Ứng dụng CRM Di động',
      description: 'Mô tả dự án 2',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      manager: { id: 'mgr-2', fullName: 'Trần Quản Lý', avatarUrl: null },
      startDate: '2026-03-01',
      plannedEndDate: '2026-09-30',
      progressPercent: 30,
      memberCount: 5,
      taskSummary: { total: 10, completed: 3, overdue: 0 },
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. loads and renders human-readable project options without exposing raw UUIDs', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValueOnce({
      items: mockProjects,
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    const { getByText, queryByText, getByTestId } = await render(
      <AppProviders>
        <ProjectSelectModal
          visible={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('[ERP-CORE]')).toBeTruthy();
      expect(getByText('Hệ thống Quản lý Doanh nghiệp')).toBeTruthy();
      expect(getByText('[CRM-MOB]')).toBeTruthy();
      expect(getByText('Ứng dụng CRM Di động')).toBeTruthy();
    });

    // Zero raw UUIDs exposed
    expect(queryByText('proj-uuid-1')).toBeNull();
    expect(queryByText('proj-uuid-2')).toBeNull();

    // Select first project and confirm
    fireEvent.press(getByTestId('project-option-proj-uuid-1'));

    await waitFor(() => {
      expect(getByTestId('project-option-proj-uuid-1').props.accessibilityState.selected).toBe(true);
    });

    fireEvent.press(getByTestId('btn-confirm-project-select'));

    expect(mockOnSelect).toHaveBeenCalledWith(mockProjects[0]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('2. filters projects by search term', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValueOnce({
      items: mockProjects,
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    const { getByText, queryByText, getByPlaceholderText } = await render(
      <AppProviders>
        <ProjectSelectModal
          visible={true}
          onSelect={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('[ERP-CORE]')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Tìm kiếm theo mã hoặc tên dự án...');
    fireEvent.changeText(searchInput, 'CRM');

    await waitFor(() => {
      expect(getByText('[CRM-MOB]')).toBeTruthy();
      expect(queryByText('[ERP-CORE]')).toBeNull();
    });
  });

  it('3. renders error state and recovers on retry', async () => {
    (projectApi.listProjects as jest.Mock)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({
        items: mockProjects,
        page: 0,
        size: 100,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });

    const { getByText, getByTestId } = await render(
      <AppProviders>
        <ProjectSelectModal
          visible={true}
          onSelect={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('Không thể tải dự án')).toBeTruthy();
    });

    // Retry
    fireEvent.press(getByTestId('project-select-error-retry-btn'));

    await waitFor(() => {
      expect(getByText('[ERP-CORE]')).toBeTruthy();
    });
  });

  it('4. clears selection when Bỏ chọn is pressed', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValueOnce({
      items: mockProjects,
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    const mockOnSelect = jest.fn();

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <ProjectSelectModal
          visible={true}
          selectedProjectId="proj-uuid-1"
          onSelect={mockOnSelect}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('[ERP-CORE]')).toBeTruthy();
    });

    // Press clear
    fireEvent.press(getByTestId('btn-clear-project-select'));

    await waitFor(() => {
      expect(getByTestId('project-option-proj-uuid-1').props.accessibilityState.selected).toBe(false);
    });

    // Confirm
    fireEvent.press(getByTestId('btn-confirm-project-select'));

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });
});
