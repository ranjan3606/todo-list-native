import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ReminderSelector } from '../TaskForm';

import * as Notifications from 'expo-notifications';

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

// Mock expo-notifications to prevent warning
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
}));

// Mock FontAwesome component
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FontAwesome: function MockFontAwesome(props: any) {
      return React.createElement(View, {...props, testID: `icon-${props.name}`});
    }
  };
});

describe('ReminderSelector', () => {
  const mockOnToggle = jest.fn();
  const mockOnTimeChange = jest.fn();
  const defaultProps = {
    enabled: false,
    onToggle: mockOnToggle,
    reminderTime: '09:00',
    onTimeChange: mockOnTimeChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with reminders disabled', () => {
    const { getByText, queryByText } = render(<ReminderSelector {...defaultProps} />);
    
    // Check that the main toggle element is rendered
    expect(getByText('Reminder Notification:')).toBeTruthy();
    
    // Time presets should not be visible when disabled
    expect(queryByText('9:00 AM')).toBeNull();
    expect(queryByText('12:00 PM')).toBeNull();
    expect(queryByText('6:00 PM')).toBeNull();
    expect(queryByText('Custom Time')).toBeNull();
  });

  it('toggles reminders on', () => {
    const { getByText, UNSAFE_getAllByType } = render(<ReminderSelector {...defaultProps} />);
    
    // Find the Switch component and toggle it
    const switchComponent = UNSAFE_getAllByType(Switch)[0];
    fireEvent(switchComponent, 'valueChange', true);
    
    // Check that the toggle callback was called with correct value
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('renders time options when enabled', () => {
    const { getByText } = render(<ReminderSelector {...{...defaultProps, enabled: true}} />);
    
    // Time presets should be visible when enabled
    expect(getByText('9:00 AM')).toBeTruthy();
    expect(getByText('12:00 PM')).toBeTruthy();
    expect(getByText('6:00 PM')).toBeTruthy();
    expect(getByText('Custom Time')).toBeTruthy();
  });

  it('selects preset times correctly', () => {
    const { getByText } = render(<ReminderSelector {...{...defaultProps, enabled: true}} />);
    
    // Select 12:00 PM
    fireEvent.press(getByText('12:00 PM'));
    expect(mockOnTimeChange).toHaveBeenCalledWith('12:00');
    
    // Select 6:00 PM
    fireEvent.press(getByText('6:00 PM'));
    expect(mockOnTimeChange).toHaveBeenCalledWith('18:00');
  });

  it('shows reminder time in AM/PM format', () => {
    const { getByText } = render(
      <ReminderSelector 
        enabled={true} 
        onToggle={mockOnToggle} 
        reminderTime="14:30" 
        onTimeChange={mockOnTimeChange} 
      />
    );
    
    // Should show the formatted time
    expect(getByText("You'll be reminded at 2:30 PM")).toBeTruthy();
  });

  it('opens custom time picker modal', () => {
    const { getByText, UNSAFE_getByType } = render(
      <ReminderSelector 
        enabled={true} 
        onToggle={mockOnToggle} 
        reminderTime="09:00" 
        onTimeChange={mockOnTimeChange} 
      />
    );
    
    // Open custom time picker
    fireEvent.press(getByText('Custom Time'));
    
    // Modal should be open with title
    expect(getByText('Select Custom Time')).toBeTruthy();
  });

  fit('calls notification API when time is selected', () => {
    const { getByText } = render(<ReminderSelector {...{...defaultProps, enabled: true}} />);
    
    // Select a time
    fireEvent.press(getByText('12:00 PM'));
    
    // First verify the time change callback was called
    expect(mockOnTimeChange).toHaveBeenCalledWith('12:00');
    
    // Then verify the notification API was called
    // Note: This assumes your component schedules a notification when time changes
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
});