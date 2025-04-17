import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguageSelector } from '../LanguageSelector';

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

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: function MockFontAwesome(props: any) {
    return null; // Simple mock that doesn't try to load any fonts
  }
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { cardBackground: '#fff', text: '#000' },
    dark: { cardBackground: '#222', text: '#fff' },
    primary: '#007aff',
  }
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'en',
    setLanguage: jest.fn(),
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' }
    ],
    t: (key: string) => key
  })
}));

describe('LanguageSelector', () => {
  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(<LanguageSelector colorScheme="light" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('displays all available languages', () => {
    const { getByText } = render(<LanguageSelector colorScheme="light" />);
    
    // All three languages should be present
    expect(getByText('English')).toBeTruthy();
    expect(getByText('Español')).toBeTruthy();
    expect(getByText('Français')).toBeTruthy();
  });

  it('marks current language as selected', () => {
    const { getByText, getByTestId } = render(<LanguageSelector colorScheme="light" />);
    
    // English should be selected (wrapper should have a border)
    const englishOption = getByTestId('language-option-en');
    expect(englishOption.props.style).toEqual(
      expect.objectContaining({ borderColor: expect.anything() })
    );
  });

  it('calls setLanguage when a language option is clicked', () => {
    const mockSetLanguage = jest.fn();
    
    // Override the mock implementation just for this test
    jest.spyOn(require('@/i18n'), 'useTranslation').mockImplementation(() => ({
      language: 'en',
      setLanguage: mockSetLanguage,
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' }
      ],
      t: (key: string) => key
    }));
    
    const { getByText } = render(<LanguageSelector colorScheme="light" />);
    
    // Click on Spanish
    fireEvent.press(getByText('Español'));
    
    // setLanguage should be called with 'es'
    expect(mockSetLanguage).toHaveBeenCalledWith('es');
    
    // Click on French
    fireEvent.press(getByText('Français'));
    
    // setLanguage should be called with 'fr'
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });

  it('applies correct theme styles based on colorScheme prop', () => {
    // Test with light mode
    const { rerender, getByTestId } = render(<LanguageSelector colorScheme="light" />);
    
    const lightOption = getByTestId('language-option-en');
    expect(lightOption.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#fff' })
    );
    
    // Re-render with dark mode
    rerender(<LanguageSelector colorScheme="dark" />);
    
    const darkOption = getByTestId('language-option-en');
    expect(darkOption.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#222' })
    );
  });
});