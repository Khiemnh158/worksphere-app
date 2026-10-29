import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { directoryApi } from '../../src/features/directory/api/directoryApi';
import { UserDirectoryItem } from '../../src/features/directory/api/directoryTypes';
import { UserPickerModal } from '../../src/features/directory/components/UserPickerModal';
import { PagedData } from '../../src/shared/api';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/directory/api/directoryApi');

describe('Phase 14E-G2: UserPickerModal Component', () => {
  const user1: UserDirectoryItem = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'alice_smith',
    fullName: 'Alice Smith',
    email: 'alice@worksphere.com',
    avatarUrl: null,
    departmentName: 'Kỹ thuật phần mềm',
  };

  const user2: UserDirectoryItem = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'bob_jones',
    fullName: 'Bob Jones',
    email: 'bob@worksphere.com',
    avatarUrl: null,
    departmentName: 'Quản trị nhân sự',
  };

  const page0Data: PagedData<UserDirectoryItem> = {
    items: [user1, user2],
    page: 0,
    size: 20,
    totalItems: 2,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. does not query directory when modal is hidden (visible=false)', async () => {
    await renderWithProviders(
      <UserPickerModal
        visible={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(directoryApi.searchUsers).not.toHaveBeenCalled();
  });

  it('2. queries directory and displays human identities without raw UUIDs when visible=true', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);

    const { getByText, queryByText } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Alice Smith')).toBeTruthy();
      expect(getByText('Bob Jones')).toBeTruthy();
    });

    // Secondary identities
    expect(getByText('@alice_smith • alice@worksphere.com')).toBeTruthy();
    expect(getByText('@bob_jones • bob@worksphere.com')).toBeTruthy();
    expect(getByText('Kỹ thuật phần mềm')).toBeTruthy();
    expect(getByText('Quản trị nhân sự')).toBeTruthy();

    // Verify ZERO raw UUIDs are rendered in any text node
    expect(queryByText('11111111-1111-1111-1111-111111111111')).toBeNull();
    expect(queryByText('22222222-2222-2222-2222-222222222222')).toBeNull();
  });

  it('3. supports single select mode and confirms selected user', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);
    const onConfirmMock = jest.fn();

    const { getByTestId } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        mode="single"
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith')).toBeTruthy();
    });

    // Tap Alice
    fireEvent.press(getByTestId('user-picker-item-alice_smith'));

    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith').props.accessibilityState.selected).toBe(true);
    });

    // Tap Confirm
    fireEvent.press(getByTestId('user-picker-confirm-btn'));

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith([user1]);
  });

  it('4. single select mode switches selection when another user is tapped', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);
    const onConfirmMock = jest.fn();

    const { getByTestId } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        mode="single"
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith')).toBeTruthy();
    });

    fireEvent.press(getByTestId('user-picker-item-alice_smith'));
    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith').props.accessibilityState.selected).toBe(true);
    });

    fireEvent.press(getByTestId('user-picker-item-bob_jones'));
    await waitFor(() => {
      expect(getByTestId('user-picker-item-bob_jones').props.accessibilityState.selected).toBe(true);
    });

    fireEvent.press(getByTestId('user-picker-confirm-btn'));

    expect(onConfirmMock).toHaveBeenCalledWith([user2]);
  });

  it('5. supports multi-select mode and toggles selections', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);
    const onConfirmMock = jest.fn();

    const { getByTestId, getByText } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        mode="multiple"
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith')).toBeTruthy();
    });

    // Select Alice
    fireEvent.press(getByTestId('user-picker-item-alice_smith'));
    await waitFor(() => {
      expect(getByText('Xác nhận (1)')).toBeTruthy();
    });

    // Select Bob
    fireEvent.press(getByTestId('user-picker-item-bob_jones'));
    await waitFor(() => {
      expect(getByText('Xác nhận (2)')).toBeTruthy();
    });

    // Deselect Alice
    fireEvent.press(getByTestId('user-picker-item-alice_smith'));
    await waitFor(() => {
      expect(getByText('Xác nhận (1)')).toBeTruthy();
    });

    // Confirm
    fireEvent.press(getByTestId('user-picker-confirm-btn'));

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith([user2]);
    });
  });

  it('6. respects disabledIds with disabled reason and prevents selection', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);
    const onConfirmMock = jest.fn();

    const { getByTestId, getByText } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        mode="multiple"
        disabledIds={[user1.id]}
        disabledReason="Đã là thành viên"
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-item-alice_smith')).toBeTruthy();
    });

    // Alice is disabled
    const aliceItem = getByTestId('user-picker-item-alice_smith');
    expect(aliceItem.props.accessibilityState.disabled).toBe(true);
    expect(getByText('Đã là thành viên')).toBeTruthy();

    // Tapping Alice does nothing
    fireEvent.press(aliceItem);

    // Confirm
    fireEvent.press(getByTestId('user-picker-confirm-btn'));
    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith([]);
    });
  });

  it('7. calls onCancel on close button and cancel button without calling onConfirm', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce(page0Data);
    const onConfirmMock = jest.fn();
    const onCancelMock = jest.fn();

    const { getByTestId } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-cancel-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('user-picker-cancel-btn'));
    await waitFor(() => {
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });
    expect(onConfirmMock).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('user-picker-close-btn'));
    await waitFor(() => {
      expect(onCancelMock).toHaveBeenCalledTimes(2);
    });
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('8. renders initial loading indicator while fetching', async () => {
    (directoryApi.searchUsers as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    const { getByTestId } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByTestId('user-picker-loading-indicator')).toBeTruthy();
  });

  it('9. renders EmptyState when directory has no users', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });

    const { getByTestId, getByText } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-empty-state')).toBeTruthy();
      expect(getByText('Không tìm thấy người dùng phù hợp.')).toBeTruthy();
    });
  });

  it('10. renders ErrorState on failure and triggers retry', async () => {
    (directoryApi.searchUsers as jest.Mock)
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { message: 'Server error' } },
      })
      .mockResolvedValueOnce(page0Data);

    const { getByTestId, getByText } = await renderWithProviders(
      <UserPickerModal
        visible={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('user-picker-error-state')).toBeTruthy();
    });

    // Press Retry
    fireEvent.press(getByText('Thử lại'));

    await waitFor(() => {
      expect(getByText('Alice Smith')).toBeTruthy();
    });
  });
});
