import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../../src/shared/components/ErrorState';
import { renderWithProviders } from '../test-utils';

describe('ErrorState Component', () => {
  test('renders error title, message, and alert role', async () => {
    const { getByText, getByRole } = await renderWithProviders(
      <ErrorState
        title="Lỗi kết nối"
        message="Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền."
      />
    );

    expect(getByText('Lỗi kết nối')).toBeTruthy();
    expect(getByText('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.')).toBeTruthy();
    expect(getByRole('alert')).toBeTruthy();
  });

  test('calls onRetry callback when retry button is pressed', async () => {
    const handleRetry = jest.fn();
    const { getByText, getByRole } = await renderWithProviders(
      <ErrorState
        message="Có lỗi xảy ra"
        onRetry={handleRetry}
        retryTitle="Thử lại ngay"
      />
    );

    expect(getByText('Thử lại ngay')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test('renders traceId caption when provided', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <ErrorState
        message="Hệ thống bận"
        traceId="REQ-9921-X"
      />
    );

    expect(getByText('Mã tham chiếu: REQ-9921-X')).toBeTruthy();
    expect(queryByText('Mã lỗi: REQ-9921-X')).toBeNull();
  });

  test('does not render button when onRetry is omitted', async () => {
    const { queryByRole } = await renderWithProviders(
      <ErrorState message="Lỗi không thể phục hồi" />
    );

    expect(queryByRole('button')).toBeNull();
  });
});
