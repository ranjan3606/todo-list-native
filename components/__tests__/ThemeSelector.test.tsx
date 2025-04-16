import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeSelector } from '../ThemeSelector';

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

// Mock storage services
jest.mock('@/services/storage', () => ({
  getTags: jest.fn(() => Promise.resolve({})),
  saveTags: jest.fn(() => Promise.resolve())
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

// Mock Colors with exact structure needed
jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      buttonBackground: '#f0f0f0', 
      text: '#000',
      cardBackground: '#fff',
      lightText: '#777'
    },
    dark: { 
      buttonBackground: '#333', 
      text: '#fff',
      cardBackground: '#222',
      lightText: '#aaa'
    },
    primary: '#007aff',
  }
}));

// Mock translations
jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations = {
        'settings.theme.light': 'Light',
        'settings.theme.dark': 'Dark',
        'settings.theme.system': 'System',
      };
      return translations[key] || key;
    }
  })
}));

describe('ThemeSelector', () => {
  const mockOnThemeChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(
      <ThemeSelector 
        currentTheme="system" 
        colorScheme="light" 
        onThemeChange={mockOnThemeChange} 
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('displays the system theme option as selected when theme is system', () => {
    const { getByText } = render(
      <ThemeSelector 
        currentTheme="system" 
        colorScheme="light" 
        onThemeChange={mockOnThemeChange} 
      />
    );
    
    // Get the parent TouchableOpacity of the system option
    const systemElement = getByText('System');
    const systemTouchable = systemElement.parent?.parent;
    
    // Check that it has the selectedOption style (has borderColor property)
    expect(systemTouchable?.props.style).toEqual(
      expect.objectContaining({ 
        borderWidth: 2,
        borderColor: '#007aff'
      })
    );
  });

  it('displays the light theme option as selected when theme is light', () => {
    const { getByText } = render(
      <ThemeSelector 
        currentTheme="light" 
        colorScheme="light" 
        onThemeChange={mockOnThemeChange} 
      />
    );
    
    // Get the parent TouchableOpacity of the light option
    const lightElement = getByText('Light');
    const lightTouchable = lightElement.parent?.parent;
    
    // Check that it has the selectedOption style (has borderColor property)
    expect(lightTouchable?.props.style).toEqual(
      expect.objectContaining({ 
        borderWidth: 2,
        borderColor: '#007aff'
      })
    );
  });

  it('displays the dark theme option as selected when theme is dark', () => {
    const { getByText } = render(
      <ThemeSelector 
        currentTheme="dark" 
        colorScheme="light" 
        onThemeChange={mockOnThemeChange} 
      />
    );
    
    // Get the parent TouchableOpacity of the dark option
    const darkElement = getByText('Dark');
    const darkTouchable = darkElement.parent?.parent;
    
    // Check that it has the selectedOption style (has borderColor property)
    expect(darkTouchable?.props.style).toEqual(
      expect.objectContaining({ 
        borderWidth: 2,
        borderColor: '#007aff'
      })
    );
  });

  it('calls onThemeChange when a theme option is clicked', () => {
    const { getByText } = render(
      <ThemeSelector 
        currentTheme="system" 
        colorScheme="light" 
        onThemeChange={mockOnThemeChange} 
      />
    );
    
    // Click the light theme option
    fireEvent.press(getByText('Light').parent?.parent);
    
    // onThemeChange should be called with 'light'
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
    
    // Click the dark theme option
    fireEvent.press(getByText('Dark').parent?.parent);
    
    // onThemeChange should be called with 'dark'
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
    
    // Click the system theme option
    fireEvent.press(getByText('System').parent?.parent);
    
    // onThemeChange should be called with 'system'
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });
});