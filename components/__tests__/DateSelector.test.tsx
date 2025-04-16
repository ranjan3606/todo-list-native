import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateSelector } from '../TaskForm';

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

// Mock CalendarPicker component
jest.mock('react-native-calendar-picker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return function MockCalendarPicker(props: any) {
    return (
      <View testID="calendar-picker">
        <TouchableOpacity 
          testID="select-date-button" 
          onPress={() => props.onDateChange(new Date('2025-05-01'))}
        >
          <Text>Select Date</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock FontAwesome component
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    FontAwesome: function MockFontAwesome(props: any) {
      return <View {...props} testID={`icon-${props.name}`} />;
    }
  };
});

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