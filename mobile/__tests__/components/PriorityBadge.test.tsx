import React from 'react';
import { PriorityBadge } from '../../src/shared/components/PriorityBadge';
import { renderWithProviders } from '../test-utils';

describe('PriorityBadge Component', () => {
  test('maps LOW priority to Vietnamese label "Thấp"', async () => {
    const { getByText } = await renderWithProviders(
      <PriorityBadge priority="LOW" />
    );

    expect(getByText('Thấp')).toBeTruthy();
  });

  test('maps MEDIUM priority to Vietnamese label "Trung bình"', async () => {
    const { getByText } = await renderWithProviders(
      <PriorityBadge priority="MEDIUM" />
    );

    expect(getByText('Trung bình')).toBeTruthy();
  });

  test('maps HIGH priority to Vietnamese label "Cao"', async () => {
    const { getByText } = await renderWithProviders(
      <PriorityBadge priority="HIGH" />
    );

    expect(getByText('Cao')).toBeTruthy();
  });

  test('maps CRITICAL priority to Vietnamese label "Khẩn cấp"', async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <PriorityBadge priority="CRITICAL" />
    );

    expect(getByText('Khẩn cấp')).toBeTruthy();
    expect(getByTestId('priority-badge-critical')).toBeTruthy();
  });

  test('supports custom label override on canonical priority', async () => {
    const { getByText } = await renderWithProviders(
      <PriorityBadge priority="HIGH" label="Mức độ cao" />
    );

    expect(getByText('Mức độ cao')).toBeTruthy();
  });
});
