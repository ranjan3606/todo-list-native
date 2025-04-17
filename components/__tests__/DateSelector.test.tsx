// First, define manual mocks for React Native components
// Note: This needs to happen before any imports that might use react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios || obj.default)
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: function Modal({ children, visible }) { return visible ? children : null; },
  Button: 'Button',
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => style) // Add flatten function
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 }))
  }
}));

// Mock expo-haptics - needed for dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn()
}));

// Mock expo modules
jest.mock('expo-device', () => ({
  isDevice: true,
  getDeviceTypeAsync: jest.fn(() => Promise.resolve('PHONE')),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'EXPO_PUSH_TOKEN' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
}));

// Mock AsyncStorage
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

// Use a direct implementation for the CalendarPicker mock without referencing external React
jest.mock('react-native-calendar-picker', () => {
  return jest.fn(props => {
    // Define React locally within the mock
    const mockReact = require('react');
    return mockReact.createElement(
      'View', 
      { testID: 'calendar-picker' },
      mockReact.createElement(
        'TouchableOpacity',
        { 
          testID: 'select-date-button',
          onPress: () => props.onDateChange(new Date('2025-05-01'))
        },
        mockReact.createElement('Text', null, 'Select Date')
      )
    );
  });
});

// Similarly for FontAwesome
jest.mock('@expo/vector-icons', () => ({
  FontAwesome: jest.fn(props => {
    const mockReact = require('react');
    return mockReact.createElement(
      'View', 
      { ...props, testID: `icon-${props.name}` }
    );
  })
}));

// Now import React after all mocks have been defined
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateSelector } from '../TaskForm';

describe('DateSelector', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(<DateSelector {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('selects today when today button is pressed', () => {
    const { getByText } = render(<DateSelector {...defaultProps} />);
    
    // Create a fixed date for April 16, 2025
    const OriginalDate = global.Date;
    const mockDate = new Date('2025-04-16T00:00:00.000Z');
    
    // Mock Date constructor and methods
    global.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new OriginalDate(...args);
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
    
    // Keep the original prototype
    global.Date.prototype = OriginalDate.prototype;
    
    fireEvent.press(getByText('Today'));
    
    // Reset Date mock
    global.Date = OriginalDate;
    
    // onChange should be called with the current date
    expect(mockOnChange).toHaveBeenCalledWith('2025-04-16');
  });

  it('selects tomorrow when tomorrow button is pressed', () => {
    const { getByText } = render(<DateSelector {...defaultProps} />);
    
    // Create a fixed date for April 16, 2025
    const OriginalDate = global.Date;
    const mockDate = new Date('2025-04-16T00:00:00.000Z');
    const tomorrowDate = new Date('2025-04-17T00:00:00.000Z');
    
    // Mock Date with proper implementation for tomorrow calculation
    global.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new OriginalDate(...args);
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
    
    // Keep the original prototype to ensure methods like setDate work
    global.Date.prototype = OriginalDate.prototype;
    
    // Mock toISOString for both today and tomorrow
    const originalToISOString = global.Date.prototype.toISOString;
    global.Date.prototype.toISOString = function() {
      if (this.getDate() === mockDate.getDate()) {
        return '2025-04-16T00:00:00.000Z';
      } else if (this.getDate() === mockDate.getDate() + 1) {
        return '2025-04-17T00:00:00.000Z';
      }
      return originalToISOString.call(this);
    };
    
    // Spy on the actual implementation
    const spy = jest.spyOn(global.Date.prototype, 'setDate');
    
    fireEvent.press(getByText('Tomorrow'));
    
    // Restore original methods
    global.Date.prototype.toISOString = originalToISOString;
    spy.mockRestore();
    global.Date = OriginalDate;
    
    // Check that onChange was called with tomorrow's date
    expect(mockOnChange).toHaveBeenCalledWith('2025-04-17');
  });

  it('shows calendar when custom button is pressed', () => {
    const { getByText, queryByTestId } = render(<DateSelector {...defaultProps} />);
    
    // Initially, the calendar should not be visible
    expect(queryByTestId('calendar-picker')).toBeNull();
    
    // Press the Custom button
    fireEvent.press(getByText('Custom'));
    
    // Now a calendar picker should appear
    const calendar = queryByTestId('calendar-picker');
    expect(calendar).toBeTruthy();
  });

  it('correctly formats display date', () => {
    const { getByText } = render(<DateSelector value="2025-04-16" onChange={mockOnChange} />);
    
    // Check that the formatted date is displayed
    const selectedDateText = getByText('Selected:', { exact: false });
    expect(selectedDateText.props.children).toEqual(['Selected: ', 'Wed, Apr 16']);
  });

  it('selects date from calendar picker', () => {
    const { getByText, getByTestId } = render(<DateSelector {...defaultProps} />);
    
    // Open the calendar
    fireEvent.press(getByText('Custom'));
    
    // Select a date from the calendar picker
    fireEvent.press(getByTestId('select-date-button'));
    
    // Check if onChange was called with the selected date
    expect(mockOnChange).toHaveBeenCalledWith('2025-05-01');
  });
});