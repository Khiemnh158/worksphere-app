import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProjectCard } from '../../src/features/projects/components/ProjectCard';
import { ProjectSummary } from '../../src/features/projects/api/projectTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

describe('ProjectCard Component', () => {
  const mockProject: ProjectSummary = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    code: 'PRJ-2026-001',
    name: 'WorkSphere Platform Revamp',
    description: 'Xây dựng nền tảng quản trị công việc doanh nghiệp',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: 'e92d4fae-7dec-11d0-a765-00a0c91e6bf7',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    progressPercent: 75,
    memberCount: 8,
    taskSummary: {
      total: 30,
      completed: 22,
      overdue: 1,
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
  };

  it('renders all canonical project fields correctly with accessible summary', async () => {
    const { getByText, queryByText, getByTestId } = await render(
      <AppProviders>
        <ProjectCard project={mockProject} />
      </AppProviders>
    );

    expect(getByText('PRJ-2026-001')).toBeTruthy();
    expect(getByText('WorkSphere Platform Revamp')).toBeTruthy();
    expect(getByText('Xây dựng nền tảng quản trị công việc doanh nghiệp')).toBeTruthy();
    expect(getByText('Đang thực hiện')).toBeTruthy(); // StatusBadge
    expect(getByText('Cao')).toBeTruthy(); // PriorityBadge
    expect(getByText('Nguyễn Văn A')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('Hạn: 31/12/2026')).toBeTruthy();
    expect(getByText('8 người')).toBeTruthy();
    expect(getByText('22/30')).toBeTruthy();

    // Accessible container summary
    const card = getByTestId('project-card-prj-2026-001');
    expect(card.props.accessibilityLabel).toContain('Dự án PRJ-2026-001: WorkSphere Platform Revamp');
    expect(card.props.accessibilityLabel).toContain('Trạng thái: ACTIVE');
    expect(card.props.accessibilityLabel).toContain('Tiến độ: 75 phần trăm');
    expect(card.props.accessibilityLabel).toContain('Quản lý: Nguyễn Văn A');

    // Security check: raw UUIDs must NOT be rendered
    expect(queryByText('f81d4fae-7dec-11d0-a765-00a0c91e6bf6')).toBeNull();
    expect(queryByText('e92d4fae-7dec-11d0-a765-00a0c91e6bf7')).toBeNull();
  });

  it('is an interactive pressable with button role in Phase 14D and fires onPress with project.id', async () => {
    const handlePress = jest.fn();
    const { getByTestId } = await render(
      <AppProviders>
        <ProjectCard project={mockProject} onPress={handlePress} />
      </AppProviders>
    );

    const card = getByTestId('project-card-prj-2026-001');
    expect(card.props.accessibilityRole).toBe('button');

    fireEvent.press(card);
    expect(handlePress).toHaveBeenCalledTimes(1);
    expect(handlePress).toHaveBeenCalledWith('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
  });

  it('defensively clamps progress percentage to 0..100', async () => {
    const overflowProject = { ...mockProject, progressPercent: 120 };
    const { getByText } = await render(
      <AppProviders>
        <ProjectCard project={overflowProject} />
      </AppProviders>
    );

    expect(getByText('100%')).toBeTruthy();
  });
});

