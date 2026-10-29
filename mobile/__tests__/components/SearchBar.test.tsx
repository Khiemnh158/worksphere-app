import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SearchBar } from '../../src/shared/components/SearchBar';
import { renderWithProviders } from '../test-utils';

describe('SearchBar Component', () => {
  test('renders placeholder and accessible search role', async () => {
    const { getByPlaceholderText, getByRole } = await renderWithProviders(
      <SearchBar
        value=""
        onChangeText={jest.fn()}
        placeholder="Tìm kiếm công việc..."
      />
    );

    expect(getByPlaceholderText('Tìm kiếm công việc...')).toBeTruthy();
    expect(getByRole('search')).toBeTruthy();
  });

  test('calls onChangeText when user types in search input', async () => {
    const handleChangeText = jest.fn();
    const { getByRole } = await renderWithProviders(
      <SearchBar
        value="dự án"
        onChangeText={handleChangeText}
      />
    );

    fireEvent.changeText(getByRole('search'), 'dự án backend');
    expect(handleChangeText).toHaveBeenCalledWith('dự án backend');
  });

  test('shows clear button only when value is not empty and clears on press', async () => {
    const handleChangeText = jest.fn();
    const handleClear = jest.fn();

    // With empty value, clear button is not present
    const { queryByRole, rerender } = await renderWithProviders(
      <SearchBar
        value=""
        onChangeText={handleChangeText}
        onClear={handleClear}
      />
    );
    expect(queryByRole('button')).toBeNull();

    // With non-empty value, clear button appears
    await rerender(
      <SearchBar
        value="từ khóa"
        onChangeText={handleChangeText}
        onClear={handleClear}
      />
    );

    const clearButton = queryByRole('button');
    expect(clearButton).toBeTruthy();
    expect(clearButton?.props.accessibilityLabel).toBe('Xóa tìm kiếm');

    fireEvent.press(clearButton!);
    expect(handleChangeText).toHaveBeenCalledWith('');
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
