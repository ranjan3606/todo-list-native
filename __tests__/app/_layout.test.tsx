import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../../app/_layout';

// Mock required modules
jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

jest.mock('react-native-reanimated', () => ({}));

jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
}));

jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: jest.fn(({ children }) => children),
}));

jest.mock('@react-navigation/native', () => ({
  DarkTheme: {},
  DefaultTheme: {},
  ThemeProvider: jest.fn(({ children }) => children),
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
  useThemeLoading: () => false,
}));

jest.mock('@/components/LoadingIndicator', () => ({
  LoadingIndicator: jest.fn(() => null),
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      background: '#fff', 
      text: '#000', 
      tint: '#007AFF',
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF',
    },
  }
}));

jest.mock('@/i18n', () => ({
  TranslationProvider: jest.fn(({ children }) => children),
}));

jest.mock('@/services/notifications', () => ({
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
  configureNotificationCategories: jest.fn(() => Promise.resolve()),
  setupNotificationResponseHandlers: jest.fn(() => jest.fn()),
}));

jest.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    updateTodo: jest.fn(),
  }),
}));

jest.mock('@/components/ui/common/Toast', () => ({
  Toast: jest.fn(() => null),
}));

jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
}));

// Needed to avoid log warning
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  ignoreLogs: jest.fn(),
}));

describe('RootLayout', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });
  
  it('renders with theme loading state', () => {
    jest.spyOn(require('@/services/theme'), 'useThemeLoading').mockReturnValue(true);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });
});