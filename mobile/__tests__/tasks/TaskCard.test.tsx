/**
 * Phase 15C: TaskCard Component Tests
 * Verifies:
 * - Canonical field rendering (title, project name, progress, dates, assignees, subtasks, comments)
 * - Task StatusBadge presentation
 * - PriorityBadge presentation
 * - Defensive progress clamping (0..100)
 * - Due date and overdue indicator
 * - Absolute exclusion of raw UUIDs
 * - Interactive capability: button role & onPress callback with task.id
 * - Accessible summary completeness
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../../src/features/tasks/components/TaskCard';
import { TaskSummary } from '../../src/features/tasks/api/taskTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

describe('TaskCard Component (SCR-TSK-01 / Phase 15C)', () => {
  const baseTask: TaskSummary = {
    id: '11111111-2222-3333-4444-555555555555',
    project: {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      code: 'PRJ-101',
      name: 'Mobile Core Engineering',
    },
    parentTaskId: '99999999-8888-7777-6666-555555555555',
    title: 'Design Task List UI Wireframe',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progressPercent: 65,
    assignees: [
      {
        id: 'usr-1111-2222',
        fullName: 'Nguyễn Văn Dev',
        avatarUrl: null,
      },
      {
        id: 'usr-3333-4444',
        fullName: 'Trần Thị Reviewer',
        avatarUrl: null,
      },
    ],
    reporter: {
      id: 'usr-5555-6666',
      fullName: 'Phạm Leader',
    },
    dueDate: '2026-11-30T17:00:00Z',
    overdue: false,
    subtaskCount: 4,
    completedSubtaskCount: 2,
    commentCount: 3,
    attachmentCount: 1,
    updatedAt: '2026-10-20T10:00:00Z',
  };

  const renderCard = async (
    task: TaskSummary,
    testID?: string,
    onPress?: (taskId: string) => void
  ) => {
    return await render(
      <AppProviders>
        <TaskCard task={task} testID={testID} onPress={onPress} />
      </AppProviders>
    );
  };

  it('1. renders all canonical fields correctly', async () => {
    const { getByText, queryByText } = await renderCard(baseTask);

    // Project name & Title
    expect(getByText('Mobile Core Engineering')).toBeTruthy();
    expect(getByText('Design Task List UI Wireframe')).toBeTruthy();

    // Badges: Task status (IN_PROGRESS -> 'Đang làm') and priority (HIGH -> 'Cao')
    expect(getByText('Đang làm')).toBeTruthy();
    expect(getByText('Cao')).toBeTruthy();

    // Progress
    expect(getByText('65%')).toBeTruthy();

    // Assignee summary
    expect(getByText('Nguyễn Văn Dev +1')).toBeTruthy();

    // Formatted date (30/11/2026)
    expect(getByText('Hạn: 30/11/2026')).toBeTruthy();

    // Subtask count & comment count
    expect(getByText('2/4 việc con')).toBeTruthy();
    expect(getByText('3 bình luận')).toBeTruthy();

    // Security: Zero raw UUIDs rendered
    expect(queryByText(baseTask.id)).toBeNull();
    expect(queryByText(baseTask.project.id)).toBeNull();
    expect(queryByText(baseTask.parentTaskId!)).toBeNull();
    expect(queryByText(baseTask.reporter!.id)).toBeNull();
  });

  it('2. interactive in 15C: has button accessibilityRole and triggers onPress with exact task.id', async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await renderCard(baseTask, 'test-card', mockOnPress);
    const card = getByTestId('test-card');

    expect(card.props.accessibilityRole).toBe('button');

    fireEvent.press(card);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(baseTask.id);
  });

  it('3. renders overdue indicator and text when task is overdue', async () => {
    const overdueTask: TaskSummary = {
      ...baseTask,
      dueDate: '2026-10-10T00:00:00Z',
      overdue: true,
    };

    const { getByText } = await renderCard(overdueTask);
    expect(getByText('Quá hạn: 10/10/2026')).toBeTruthy();
  });

  it('4. defensively clamps progressPercent between 0 and 100', async () => {
    const overflowTask: TaskSummary = {
      ...baseTask,
      progressPercent: 145,
    };

    const { getByText } = await renderCard(overflowTask);
    expect(getByText('100%')).toBeTruthy();

    const underflowTask: TaskSummary = {
      ...baseTask,
      progressPercent: -15,
    };

    const { getByText: getByTextUnderflow } = await renderCard(underflowTask);
    expect(getByTextUnderflow('0%')).toBeTruthy();
  });

  it('5. handles single assignee and empty assignee list cleanly', async () => {
    const singleAssigneeTask: TaskSummary = {
      ...baseTask,
      assignees: [{ id: 'u1', fullName: 'Độc Thân', avatarUrl: null }],
    };

    const { getByText: getByTextSingle } = await renderCard(singleAssigneeTask);
    expect(getByTextSingle('Độc Thân')).toBeTruthy();

    const emptyAssigneeTask: TaskSummary = {
      ...baseTask,
      assignees: [],
    };

    const { getByText: getByTextEmpty } = await renderCard(emptyAssigneeTask);
    expect(getByTextEmpty('Chưa phân công')).toBeTruthy();
  });

  it('6. provides complete accessible summary including progress, status, priority, and date', async () => {
    const { getByTestId } = await renderCard(baseTask, 'accessible-card');
    const card = getByTestId('accessible-card');

    const accessibilityLabel = card.props.accessibilityLabel;
    expect(accessibilityLabel).toContain('Công việc: Design Task List UI Wireframe');
    expect(accessibilityLabel).toContain('Dự án: Mobile Core Engineering');
    expect(accessibilityLabel).toContain('Trạng thái: IN_PROGRESS');
    expect(accessibilityLabel).toContain('Độ ưu tiên: HIGH');
    expect(accessibilityLabel).toContain('Tiến độ: 65%');
    expect(accessibilityLabel).toContain('Hạn chót: 30/11/2026');
  });
});
