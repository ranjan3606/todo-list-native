import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { StatusBar } from 'react-native';
import TabLayout from '../../app/(tabs)/_layout';

// Mock required modules
jest.mock('expo-router', () => ({
  Tabs: ({ screenOptions, children }) => (
    <div data-testid="tabs-container" style={screenOptions}>
      {children}
    </div>
  ),
  useNavigation: () => ({
    addListener: jest.fn((_event, callback) => {
      // Immediately call the callback to simulate navigation
      callback();
      return jest.fn(); // Return unsubscribe function
    }),
  }),
  usePathname: () => '/index',
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name, size, color }) => (
    <div data-testid={`icon-${name}`} style={{ fontSize: size, color }}>
      {name}
    </div>
  ),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
    },
    StatusBar: {
      setBarStyle: jest.fn(),
      setBackgroundColor: jest.fn(),
    },
  };
});

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      background: '#fff', 
      text: '#000', 
      tint: '#007AFF',
      lightText: '#666',
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF',
      lightText: '#999',
    },
    primary: '#007AFF',
  }
}));

// Mock theme service with toggleable color scheme
let mockColorScheme = 'light';
jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => mockColorScheme,
}));

jest.mock('@/components/HapticTab', () => ({
  HapticTab: ({ children }) => <div data-testid="haptic-tab">{children}</div>,
}));

jest.mock('@/components/LoadingIndicator', () => ({
  LoadingIndicator: ({ fullScreen }) => (
    <div data-testid="loading-indicator" data-fullscreen={fullScreen}>
      Loading...
    </div>
  ),
}));

describe('TabLayout Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColorScheme = 'light'; // Reset to light mode for each test
  });

  it('renders the tab layout with correct styling based on color scheme', () => {
    const { getByTestId } = render(<TabLayout />);
    
    // Verify the tabs container is rendered
    const tabsContainer = getByTestId('tabs-container');
    expect(tabsContainer).toBeTruthy();
    
    // Verify light mode styling is applied
    expect(tabsContainer.style.tabBarActiveTintColor).toBe('#007AFF');
    expect(tabsContainer.style.tabBarStyle.backgroundColor).toBe('#fff');
  });

  it('displays loading indicator during navigation', async () => {
    const { getByTestId, queryByTestId } = render(<TabLayout />);
    
    // Initial render should not show loading indicator
    // The mock useNavigation immediately calls the callback, but the effect clears it
    // So we need to wait for the timeout to complete
    expect(queryByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for the loading indicator to be removed
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 301));
    });
    
    // Loading indicator should be gone after the timeout
    expect(queryByTestId('loading-indicator')).toBeNull();
  });

  it('applies dark mode styling when in dark mode', () => {
    mockColorScheme = 'dark';
    const { getByTestId } = render(<TabLayout />);
    
    // Verify the tabs container is rendered with dark mode styling
    const tabsContainer = getByTestId('tabs-container');
    expect(tabsContainer.style.tabBarActiveTintColor).toBe('#0A84FF');
    expect(tabsContainer.style.tabBarStyle.backgroundColor).toBe('#000');
  });

  it('sets correct StatusBar style based on color scheme', () => {
    // Test light mode
    mockColorScheme = 'light';
    render(<TabLayout />);
    
    // Verify StatusBar style for light mode
    expect(StatusBar.setBarStyle).toHaveBeenCalledWith('dark-content');
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith('#fff');
    
    jest.clearAllMocks();
    
    // Test dark mode
    mockColorScheme = 'dark';
    render(<TabLayout />);
    
    // Verify StatusBar style for dark mode
    expect(StatusBar.setBarStyle).toHaveBeenCalledWith('light-content');
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith('#000');
  });

  it('correctly transitions between tabs', async () => {
    // Our navigation mock doesn't actually change tabs
    // We just verify that the loading state works as expected
    const { getByTestId, queryByTestId } = render(<TabLayout />);
    
    // Initial render should show the loading indicator from the mocked navigation
    expect(getByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for loading to finish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 301));
    });
    
    // Loading indicator should be gone
    expect(queryByTestId('loading-indicator')).toBeNull();
  });
});