import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '../../app/+not-found';

// Mock required modules
jest.mock('expo-router', () => ({
  Link: jest.fn(({ children }) => children),
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      background: '#fff', 
      text: '#000', 
      tint: '#007AFF',
      lightText: '#666'
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF',
      lightText: '#999'
    },
    warning: '#f0ad4e',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'notFound.oops': 'Oops!',
        'notFound.title': 'Page Not Found',
        'notFound.description': 'The page you are looking for doesn\'t exist or has been moved.',
        'notFound.goBack': 'Go back home',
      };
      return translations[key] || key;
    }
  })
}));

describe('NotFoundScreen', () => {
  it('renders correctly', () => {
    const { toJSON, getByText } = render(<NotFoundScreen />);
    
    expect(toJSON()).toBeTruthy();
    expect(getByText('Page Not Found')).toBeTruthy();
    expect(getByText('The page you are looking for doesn\'t exist or has been moved.')).toBeTruthy();
    expect(getByText('Go back home')).toBeTruthy();
  });
  
  it('matches snapshot', () => {
    const { toJSON } = render(<NotFoundScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});