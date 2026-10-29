import React from 'react';
import { LoadingIndicator } from '../../src/shared/components/LoadingIndicator';
import { renderWithProviders } from '../test-utils';

describe('LoadingIndicator Component', () => {
  test('renders with progressbar role and busy accessibility state', async () => {
    const { getByRole, getByTestId } = await renderWithProviders(
      <LoadingIndicator testID="spinner" />
    );

    const indicator = getByRole('progressbar');
    expect(indicator).toBeTruthy();
    expect(indicator.props.accessibilityState).toEqual({ busy: true });
    expect(getByTestId('spinner')).toBeTruthy();
  });

  test('displays optional message when provided', async () => {
    const { getByText } = await renderWithProviders(
      <LoadingIndicator message="Đang nạp danh sách dự án..." />
    );

    expect(getByText('Đang nạp danh sách dự án...')).toBeTruthy();
  });

  test('renders in fullScreen mode without crash', async () => {
    const { getByRole } = await renderWithProviders(
      <LoadingIndicator fullScreen={true} size="large" />
    );

    expect(getByRole('progressbar')).toBeTruthy();
  });
});
