import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TagItem } from '../TagItem';

// Mock expo-notifications to prevent deprecation warnings
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-push-token' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  dismissNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FontAwesome: function MockFontAwesome(props: any) {
      return React.createElement(View, {...props, testID: `icon-${props.name}`});
    }
  };
});

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => params ? `${key}:${JSON.stringify(params)}` : key
  })
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { cardBackground: '#fff', text: '#000', lightText: '#888' },
    dark: { cardBackground: '#000', text: '#fff', lightText: '#ccc' },
    primary: '#007bff',
  }
}));

describe('TagItem', () => {
  const baseProps = {
    tagName: 'work',
    keywords: ['job', 'office'],
    isActive: false,
    colorScheme: 'light' as const,
    onPress: jest.fn(),
    onEdit: jest.fn(),
  };

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<TagItem {...baseProps} onPress={onPress} />);
    fireEvent.press(getByText('work'));
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onEdit when edit button is pressed', () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(<TagItem {...baseProps} onEdit={onEdit} isActive={true} />);
    fireEvent.press(getByTestId('edit-tag-button'));
    expect(onEdit).toHaveBeenCalled();
  });
});
