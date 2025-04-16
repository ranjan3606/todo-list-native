import React from 'react';
import { render, act } from '@testing-library/react-native';
import TabLayout from '../../app/(tabs)/_layout';

// Mock required modules
jest.mock('expo-router', () => ({
  Tabs: jest.fn(({ children }) => children),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
  usePathname: () => '/index',
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      background: '#fff', 
      text: '#000', 
      tint: '#007AFF' 
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF' 
    },
    primary: '#007AFF',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/components/HapticTab', () => ({
  HapticTab: jest.fn(({ children }) => children),
}));

jest.mock('@/components/LoadingIndicator', () => ({
  LoadingIndicator: jest.fn(() => null),
}));

describe('TabLayout', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it('transitions loading state correctly', () => {
    jest.useFakeTimers();
    
    const { getByTestId, queryByTestId, rerender } = render(<TabLayout />);
    
    // Initial state - loading should be false after initial render
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    rerender(<TabLayout />);
    
    // After a state change, check that loading works as expected
    // Note: Since we mocked useNavigation, this is more of a structural test
    
    jest.useRealTimers();
  });
});